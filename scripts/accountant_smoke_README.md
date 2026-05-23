# Accountant smoke test

Browser-driven end-to-end test for the core Madaar ERP accounting cycle —
login → setup → safes/banks → master data → sales/purchases/stock →
reports. Opens a real Chromium window via [Playwright](https://playwright.dev/python/),
walks through every page an accountant cares about, and prints a categorized
findings report.

## What it checks

The script is intentionally focused on the **core accounting flow**, not the
whole app. In order:

| Phase | What's verified |
|---|---|
| Auth | Login redirects to `/dashboard`. Failure here aborts everything else. |
| Dashboard | Page renders (no blank screen, no JS render-time error). |
| General accounting | Chart of Accounts has all 5 root types (Assets / Liabilities / Equity / Income / Expenses). Fiscal Year exists for the current year. Settings page reachable. |
| Safe + banks | Treasuries, Bank Institutions, Bank Accounts, Currencies, Exchange Rates, Cheques, Receipt Vouchers, Payment Vouchers. |
| Master data | Customers, Suppliers, Products (Items), Warehouses. |
| Transactions | Creates a `SMOKE-CUST-<ts>` Customer, a `SMOKE-ITEM-<ts>` Item, and verifies the Sales Invoice create form renders. (Skipped under `--skip-creates`.) |
| Trade & stock | Sales Invoices/Orders/Quotations, Sales Returns, Purchase Invoices/Orders/Returns, Stock Entries, Stock Transfers. |
| Reports | Trial Balance, General Ledger, Balance Sheet, Income Statement, Cash Flow, Account Statement, Bank Statement, Vouchers Report, Checks Report, Customer Aging, Sales Summary / by Customer / by Product / Daily / Returns, Stock Balance, Stock Ledger. |
| Browser | Reports any JS console errors / warnings as a WARN finding. |

Each check produces one of three outcomes:
- 🟢 **OK** — works as expected.
- 🟡 **WARN** — page loaded but something looks off (heading wrong, no data, etc). Doesn't fail the run.
- 🔴 **FAIL** — page blank, navigation timeout, login broken, etc. Fails the run (exit code 1).

A markdown report is written to `scripts/accountant_smoke_report.md`.
Screenshots of failures land in `scripts/accountant_smoke_screenshots/`.

## Install

```bash
pip install playwright
playwright install chromium
```

Playwright will download a hermetic Chromium build (~150 MB the first time)
into `~/.cache/ms-playwright/`.

## Run

Against your local dev SPA:

```bash
python scripts/accountant_smoke.py \
  --site http://dev.localhost:5173 \
  --user Administrator \
  --password admin
```

Against a tenant on the deployed cluster (read-only — won't write any data):

```bash
python scripts/accountant_smoke.py \
  --site https://t1.madaar.app \
  --user wael@myrocky.ca \
  --password '<your password>' \
  --skip-creates
```

Watch it work (slow motion + visible browser):

```bash
python scripts/accountant_smoke.py --slow-mo 300
```

CI / headless:

```bash
python scripts/accountant_smoke.py --headless
```

## Reading the output

Console output is live — one line per check. At the end:

```
============================================================
  Report:      scripts/accountant_smoke_report.md
  Screenshots: scripts/accountant_smoke_screenshots
  Findings:    2 FAIL · 5 WARN · 38 OK
============================================================
```

Open the report file for the categorized writeup with one section per
severity, grouped by area (Auth / Accounting / Treasury / Customers / Sales
/ Purchases / Inventory / Reports / Browser).

The report ends with an **"Accountant takeaways"** paragraph written for a
finance reader, not an engineer — useful to forward verbatim to whoever's
training the accountant. It tells them: critical blockers, soft issues,
and what to do next.

## Common failure modes and what they mean

| Symptom | Likely cause | Fix |
|---|---|---|
| FAIL `[Auth] Login` | Backend bench unreachable, or credentials wrong | Check `docker compose ps` / nginx, then verify the credentials in Frappe Desk. |
| FAIL `[Accounting] CoA incomplete` | Company never had its Chart of Accounts seeded | On the host: `bench --site <site> execute madaar_core.setup.bootstrap_tenant` |
| FAIL `[X] <page> blank` | Generated route exists but the React component errored | Open DevTools console — look for the first thrown error. Most of the time it's a missing field in a custom doctype that hasn't migrated. |
| WARN `[Reports] <name> heading not recognised` | Report route exists but is a placeholder | Either generate a real report page from the scan, or remove the route from the manifest. |
| WARN `[Treasury] /treasury/treasuries unreachable` | madaar_core not installed on this tenant | `bench --site <site> install-app madaar_core && bench --site <site> migrate` |
| WARN `[Reports] <stock report> unreachable` | madaar_construction or madaar_logistics not installed | Install the relevant Madaar app for the module. |

## Cleanup

The script does **not** delete the entities it created — that's deliberate so
an accountant can inspect them after the run. They're all prefixed with
`SMOKE-`, so you can filter and bulk-delete from the relevant list pages
once you're done auditing.

---

# Companion: accounting_chain_test.py

`accountant_smoke.py` verifies that **pages render**. The companion script
[`accounting_chain_test.py`](./accounting_chain_test.py) verifies that **the
data chain works** — that ERPNext is correctly linking Products → Stock →
Sales Invoices → GL → Reports under the hood.

It uses the **REST API** (no browser, no Playwright) so it's fast (~10 s) and
deterministic. The output reads the actual `GL Entry` and `Stock Ledger Entry`
tables directly, so the report shows the real numbers that landed.

## What it does

1. **Login + discovery** — picks the first Company, first non-group Warehouse, first non-group Item Group (override with `--company` / `--warehouse`).
2. **Create test Item** — `SMOKE-ITEM-<ts>`, `is_stock_item=1`, `is_sales_item=1`.
3. **Receive 100 units of stock** via Stock Entry (Material Receipt) at cost 10.00.
   - Verifies `Stock Ledger Entry`: `+100`, balance 100, valuation_rate 10.00.
4. **Create test Customer** — `SMOKE-CUST-<ts>`.
5. **Submit Sales Invoice** — 10 units @ 15.00 = 150.00, `update_stock=1`.
6. **Verify the side-effects** — directly off the tables:
   - `GL Entry` rows for this voucher: prints every line (account + debit/credit + party).
   - `GL Entry` invariant: total debit == total credit.
   - `Stock Ledger Entry`: `-10`, balance now 90.
   - `Bin.actual_qty == 90` (this is what the Stock Balance report reads).
   - `Sales Invoice.outstanding_amount == 150.00` (this is what Customer Aging reads).

If every step passes, the markdown report's verdict says:

> ✓ Full accounting chain verified end-to-end. An accountant can trust that submitting a Sales Invoice debits the customer's Debtors and credits Sales income, that `update_stock=1` decrements the warehouse, that `Bin.actual_qty` matches the new ledger total, and that GL Entry debit == credit.

If any step fails, the report lists the **common causes** (missing default Income Account on Company, missing default Receivable Account, etc.) so you know exactly what to set in Frappe Desk to fix it.

## Install

```bash
pip install requests
```

## Run

```bash
python scripts/accounting_chain_test.py \
  --site http://165.232.75.30 \
  --user Administrator \
  --password admin
```

Override the discovered defaults if you want a specific company / warehouse:

```bash
python scripts/accounting_chain_test.py \
  --site http://165.232.75.30 \
  --user Administrator --password admin \
  --company "Acme Co" --warehouse "Stores - ACM"
```

## What the report looks like

Console output is one line per step, e.g.:

```
▸ Phase 5 — verify GL Entry + Stock Ledger
  ✓ GL Entry rows — 4 row(s)
  ✓ GL Entry balance — debit = credit = 150.00
  ✓   GL row — Debtors - ACM [Customer SMOKE-CUST-20260523-150412] — +150.00 debit
  ✓   GL row — Sales - ACM — +150.00 credit
  ✓   GL row — Cost of Goods Sold - ACM — +100.00 debit
  ✓   GL row — Stock In Hand - ACM — +100.00 credit
  ✓ Stock Ledger row (invoice) — -10 → balance 90 (Stores - ACM)
```

The third and fourth GL rows only appear if the Company has **Perpetual
Inventory** enabled (Company → "Enable Perpetual Inventory" check). Without
them, only the AR + Income postings are made on Sales Invoice; COGS lands
when you submit a separate Stock Entry.

## When you'd run each script

| Question | Tool |
|---|---|
| Do all the pages render? Can an accountant navigate the app? | `accountant_smoke.py` |
| Are submitted invoices actually posting to GL? Do the reports reflect them? | `accounting_chain_test.py` |
| Both — full health check | Run them in order: smoke first (cheap), then chain (proves the data) |

