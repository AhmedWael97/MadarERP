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
