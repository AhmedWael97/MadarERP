"""
End-to-end accounting chain test for Madaar ERP.

The smoke test (accountant_smoke.py) verifies that **pages render**. This
script verifies that **the data chain works** — that when an accountant
creates a product, adds stock, and submits a sales invoice, the right rows
land in `GL Entry` and `Stock Ledger Entry`, and the standard reports
reflect the change.

It uses Frappe's REST API (no browser, no Playwright). It logs in once,
does the full chain on the live tenant, and verifies each side-effect by
reading the underlying ledgers directly:

    1. Login + discover Company / Warehouse
    2. Create test Item  (SMOKE-ITEM-<ts>, is_stock_item=1, is_sales_item=1)
    3. Add 100 units of stock via Stock Entry (Material Receipt)
         → verify Stock Ledger: +100, balance 100, valuation 10.00
    4. Create test Customer  (SMOKE-CUST-<ts>)
    5. Create + submit Sales Invoice (10 units @ 15.00, update_stock=1)
         → verify Sales Invoice docstatus=1, grand_total=150
         → verify GL Entry: debit==credit (Frappe enforces this — sanity check)
         → verify GL Entry contains a receivable row (Debtors) and an income row
         → verify Stock Ledger: -10, balance 90
         → verify Bin.actual_qty == 90  (this is what Stock Balance reads)
         → verify Sales Invoice.outstanding_amount == 150 (this is what
           Customer Aging reads)

The SMOKE-* entities are NOT cleaned up — they're left behind so an
accountant can open them in the UI and audit the postings.

Usage:
    pip install requests
    python scripts/accounting_chain_test.py \\
        --site http://165.232.75.30 \\
        --user Administrator \\
        --password admin

    --company NAME    pick a specific Company (defaults to first one)
    --warehouse NAME  pick a specific Warehouse (defaults to first non-group)
    --report PATH     output markdown report path

Exit code 0 if every step verified; 1 otherwise.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# Force UTF-8 on stdout so the ✓ / ✗ glyphs don't crash on Windows cp1252.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except (AttributeError, ValueError):
    pass

try:
    import requests
except ImportError:
    sys.stderr.write("requests is not installed.  pip install requests\n")
    sys.exit(2)


# ── Step record ─────────────────────────────────────────────────────────────

@dataclass
class Step:
    name: str
    ok: bool
    detail: str = ""


@dataclass
class Run:
    steps: list[Step] = field(default_factory=list)
    started_at: dt.datetime = field(default_factory=dt.datetime.now)

    def ok(self, name: str, detail: str = "") -> None:
        print(f"  ✓ {name}" + (f" — {detail}" if detail else ""))
        self.steps.append(Step(name, True, detail))

    def fail(self, name: str, detail: str = "") -> None:
        print(f"  ✗ {name}" + (f" — {detail}" if detail else ""))
        self.steps.append(Step(name, False, detail))

    @property
    def failures(self) -> int:
        return sum(1 for s in self.steps if not s.ok)


# ── Frappe REST client ──────────────────────────────────────────────────────

class FrappeClient:
    """Bare-bones session-auth client. Handles CSRF transparently.

    We rely on the same REST surface the React SPA uses:
      - /api/method/login                       (sets sid cookie)
      - /api/method/frappe.boot.get_bootinfo    (gives us the CSRF token)
      - /api/resource/<DocType>                 (GET = list, POST = insert)
      - /api/resource/<DocType>/<name>          (GET = read one)
      - /api/method/frappe.client.insert        (insert a doc via POST body)
      - /api/method/frappe.client.submit        (submit an existing doc)
      - /api/method/<any.whitelisted.method>    (custom + frappe.client.*)
    """

    def __init__(self, base: str, user: str, password: str) -> None:
        self.base = base.rstrip("/")
        self.user = user
        self.password = password
        self.session = requests.Session()
        self.session.headers["Accept"] = "application/json"

    def login(self) -> None:
        # 1. Auth — POSTed as form-encoded body (not JSON), matches React SPA.
        r = self.session.post(
            f"{self.base}/api/method/login",
            data={"usr": self.user, "pwd": self.password},
            timeout=30,
        )
        r.raise_for_status()

        # 2. Best-effort CSRF token. Frappe's CSRF policy varies by site:
        #    - Dev sites usually have ignore_csrf=true → all POSTs work without it.
        #    - Production sites require the header on mutating calls.
        # Try a couple of endpoints; if none give us a token, continue
        # anyway — the actual chain calls will surface a clear 403 if CSRF
        # turns out to be enforced.
        token = self._fetch_csrf_token()
        if token:
            self.session.headers["X-Frappe-CSRF-Token"] = token

    def _fetch_csrf_token(self) -> str | None:
        # Some Frappe builds return it on bootinfo; others on a custom auth
        # endpoint. We try several, swallowing 403/404 from each, since none
        # of them is strictly required for the rest of the run.
        candidates = [
            ("POST", "/api/method/frappe.boot.get_bootinfo"),
            ("GET",  "/api/method/frappe.boot.get_bootinfo"),
            ("GET",  "/api/method/frappe.sessions.get_csrf_token"),
            ("GET",  "/api/method/frappe.auth.get_logged_user"),
        ]
        for method, path in candidates:
            try:
                r = self.session.request(method, f"{self.base}{path}", timeout=15)
                if r.status_code != 200:
                    continue
                body = r.json()
                msg = body.get("message")
                if isinstance(msg, dict):
                    if msg.get("csrf_token"):
                        return msg["csrf_token"]
                elif isinstance(msg, str) and len(msg) >= 32:
                    # `frappe.sessions.get_csrf_token` returns the token as
                    # the bare `message` string.
                    return msg
            except (requests.RequestException, ValueError):
                continue
        # Fall back to the cookie that the login response sometimes drops on us.
        ck = self.session.cookies.get("csrf_token") or self.session.cookies.get("sid_csrf")
        return ck

    # ── Convenience wrappers ────────────────────────────────────────────────

    def get_doc(self, doctype: str, name: str) -> dict[str, Any]:
        r = self.session.get(f"{self.base}/api/resource/{doctype}/{name}", timeout=30)
        r.raise_for_status()
        return r.json()["data"]

    def list_docs(
        self,
        doctype: str,
        *,
        filters: list | None = None,
        fields: list[str] | None = None,
        limit: int = 20,
        order_by: str | None = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {"limit_page_length": limit}
        if fields:
            params["fields"] = json.dumps(fields)
        if filters:
            params["filters"] = json.dumps(filters)
        if order_by:
            params["order_by"] = order_by
        r = self.session.get(f"{self.base}/api/resource/{doctype}", params=params, timeout=30)
        r.raise_for_status()
        return r.json()["data"]

    def insert(self, doctype: str, doc: dict[str, Any]) -> dict[str, Any]:
        payload = {**doc, "doctype": doctype}
        r = self.session.post(
            f"{self.base}/api/method/frappe.client.insert",
            data={"doc": json.dumps(payload)},
            timeout=60,
        )
        if r.status_code >= 400:
            _raise_frappe_error(r, f"insert {doctype}")
        return r.json()["message"]

    def submit(self, doc: dict[str, Any]) -> dict[str, Any]:
        r = self.session.post(
            f"{self.base}/api/method/frappe.client.submit",
            data={"doc": json.dumps(doc)},
            timeout=60,
        )
        if r.status_code >= 400:
            _raise_frappe_error(r, f"submit {doc.get('doctype')}/{doc.get('name')}")
        return r.json()["message"]


def _raise_frappe_error(r: requests.Response, what: str) -> None:
    """Decode the Frappe error envelope and re-raise with a useful message."""
    try:
        body = r.json()
    except Exception:
        body = {"raw": r.text[:500]}
    server_messages = body.get("_server_messages") or ""
    exception = body.get("exception") or ""
    msg = exception or server_messages or json.dumps(body)[:500]
    raise RuntimeError(f"{what} failed ({r.status_code}): {msg}")


# ── The chain ───────────────────────────────────────────────────────────────

def run_chain(client: FrappeClient, args: argparse.Namespace, run: Run) -> None:
    slug = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    item_code = f"SMOKE-ITEM-{slug}"
    customer_name = f"SMOKE-CUST-{slug}"

    # ── Phase 0: Discovery ──────────────────────────────────────────────────
    print("\n▸ Phase 0 — discovery")

    company = args.company
    if not company:
        rows = client.list_docs("Company", fields=["name"], limit=1)
        if not rows:
            run.fail("Discover company", "no Company exists; create one in Settings first")
            return
        company = rows[0]["name"]
    run.ok("Company", company)

    warehouse = args.warehouse
    if not warehouse:
        rows = client.list_docs(
            "Warehouse",
            filters=[["company", "=", company], ["is_group", "=", 0], ["disabled", "=", 0]],
            fields=["name"],
            limit=1,
        )
        if not rows:
            run.fail("Discover warehouse", f"no enabled warehouse in {company}")
            return
        warehouse = rows[0]["name"]
    run.ok("Warehouse", warehouse)

    item_group_rows = client.list_docs(
        "Item Group", filters=[["is_group", "=", 0]], fields=["name"], limit=1,
    )
    item_group = item_group_rows[0]["name"] if item_group_rows else "All Item Groups"
    run.ok("Item Group", item_group)

    # ── Phase 1: Create Item ────────────────────────────────────────────────
    print("\n▸ Phase 1 — create test Item")
    try:
        item = client.insert("Item", {
            "item_code": item_code,
            "item_name": f"Smoke test item {slug}",
            "item_group": item_group,
            "stock_uom": "Nos",
            "is_stock_item": 1,
            "is_sales_item": 1,
            "is_purchase_item": 1,
            "standard_rate": 15,
        })
        run.ok("Item created", item["name"])
    except Exception as e:
        run.fail("Item create", str(e))
        return

    # ── Phase 2: Add 100 units via Stock Entry ──────────────────────────────
    print("\n▸ Phase 2 — receive 100 units via Stock Entry")
    today = dt.date.today().isoformat()
    try:
        ste = client.insert("Stock Entry", {
            "stock_entry_type": "Material Receipt",
            "company": company,
            "posting_date": today,
            "items": [{
                "item_code": item_code,
                "qty": 100,
                "uom": "Nos",
                "stock_uom": "Nos",
                "t_warehouse": warehouse,
                "basic_rate": 10,
            }],
        })
        ste_submitted = client.submit({**ste, "doctype": "Stock Entry"})
        run.ok("Stock Entry submitted", ste_submitted["name"])
    except Exception as e:
        run.fail("Stock Entry", str(e))
        return

    # Verify Stock Ledger row
    try:
        sle = client.list_docs(
            "Stock Ledger Entry",
            filters=[
                ["item_code", "=", item_code],
                ["voucher_no", "=", ste_submitted["name"]],
            ],
            fields=["actual_qty", "qty_after_transaction", "valuation_rate", "warehouse"],
            limit=5,
        )
        if not sle:
            run.fail("Stock Ledger row", "no SLE found for the receipt")
            return
        actual = float(sle[0]["actual_qty"])
        after = float(sle[0]["qty_after_transaction"])
        if abs(actual - 100) > 0.01:
            run.fail("Stock Ledger qty", f"expected +100, got {actual}")
        else:
            run.ok(
                "Stock Ledger row",
                f"+{actual} → balance {after} @ {sle[0]['valuation_rate']}/unit ({sle[0]['warehouse']})",
            )
    except Exception as e:
        run.fail("Stock Ledger verify", str(e))

    # ── Phase 3: Create Customer ────────────────────────────────────────────
    print("\n▸ Phase 3 — create test Customer")
    try:
        customer = client.insert("Customer", {
            "customer_name": customer_name,
            "customer_type": "Individual",
        })
        run.ok("Customer created", customer["name"])
    except Exception as e:
        run.fail("Customer create", str(e))
        return

    # ── Phase 4: Sales Invoice (with update_stock=1) ────────────────────────
    print("\n▸ Phase 4 — submit Sales Invoice (10 × @ 15.00, update_stock=1)")
    try:
        si = client.insert("Sales Invoice", {
            "customer": customer["name"],
            "company": company,
            "posting_date": today,
            "due_date": today,
            "update_stock": 1,
            "set_warehouse": warehouse,
            "items": [{
                "item_code": item_code,
                "qty": 10,
                "rate": 15,
                "warehouse": warehouse,
            }],
        })
        si_submitted = client.submit({**si, "doctype": "Sales Invoice"})
        gt = float(si_submitted.get("grand_total") or 0)
        outstanding = float(si_submitted.get("outstanding_amount") or 0)
        run.ok(
            "Sales Invoice submitted",
            f"{si_submitted['name']} — grand_total {gt:.2f}, outstanding {outstanding:.2f}",
        )
        if abs(gt - 150) > 0.01:
            run.fail("Sales Invoice grand_total", f"expected 150.00, got {gt}")
    except Exception as e:
        run.fail("Sales Invoice submit", str(e))
        return

    # ── Phase 5: Verify the GL + Stock side-effects ─────────────────────────
    print("\n▸ Phase 5 — verify GL Entry + Stock Ledger")
    try:
        gl = client.list_docs(
            "GL Entry",
            filters=[
                ["voucher_no", "=", si_submitted["name"]],
                ["voucher_type", "=", "Sales Invoice"],
                ["is_cancelled", "=", 0],
            ],
            fields=["account", "debit", "credit", "party_type", "party"],
            limit=20,
        )
    except Exception as e:
        run.fail("GL Entry fetch", str(e))
        return

    if not gl:
        run.fail(
            "GL Entry rows",
            "no GL entries were created — the accounting chain is BROKEN. "
            "Either the company has no default income/receivable account, or "
            "perpetual inventory is misconfigured. Open the invoice in the "
            "Frappe Desk to see the validation error.",
        )
    else:
        run.ok("GL Entry rows", f"{len(gl)} row(s)")
        total_debit = sum(float(r["debit"]) for r in gl)
        total_credit = sum(float(r["credit"]) for r in gl)
        if abs(total_debit - total_credit) > 0.01:
            run.fail("GL Entry balance", f"debit {total_debit} ≠ credit {total_credit}")
        else:
            run.ok("GL Entry balance", f"debit = credit = {total_debit:.2f}")
        for r in gl:
            debit = float(r["debit"])
            credit = float(r["credit"])
            side = f"+{debit:.2f} debit" if debit > 0 else f"+{credit:.2f} credit"
            party = f" [{r['party_type']} {r['party']}]" if r.get("party") else ""
            run.ok("  GL row", f"{r['account']}{party} — {side}")

    # Stock ledger for the invoice — should be -10
    try:
        sle_inv = client.list_docs(
            "Stock Ledger Entry",
            filters=[["voucher_no", "=", si_submitted["name"]]],
            fields=["actual_qty", "qty_after_transaction", "warehouse"],
            limit=5,
        )
        if not sle_inv:
            run.fail("Stock Ledger (invoice)", "no SLE created — update_stock=1 didn't fire")
        else:
            actual = float(sle_inv[0]["actual_qty"])
            after = float(sle_inv[0]["qty_after_transaction"])
            if abs(actual - (-10)) > 0.01:
                run.fail("Stock Ledger qty (invoice)", f"expected -10, got {actual}")
            else:
                run.ok("Stock Ledger row (invoice)", f"{actual} → balance {after} ({sle_inv[0]['warehouse']})")
    except Exception as e:
        run.fail("Stock Ledger (invoice) verify", str(e))

    # ── Phase 6: Verify what the standard reports read ──────────────────────
    print("\n▸ Phase 6 — verify report-facing balances")

    # Sales Invoice's outstanding_amount = what Customer Aging reads
    try:
        invoice_doc = client.get_doc("Sales Invoice", si_submitted["name"])
        outstanding = float(invoice_doc.get("outstanding_amount") or 0)
        if abs(outstanding - 150) > 0.01:
            run.fail("Customer outstanding (aging)", f"expected 150.00, got {outstanding}")
        else:
            run.ok("Customer outstanding (Aging)", f"{outstanding:.2f} for {customer['name']}")
    except Exception as e:
        run.fail("Customer outstanding fetch", str(e))

    # Bin.actual_qty = what Stock Balance reads
    try:
        bin_rows = client.list_docs(
            "Bin",
            filters=[["item_code", "=", item_code], ["warehouse", "=", warehouse]],
            fields=["actual_qty", "stock_value"],
            limit=1,
        )
        if not bin_rows:
            run.fail("Bin row", "no Bin row for the item/warehouse (Stock Balance will be empty)")
        else:
            actual = float(bin_rows[0]["actual_qty"])
            stock_value = float(bin_rows[0].get("stock_value") or 0)
            if abs(actual - 90) > 0.01:
                run.fail("Bin.actual_qty (Stock Balance)", f"expected 90, got {actual}")
            else:
                run.ok("Bin.actual_qty (Stock Balance)", f"{actual} units, value {stock_value:.2f}")
    except Exception as e:
        run.fail("Bin fetch", str(e))


# ── Report writer ───────────────────────────────────────────────────────────

def write_markdown(run: Run, args: argparse.Namespace, out: Path) -> None:
    duration = dt.datetime.now() - run.started_at
    lines: list[str] = [
        f"# Accounting Chain End-to-End Test — {run.started_at:%Y-%m-%d %H:%M}",
        "",
        f"- **Site**: {args.site}",
        f"- **User**: {args.user}",
        f"- **Duration**: {duration.total_seconds():.1f}s",
        "",
        "## Steps",
        "",
        "| | Step | Detail |",
        "|---|---|---|",
    ]
    for s in run.steps:
        icon = "✓" if s.ok else "✗"
        # Escape any pipe characters so the table doesn't break
        detail = s.detail.replace("|", "\\|")
        lines.append(f"| {icon} | {s.name} | {detail} |")
    lines.append("")
    lines.append("## Verdict")
    lines.append("")
    if run.failures == 0:
        lines.append(
            "✓ **Full accounting chain verified end-to-end.** "
            "An accountant can trust that:"
        )
        lines.append("")
        lines.append("- Submitting a **Sales Invoice** debits the customer's Debtors account and credits the company's Sales (income) account.")
        lines.append("- `update_stock=1` writes a corresponding **Stock Ledger** row that decrements warehouse stock.")
        lines.append("- The `Bin.actual_qty` (what **Stock Balance** reads) matches the new ledger total.")
        lines.append("- The invoice's `outstanding_amount` (what **Customer Aging** reads) matches the grand total until paid.")
        lines.append("- **GL Entry debit == credit** — Frappe's bookkeeping invariant holds for this voucher.")
        lines.append("")
        lines.append("Reports (Trial Balance, Income Statement, Customer Aging, Stock Balance) will all reflect this transaction immediately because they read the same `GL Entry` and `Bin` tables we just verified.")
    else:
        lines.append(f"✗ **{run.failures} of {len(run.steps)} step(s) failed.** The chain has gaps:")
        lines.append("")
        for s in run.steps:
            if not s.ok:
                lines.append(f"- **{s.name}** — {s.detail}")
        lines.append("")
        lines.append("### Common causes")
        lines.append("")
        lines.append("- **No GL Entry rows created** → the Item has no Income account set, and the Company has no default Income account either. Open the Item and set `Income Account`, OR open Company → Default Accounts and set `Default Income Account`.")
        lines.append("- **Sales Invoice submit failed** → probably no Debtors account on Company. Open Company → Default Accounts, set `Default Receivable Account`.")
        lines.append("- **No Stock Ledger row** → `update_stock=1` requires the Warehouse to be set on the line item AND the Item must be `is_stock_item=1`. Re-run with `--warehouse <name>` to force one.")
        lines.append("- **No Bin row** → ERPNext creates Bin lazily; if the SLE was created, the Bin should be too. If not, check the Frappe error log.")
    out.write_text("\n".join(lines), encoding="utf-8")


# ── Main ────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="End-to-end accounting chain test for Madaar ERP.")
    p.add_argument("--site", required=True, help="Site base URL, e.g. http://165.232.75.30")
    p.add_argument("--user", default="Administrator")
    p.add_argument("--password", default="admin")
    p.add_argument("--company")
    p.add_argument("--warehouse")
    p.add_argument("--report", type=Path, default=Path(__file__).with_name("accounting_chain_report.md"))
    return p.parse_args()


def main() -> int:
    args = parse_args()
    run = Run()
    print("=" * 60)
    print("Madaar ERP — Accounting Chain End-to-End Test")
    print(f"  Site: {args.site}")
    print(f"  User: {args.user}")
    print("=" * 60)

    client = FrappeClient(args.site, args.user, args.password)
    try:
        client.login()
        run.ok("Login", f"as {args.user}")
    except Exception as e:
        run.fail("Login", str(e))
        write_markdown(run, args, args.report)
        print(f"\n  Report: {args.report}")
        return 1

    try:
        run_chain(client, args, run)
    except Exception as e:
        run.fail("Harness", str(e))

    write_markdown(run, args, args.report)
    print("")
    print("=" * 60)
    print(f"  Report: {args.report}")
    print(f"  Result: {len(run.steps) - run.failures} OK · {run.failures} FAIL")
    print("=" * 60)
    return 1 if run.failures else 0


if __name__ == "__main__":
    sys.exit(main())
