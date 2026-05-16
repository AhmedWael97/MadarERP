#!/usr/bin/env python3
"""
Madaar ERP — End-to-End Page Audit
====================================
Logs into the React SPA, iterates every route from the generated pages
manifest, exercises list / create / edit actions, then writes a CSV report.

Usage
-----
    pip install playwright
    playwright install chromium

    # Full run (headless)
    python scripts/audit_pages.py

    # Smoke-test: first 5 of each category, visible browser
    python scripts/audit_pages.py --limit 5 --headed

    # Custom target
    python scripts/audit_pages.py --url http://localhost:5173 \\
                                   --user Administrator --password admin

Report columns
--------------
    Page URL | Action | Expected | Actual | Passed

Reports are saved to:  scan_output/data/audit_YYYYMMDD_HHMMSS.csv
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import NamedTuple

# ---------------------------------------------------------------------------
# Paths (relative to workspace root — script must be run from there, or
# invoke via `python scripts/audit_pages.py` from the repo root)
# ---------------------------------------------------------------------------
WORKSPACE = Path(__file__).parent.parent
MANIFEST_PATH = WORKSPACE / "frontend/src/_generated/pages.manifest.ts"
META_ROOT     = WORKSPACE / "frontend/src/_generated/pages"
REPORT_DIR    = WORKSPACE / "scan_output/data"

# ---------------------------------------------------------------------------
# Defaults (overridable via CLI)
# ---------------------------------------------------------------------------
DEFAULT_URL  = "http://localhost:5173"
DEFAULT_USER = "Administrator"
DEFAULT_PASS = "admin"

# ---------------------------------------------------------------------------
# Timing constants (ms)
# ---------------------------------------------------------------------------
NAV_TIMEOUT    = 20_000   # page navigation
FORM_TIMEOUT   = 12_000   # wait for FormShell to finish loading meta from API
ACTION_TIMEOUT = 6_000    # fill / click
TOAST_TIMEOUT  = 6_000    # wait for sonner toast


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------
class ReportRow(NamedTuple):
    page_url : str
    action   : str    # Index | Create | Edit
    expected : str
    actual   : str
    passed   : bool


# ---------------------------------------------------------------------------
# Manifest / meta parsers
# ---------------------------------------------------------------------------
def parse_manifest(path: Path) -> list[str]:
    """Extract every route path from pages.manifest.ts as plain strings."""
    text = path.read_text(encoding="utf-8")
    # Matches:  path: 'accounting/fiscal-years'  or  path: "some/path"
    return sorted(set(re.findall(r"""path\s*:\s*['"]([^'"]+)['"]""", text)))


def classify_paths(paths: list[str]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {"index": [], "create": [], "edit": []}
    for p in paths:
        if p.endswith("/create") or p.endswith("--create"):
            result["create"].append(p)
        elif ":id" in p or "--edit" in p or p.endswith("/edit"):
            result["edit"].append(p)
        else:
            result["index"].append(p)
    return result


def build_doctype_map(meta_root: Path) -> dict[str, str]:
    """
    Walk every meta.ts under meta_root and build:
        route_path (no leading /) -> frappe doctype name
    e.g. "accounting/fiscal-years" -> "Fiscal Year"
    """
    mapping: dict[str, str] = {}
    for meta_file in meta_root.rglob("meta.ts"):
        text = meta_file.read_text(encoding="utf-8", errors="ignore")
        # "routePath": "/accounting/fiscal-years"
        route_m  = re.search(r'"routePath"\s*:\s*"([^"]+)"', text)
        # "doctype": "Fiscal Year"
        dtype_m  = re.search(r'"doctype"\s*:\s*"([^"]+)"', text)
        if route_m and dtype_m:
            route = route_m.group(1).lstrip("/")
            mapping[route] = dtype_m.group(1)
    return mapping


# ---------------------------------------------------------------------------
# Frappe REST helper (plain httpx/requests-free — uses Playwright's fetch)
# ---------------------------------------------------------------------------
async def frappe_get_first_record(page, base: str, doctype: str) -> str | None:
    """
    Call Frappe's REST API to get the name of the most recently created
    document for `doctype`. Returns None if the doctype has no records or
    the call fails.
    """
    try:
        enc = doctype.replace(" ", "%20")
        resp = await page.evaluate(
            """async ([url]) => {
                try {
                    const r = await fetch(url, { credentials: 'include' });
                    const j = await r.json();
                    return j;
                } catch (e) { return null; }
            }""",
            [f"{base}/api/resource/{enc}?limit=1&order_by=creation+desc&fields=[\"name\"]"],
        )
        if resp and resp.get("data"):
            return resp["data"][0]["name"]
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
async def do_login(page, base: str, user: str, pwd: str) -> bool:
    """
    Log in via Playwright's built-in HTTP client (page.request).

    page.request shares the browser context's cookie store, so the session
    cookie returned by Frappe is immediately available for page navigations —
    no browser navigation is needed for the login step itself.

    After authentication, a warmup navigation with a very long timeout handles
    Vite's cold-start dep-optimisation pass (can take 30–60 s inside the
    Docker-on-Windows container on first access).
    """
    try:
        resp = await page.request.post(
            f"{base}/api/method/login",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"usr": user, "pwd": pwd}),
        )
        if resp.status != 200:
            body = await resp.text()
            print(
                f"[ERROR] Login API status {resp.status}: {body[:200]}",
                file=sys.stderr,
            )
            return False

        # Warm up the Vite dev server — the first browser page load triggers
        # esbuild dep-optimisation which can take > 60 s in Docker on Windows.
        # We use a generous timeout here so the rest of the audit runs fast.
        print("      (warming up Vite dev server — first load may take ~60 s) …")
        await page.goto(f"{base}/login", wait_until="load", timeout=120_000)
        # After API login the React app will redirect /login → /dashboard.
        # Wait for that navigation to settle.
        await page.wait_for_timeout(1_000)
        return True

    except Exception as exc:
        print(f"[ERROR] Login failed: {exc}", file=sys.stderr)
        return False


# ---------------------------------------------------------------------------
# Page helpers
# ---------------------------------------------------------------------------
async def navigate_to(page, url: str) -> str | None:
    """Go to URL; return error string or None on success.

    Uses 'load' (JS bundles ready) instead of 'networkidle' so that
    React SPA pages which fire API calls on mount don't cause 20-second
    timeouts.  A short settle pause lets React perform its first render.
    """
    try:
        await page.goto(url, wait_until="load", timeout=NAV_TIMEOUT)
        # Give React ~1.5 s to render initial content / redirect to login
        await page.wait_for_timeout(1_500)
        return None
    except Exception as exc:
        return f"navigation error: {str(exc)[:80]}"


async def detect_error_panel(page) -> str | None:
    """
    Return visible error text if an ErrorPanel, 403, 404, or RequirePerm
    block is rendered on the page.
    """
    # RequirePerm / ErrorPanel renders a div with specific text patterns
    for sel in [
        '[class*="ErrorPanel"]',
        'text="403"', 'text="404"',
        'text="Not Found"', 'text="Access denied"',
        'text="Permission Error"',
    ]:
        try:
            el = page.locator(sel).first
            if await el.is_visible(timeout=800):
                return (await el.inner_text(timeout=800)).strip()[:100]
        except Exception:
            pass
    return None


async def wait_for_form_ready(page) -> bool:
    """
    FormShell shows a loading div while fetching DocType meta.
    Wait until it disappears and real inputs appear.
    Returns True once inputs are present, False on timeout.
    """
    try:
        # Wait for at least one registered input to appear
        await page.wait_for_selector(
            'input[name]:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]), '
            'textarea[name], select[name]',
            timeout=FORM_TIMEOUT,
        )
        return True
    except Exception:
        return False


async def wait_for_toast(page) -> tuple[str, str] | None:
    """
    Wait for a sonner toast and return (type, text).
    Sonner renders: <li data-sonner-toast data-type="success|error"> text </li>
    Returns None if no toast appears within TOAST_TIMEOUT ms.
    """
    try:
        toast = page.locator("[data-sonner-toast]").first
        await toast.wait_for(state="visible", timeout=TOAST_TIMEOUT)
        dtype = await toast.get_attribute("data-type") or "unknown"
        text  = (await toast.inner_text(timeout=2000)).strip()
        return dtype, text
    except Exception:
        return None


async def fill_form(page) -> dict:
    """
    Fill all visible, non-read-only inputs registered by react-hook-form
    (they all have a `name` attribute equal to the Frappe fieldname).

    Strategy per field type:
        text / email / tel / url / search / password → "Test Value"
        number (int)   → "1"
        number (float) → "1.5"
        date           → today ISO
        datetime-local → today + T00:00
        time           → "08:00"
        select         → first non-empty option
        textarea       → "Test audit entry"
        checkbox       → leave unchecked (default)
        Link (custom)  → type "Test" into the underlying text input; the
                         Frappe API may reject if no matching record exists —
                         that failure is captured and reported.

    Returns a dict with: filled, skipped, detail (list of "name=value" strings)
    """
    filled: int = 0
    skipped: int = 0
    detail: list[str] = []

    # All inputs registered by react-hook-form have name= attributes.
    all_inputs = await page.locator(
        'input[name]:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]):not([disabled]), '
        'textarea[name]:not([disabled]), '
        'select[name]:not([disabled])'
    ).all()

    for inp in all_inputs:
        try:
            tag  = (await inp.evaluate("el => el.tagName")).lower()
            typ  = (await inp.get_attribute("type") or "text").lower()
            name = (await inp.get_attribute("name") or "?")

            if not await inp.is_visible():
                skipped += 1
                continue

            if tag == "select":
                opts = await inp.evaluate(
                    "el => [...el.options].filter(o => o.value).map(o => o.value)"
                )
                if opts:
                    await inp.select_option(opts[0], timeout=ACTION_TIMEOUT)
                    filled += 1
                    detail.append(f"{name}={opts[0]}")
                else:
                    skipped += 1
            elif tag == "textarea":
                await inp.fill("Test audit entry", timeout=ACTION_TIMEOUT)
                filled += 1
                detail.append(f"{name}=<text>")
            elif typ == "number":
                step = await inp.get_attribute("step") or "1"
                val  = "1" if step == "1" else "1.5"
                await inp.fill(val, timeout=ACTION_TIMEOUT)
                filled += 1
                detail.append(f"{name}={val}")
            elif typ == "date":
                await inp.fill(date.today().isoformat(), timeout=ACTION_TIMEOUT)
                filled += 1
                detail.append(f"{name}={date.today().isoformat()}")
            elif typ == "datetime-local":
                await inp.fill(f"{date.today().isoformat()}T00:00", timeout=ACTION_TIMEOUT)
                filled += 1
                detail.append(f"{name}=<datetime>")
            elif typ == "time":
                await inp.fill("08:00", timeout=ACTION_TIMEOUT)
                filled += 1
                detail.append(f"{name}=08:00")
            elif typ in ("text", "email", "tel", "url", "search", "password"):
                await inp.fill("Test", timeout=ACTION_TIMEOUT)
                filled += 1
                detail.append(f"{name}=Test")
            else:
                skipped += 1
        except Exception as exc:
            skipped += 1
            detail.append(f"skip:{name}({str(exc)[:40]})")

    return {"filled": filled, "skipped": skipped, "detail": detail}


async def click_save(page) -> bool:
    """Click the primary Save button (button[type='submit'] inside the form)."""
    try:
        btn = page.locator('button[type="submit"]').first
        await btn.wait_for(state="visible", timeout=ACTION_TIMEOUT)
        await btn.click(timeout=ACTION_TIMEOUT)
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Test runners
# ---------------------------------------------------------------------------
async def test_index(page, base: str, path: str) -> ReportRow:
    url     = f"{base}{path}"
    nav_err = await navigate_to(page, url)
    if nav_err:
        return ReportRow(url, "Index", "page loads", nav_err, False)

    err = await detect_error_panel(page)
    if err:
        return ReportRow(url, "Index", "page loads", f"error panel: {err}", False)

    # Confirm something meaningful rendered (table, heading, or module hub cards)
    try:
        await page.wait_for_selector(
            'table, [role="table"], h1, h2, [class*="ModuleHub"], [class*="PageShell"]',
            timeout=5_000,
        )
        return ReportRow(url, "Index", "page loads", "loaded OK", True)
    except Exception:
        return ReportRow(url, "Index", "page loads", "blank / nothing rendered", False)


async def test_create(page, base: str, path: str, current_url_before: str = "") -> ReportRow:
    """
    Navigate to a --create route, fill every visible input, click Save,
    then detect success via:
      1. URL change away from the create page (onSuccess → navigate(-1))
      2. sonner success toast
      3. No sonner error toast
    """
    url     = f"{base}{path}"
    nav_err = await navigate_to(page, url)
    if nav_err:
        return ReportRow(url, "Create", "form saves", nav_err, False)

    err = await detect_error_panel(page)
    if err:
        return ReportRow(url, "Create", "form saves", f"error panel: {err}", False)

    form_ready = await wait_for_form_ready(page)
    if not form_ready:
        # FormShell might have rendered an error (e.g. DocType not installed)
        err2 = await detect_error_panel(page)
        msg  = f"error panel: {err2}" if err2 else "form never rendered inputs"
        return ReportRow(url, "Create", "form saves", msg, False)

    fill_result = await fill_form(page)
    n_filled    = fill_result["filled"]
    n_skipped   = fill_result["skipped"]
    fill_summary = f"filled={n_filled} skipped={n_skipped}"

    saved = await click_save(page)
    if not saved:
        return ReportRow(url, "Create", "form saves",
                         f"{fill_summary} → no Save button found", False)

    # Wait for either URL change OR a toast
    try:
        await page.wait_for_url(
            lambda u: u != url,
            timeout=5_000,
        )
        return ReportRow(url, "Create", "form saves",
                         f"{fill_summary} → navigated away (saved)", True)
    except Exception:
        pass

    toast = await wait_for_toast(page)
    if toast:
        ttype, ttext = toast
        passed = ttype == "success"
        return ReportRow(url, "Create", "form saves",
                         f"{fill_summary} → toast[{ttype}]: {ttext[:80]}", passed)

    # Last resort: check if submitError div appeared
    err3 = await detect_error_panel(page)
    if err3:
        return ReportRow(url, "Create", "form saves",
                         f"{fill_summary} → {err3[:80]}", False)

    # Ambiguous — no confirmation seen
    return ReportRow(url, "Create", "form saves",
                     f"{fill_summary} → no confirmation received", False)


async def test_edit(page, base: str, path: str, doctype: str | None) -> ReportRow:
    """
    Resolve the real record name via Frappe API, navigate to the edit URL,
    wait for the form to render, and verify it loads without an error panel.
    (We deliberately do NOT save in the edit test to avoid mutating live data.)
    """
    # Derive a placeholder URL for the report even before we know the real name
    url_template = f"{base}{path}"

    if not doctype:
        return ReportRow(
            url_template, "Edit", "form loads",
            "skipped: doctype unknown for this route", False,
        )

    name = await frappe_get_first_record(page, base, doctype)
    if not name:
        return ReportRow(
            url_template, "Edit", "form loads",
            f"skipped: no records found for DocType '{doctype}'", False,
        )

    # Replace :id placeholder with the real record name
    real_path = re.sub(r":id", name, path)
    url       = f"{base}{real_path}"

    nav_err = await navigate_to(page, url)
    if nav_err:
        return ReportRow(url, "Edit", "form loads", nav_err, False)

    err = await detect_error_panel(page)
    if err:
        return ReportRow(url, "Edit", "form loads", f"error panel: {err}", False)

    form_ready = await wait_for_form_ready(page)
    if not form_ready:
        err2 = await detect_error_panel(page)
        msg  = f"error panel: {err2}" if err2 else "form never rendered inputs"
        return ReportRow(url, "Edit", "form loads", msg, False)

    # Count visible inputs as a sanity check
    n = await page.locator(
        'input[name]:not([type="hidden"]), textarea[name], select[name]'
    ).count()
    return ReportRow(url, "Edit", "form loads",
                     f"loaded OK (record={name!r}, inputs={n})", True)


# ---------------------------------------------------------------------------
# Report writer
# ---------------------------------------------------------------------------
def write_csv(rows: list[ReportRow], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(["Page URL", "Action", "Expected", "Actual", "Passed"])
        for r in rows:
            w.writerow([r.page_url, r.action, r.expected, r.actual,
                        "✓" if r.passed else "✗"])
    print(f"\nCSV report → {out_path}")


def print_summary(rows: list[ReportRow]) -> None:
    total  = len(rows)
    passed = sum(1 for r in rows if r.passed)
    pct    = 100 * passed // total if total else 0

    by_action: dict[str, tuple[int, int]] = {}
    for r in rows:
        ok, tot = by_action.get(r.action, (0, 0))
        by_action[r.action] = (ok + r.passed, tot + 1)

    print("\n" + "=" * 62)
    print(f"  AUDIT COMPLETE  — {passed}/{total} passed ({pct}%)")
    print("=" * 62)
    for action, (ok, tot) in sorted(by_action.items()):
        bar = "█" * ok + "░" * (tot - ok)
        print(f"  {action:7} {ok:3}/{tot:3}  {bar}")

    failures = [r for r in rows if not r.passed]
    if failures:
        print(f"\n  FAILURES ({len(failures)}):")
        for r in failures:
            print(f"  ✗ [{r.action:7}] {r.page_url}")
            print(f"            {r.actual}")
    print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
async def main(
    base      : str,
    user      : str,
    pwd       : str,
    headless  : bool,
    limit     : int | None,
    only      : str | None,
) -> None:

    if not MANIFEST_PATH.exists():
        print(f"[ERROR] Manifest not found: {MANIFEST_PATH}", file=sys.stderr)
        sys.exit(1)

    paths      = parse_manifest(MANIFEST_PATH)
    classified = classify_paths(paths)
    dtype_map  = build_doctype_map(META_ROOT)

    total_pages = sum(len(v) for v in classified.values())
    print(f"Manifest   : {total_pages} paths total")
    print(f"  Index    : {len(classified['index'])}")
    print(f"  Create   : {len(classified['create'])}")
    print(f"  Edit     : {len(classified['edit'])}")
    print(f"DocTypes   : {len(dtype_map)} mapped from meta.ts files")
    print(f"Target     : {base}  |  User: {user}  |  Headless: {headless}")
    if limit:
        print(f"Limit      : {limit} per category (smoke-test mode)")
    if only:
        print(f"Only       : {only} action")

    report: list[ReportRow] = []

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print(
            "[ERROR] playwright not installed.\n"
            "  Run:  pip install playwright && playwright install chromium",
            file=sys.stderr,
        )
        sys.exit(1)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=headless)
        ctx     = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ar",
        )
        page = await ctx.new_page()

        # ------------------------------------------------------------------
        # 1. Login
        # ------------------------------------------------------------------
        print("\n[1/4] Logging in …")
        if not await do_login(page, base, user, pwd):
            print("Aborting: login failed.", file=sys.stderr)
            await browser.close()
            sys.exit(1)
        print("      ✓ Authenticated")

        # ------------------------------------------------------------------
        # 2. Index pages
        # ------------------------------------------------------------------
        if not only or only == "index":
            indices = classified["index"][:limit] if limit else classified["index"]
            print(f"\n[2/4] Testing {len(indices)} index pages …")
            for i, path in enumerate(indices, 1):
                row = await test_index(page, base, path)
                report.append(row)
                icon = "✓" if row.passed else "✗"
                print(f"  {icon} [{i:3}/{len(indices)}] {path}")
        else:
            print("\n[2/4] Index pages — skipped (--only filter)")

        # ------------------------------------------------------------------
        # 3. Create forms
        # ------------------------------------------------------------------
        if not only or only == "create":
            creates = classified["create"][:limit] if limit else classified["create"]
            print(f"\n[3/4] Testing {len(creates)} create forms …")
            for i, path in enumerate(creates, 1):
                row = await test_create(page, base, path)
                report.append(row)
                icon = "✓" if row.passed else "✗"
                print(f"  {icon} [{i:3}/{len(creates)}] {path}")
        else:
            print("\n[3/4] Create forms — skipped (--only filter)")

        # ------------------------------------------------------------------
        # 4. Edit forms
        # ------------------------------------------------------------------
        if not only or only == "edit":
            edits = classified["edit"][:limit] if limit else classified["edit"]
            print(f"\n[4/4] Testing {len(edits)} edit forms …")
            for i, path in enumerate(edits, 1):
                # Derive the list path (strip --:id--edit) to look up doctype
                base_path = re.sub(r"--:id--edit$|--edit$|/:id/edit$|/edit$", "", path).lstrip("/")
                doctype   = dtype_map.get(base_path)
                row = await test_edit(page, base, path, doctype)
                report.append(row)
                icon = "✓" if row.passed else "✗"
                print(f"  {icon} [{i:3}/{len(edits)}] {path}")
        else:
            print("\n[4/4] Edit forms — skipped (--only filter)")

        await browser.close()

    # ------------------------------------------------------------------
    # Save report
    # ------------------------------------------------------------------
    ts       = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = REPORT_DIR / f"audit_{ts}.csv"
    write_csv(report, out_path)
    print_summary(report)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Madaar ERP – end-to-end page audit",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--url",      default=DEFAULT_URL,  metavar="URL",
                        help=f"Frontend base URL (default: {DEFAULT_URL})")
    parser.add_argument("--user",     default=DEFAULT_USER, metavar="NAME",
                        help=f"Login username (default: {DEFAULT_USER})")
    parser.add_argument("--password", default=DEFAULT_PASS, metavar="PWD",
                        help="Login password (default: admin)")
    parser.add_argument("--headed",   action="store_true",
                        help="Run with a visible browser window")
    parser.add_argument("--limit",    type=int, default=None, metavar="N",
                        help="Max pages per category (quick smoke-test)")
    parser.add_argument("--only",     choices=["index", "create", "edit"],
                        default=None,
                        help="Run only one category of tests")
    args = parser.parse_args()

    asyncio.run(main(
        base     = args.url.rstrip("/"),
        user     = args.user,
        pwd      = args.password,
        headless = not args.headed,
        limit    = args.limit,
        only     = args.only,
    ))
