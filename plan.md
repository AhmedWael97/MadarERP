# Plan — Madaar SaaS ERP: React UI on a Custom Frappe/ERPNext Backend

## Context

The user has two artifacts in `h:/coupons/erp_mr_adham/`:

1. `erpnext/` — a clone of official Frappe ERPNext (Python / Frappe framework).
2. `scan_output/` — a static crawl of an **existing Laravel-based ERP** at `delta-enterprise.net` ("مدار ERP"), captured as:
   - **296 screenshots** (Arabic, RTL),
   - `data/pages.json` (per-page tables, filter forms, and 282 create-forms with field definitions),
   - `data/design_tokens.json` (Tailwind v4 CSS variables: primary `#10b981` emerald, navy sidebar, full slate/orange/teal/violet/rose/pink palette),
   - `data/site_inventory.json`,
   - `docs/dashboard_documentation.md` (~300-item feature inventory).

The user wants a **React JS** frontend that is **visually and functionally identical** to the scanned Laravel UI, but with **Frappe/ERPNext as the backend**, delivered as a **SaaS** where each customer is on its own subdomain and Frappe site. Arabic + English with full bidirectional support.

Why this plan exists: the scanned UI cannot be directly grafted onto ERPNext — its 296 pages span modules ERPNext does not have (Fleet, Workshop, Restaurant/KDS, Construction BOQ + Mostakhlas, Logistics, Egyptian e-invoicing). The plan therefore builds **(a) a set of custom Frappe apps** that add the missing DocTypes and customise the existing ERPNext ones, **(b) a React SPA** with a code-generation pipeline that scaffolds all 296 pages from `pages.json`, and **(c) a SaaS control plane** that provisions a fresh Frappe site per tenant.

User decisions already locked in:
- Backend: **Custom Frappe app on top of ERPNext**.
- Tenancy: **Site-per-tenant (Frappe-native)**.
- Scope: **All 296 screens** (via the scaffolder — no hand-writing 296 routes).
- i18n: **Arabic + English, bidirectional**.

---

## 1. High-level architecture

```
                 wildcard DNS *.madaar.app  →  one server / nginx
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
admin.madaar.app     t1.madaar.app        t2.madaar.app     (one Frappe site per tenant)
       │                    │                    │
 [Control-plane site]   [Tenant site]        [Tenant site]
 apps:                  apps:                apps:
   frappe                 frappe               frappe
   madaar_saas            erpnext              erpnext
                          madaar_core          madaar_core
                          madaar_construction  madaar_restaurant
                          madaar_fleet         madaar_logistics
                          ...(per package)     ...(per package)

                            ▲
                            │ HTTPS / Socket.IO (host header routes to the right site)
                            │
                One immutable React SPA build, served from CDN
                 → reads `window.location.host` at runtime to pick its tenant
                 → talks to `https://{host}/api/...`
```

Key point: **one React build serves every tenant**. Tenant is detected at runtime from the hostname; there are no per-tenant bundles.

---

## 2. Tech stack

| Concern              | Choice                                                | Notes                                                            |
|----------------------|-------------------------------------------------------|------------------------------------------------------------------|
| Bundler              | **Vite 5** + React 18 + TypeScript                    | SPA behind auth; no SSR need.                                    |
| Routing              | **React Router v6.4 data router**                     | Lazy-loaded routes from a generated manifest.                    |
| Server state         | **TanStack Query v5** via **frappe-react-sdk**        | SDK already wraps Frappe REST + Socket.IO + CSRF.                |
| Client state         | **Zustand**                                           | Tenant, auth, locale, sidebar collapse.                          |
| Forms                | **React Hook Form + Zod**                             | Only sane choice for 282 forms.                                  |
| UI primitives        | **shadcn/ui (Radix) + Tailwind v4**                   | Shipped as source so we re-skin to match scans exactly.          |
| Styling              | **Tailwind v4 with `@theme`** + extracted tokens.css  | Scan is already a Tailwind v4 site — tokens transfer 1:1.        |
| Tables               | **TanStack Table v8** (headless) wrapped in `<DataTable>` | Server-side paging/sort/filter against `frappe.client.get_list`. |
| Charts               | **ECharts** via `echarts-for-react`                   | Native RTL + Arabic numeral formatters.                          |
| Icons                | **lucide-react**                                      | Tree-shaken.                                                     |
| i18n                 | **react-i18next** + lazy module namespaces            | EN keys canonical; AR is the translation.                        |
| Fonts                | **Tajawal** (AR) + **Inter** (EN) via `@fontsource`   | Switched by `:lang(...)` selectors.                              |
| Observability        | Sentry + PostHog                                      | Tenant attached to every event.                                  |

Backend stack is **Frappe v15 + ERPNext + custom apps**, single bench, MariaDB, Redis, Socket.IO, nginx.

---

## 3. Backend — custom Frappe app split

One bench, multiple apps, installed per package:

| App                  | Installed on        | Purpose                                                                                                              |
|----------------------|---------------------|----------------------------------------------------------------------------------------------------------------------|
| `madaar_core`        | every tenant site   | Egyptian regional fields, feature-gating engine, tenant identity singleton, COA seed, branding, shared customizations |
| `madaar_egov_tax`    | tenants needing it  | Egypt VAT setup + ETA e-invoicing submission, bulk submit, VAT return                                                 |
| `madaar_construction`| tenants needing it  | BOQ, Progress Bill (Mostakhlas), Change Order, Project Budget, Subcontractor Agreement, Labor Record                  |
| `madaar_fleet`       | tenants needing it  | Vehicle, Driver, Trip, Fuel Log, Maintenance Request, Route, Violation, Accident, GPS Event                          |
| `madaar_workshop`    | tenants needing it  | Workshop Invoice, Vehicle Job Card, Service Type, Technician, Maintenance Package, Vehicle Service History            |
| `madaar_restaurant`  | tenants needing it  | Hall, Table, Menu Category/Item overlay, Modifier Group, Recipe (BOM), Production Center, Shift, Reservation, KDS Order |
| `madaar_logistics`   | tenants needing it  | Shipment extension, COD Settlement, Live Tracking Event, Delivery Order overlay                                       |
| `madaar_ecommerce`   | tenants needing it  | Banner, CMS Page, Coupon overlay, Store, Shipping Method                                                              |
| `madaar_saas`        | **control plane only** (NOT installed on tenants) | Tenant, Package, Package Feature, Subscription, Payment Method, Payment Transaction, Provisioning Job, Feature Usage |

### DocType mapping (R = reuse ERPNext, E = reuse + extend with fixtures, N = new in custom app)

| Scanned area                | DocType                                | Strat. | Target                                                              |
|-----------------------------|----------------------------------------|--------|---------------------------------------------------------------------|
| **Accounting**              | Chart of Accounts                      | R      | `Account` (tree)                                                    |
|                             | Cost Center, Fiscal Year, Journal Entry| R      | core ERPNext                                                        |
|                             | Trial Bal / P&L / Balance / Cash Flow  | R      | ERPNext reports                                                     |
| **Treasury**                | Treasury (cash box)                    | N      | `Madaar Treasury` (madaar_core)                                     |
|                             | Bank Account, Payment/Receipt Voucher  | R      | `Bank Account`, `Payment Entry`                                     |
|                             | Cheques (issued + received)            | N      | `Madaar Cheque` with 4-state workflow                               |
|                             | Credit/Debit Note                      | R      | Sales/Purchase Invoice `is_return`                                  |
| **Fixed Assets**            | Asset Category / Asset / Depreciation  | R      | ERPNext Assets module                                               |
|                             | Accident Log                           | N      | `Asset Accident Log`                                                |
| **CRM**                     | Lead, Opportunity                      | R      | `Lead`, `Opportunity`                                               |
|                             | Customer (+ tax IDs)                   | E      | `Customer` + e-invoicing fields                                     |
|                             | Customer Category                      | R      | `Customer Group`                                                    |
|                             | Activities / Follow-ups                | R      | `ToDo`, `Event`, `CRM Note`                                         |
| **Sales / Purchases**       | Quotation/SO/SI/PO/PI/Returns          | R + E  | ERPNext + ETA e-invoice fields on SI                                |
|                             | Sales Rep                              | R      | `Sales Person`                                                      |
| **Inventory**               | Item, Warehouse, Stock Entry, Transfer | R      | ERPNext Stock                                                       |
| **Manufacturing**           | BOM, Work Order, Work Center, Plan     | R      | ERPNext                                                             |
|                             | Material Issue / Finished Receipt / Scrap | R   | `Stock Entry` subtypes                                              |
| **Construction**            | Project                                | E      | `Project` + contract fields                                         |
|                             | BOQ                                    | N      | `Madaar BOQ` + child `BOQ Item`                                     |
|                             | Mostakhlas / Progress Bill             | N      | `Madaar Progress Bill` (posts GL via `Sales Invoice` on submit; retention parked in liability account) |
|                             | Change / Variation Order               | N      | `Madaar Change Order` (revises BOQ)                                 |
|                             | Project Budget                         | N      | `Madaar Project Budget` (per phase / cost center)                   |
|                             | Subcontractor                          | E      | `Supplier(is_subcontractor=1)` + `Madaar Subcontractor Agreement`   |
|                             | Equipment                              | E      | `Asset(is_equipment=1)` with hourly/daily rates                     |
|                             | Labor Record                           | N      | `Madaar Labor Record` → nightly rollup to Timesheet                 |
|                             | Material Request                       | R      | core ERPNext                                                        |
| **Fleet**                   | Vehicle, Driver, Trip, Fuel, Route, Maintenance, Violation, Accident, GPS Event | N | All in `madaar_fleet` (driver = Employee + Driver Profile overlay) |
| **Workshop**                | Workshop Invoice                       | E      | `Sales Invoice` linked to Vehicle Job Card                          |
|                             | Vehicle Job Card                       | N      | Separate from manufacturing Job Card (different domain)             |
|                             | Service Type, Maintenance Package      | N      | `madaar_workshop`                                                   |
|                             | Technician                             | E      | `Employee(is_technician=1)` + skills child                          |
| **Restaurant**              | Branch, POS Profile, POS Invoice       | R      | ERPNext HR + POS                                                    |
|                             | Hall, Table, Modifier Group, Modifier, Production Center, Reservation, KDS Order | N | `madaar_restaurant` |
|                             | Menu Category / Item                   | E      | `Item Group` + `Item(is_menu_item=1)` overlay                       |
|                             | Recipe                                 | R      | `BOM` (one per Menu Item)                                           |
|                             | Shift                                  | E      | `Shift Type` (HR)                                                   |
| **E-commerce**              | Product, Customer, Order, Return       | R      | ERPNext Website Item / Customer / SO                                |
|                             | Banner, CMS Page, Store, Shipping Method | N    | `madaar_ecommerce`                                                  |
|                             | Coupon                                 | E      | `Coupon Code` (already in ERPNext)                                  |
| **HR**                      | Employee/Dept/Attendance/Leave/Payroll | R      | HRMS module                                                         |
| **Logistics**               | Shipment, Delivery Trip, Delivery Note | R + E  | ERPNext + extension fields                                          |
|                             | COD Settlement                         | N      | `madaar_logistics`                                                  |
|                             | Live Tracking Event                    | N      | High-volume single-table doctype                                    |
| **Tax / E-Invoicing**       | VAT Setup, Tax Templates               | E      | + `Madaar Egypt Tax Settings` (singleton)                           |
|                             | E-Invoice Submission                   | N      | UUID/Long ID/signed XML/status/retries                              |
|                             | Bulk Submission Batch                  | N      | up to 100 invoices per ETA call                                     |
|                             | VAT Return                             | N      | period + line items + report                                        |
| **Support**                 | Ticket                                 | R      | `Issue`                                                             |
| **Users / Settings**        | User, Role, Company, Naming Series, Letterhead, API Keys, Webhooks, Audit, Workflow, Notifications | R | core Frappe |

### Egyptian e-invoicing (`madaar_egov_tax`)

ERPNext has no Egypt regional in this checkout (`erpnext/regional/` contains australia, italy, south_africa, turkey, uae, us). Template: copy structure of `regional/italy/` (Italian e-invoice is structurally similar — signed XML + submission tracking).

Workflow: `Sales Invoice.on_submit` hook → enqueue `madaar_egov_tax.eta.submit(doc)` on `long` queue → creates `Madaar EInvoice Submission` (state machine `pending → signed → submitted → accepted | rejected`) → signs (HSM/USB-token via local agent) → POSTs to ETA → polls for Long ID → updates source invoice. Cron retries every 5 min for `pending/failed`. Never block submit.

### Custom fields registered via fixtures
On `Customer`, `Supplier`, `Company`, `Sales Invoice`, `Sales Invoice Item`, `Item`: `eta_tax_registration_number`, `eta_branch_id`, `eta_activity_code`, `eta_item_code`, `eta_uuid`, `eta_long_id`, `eta_submission_status`, `eta_internal_id`.

### Feature gating
`madaar_core/hooks.py` registers `doc_events: { "*": { "before_insert": "madaar_core.limits.enforce", "on_trash": "madaar_core.limits.decrement" } }`. The enforcer maps `doctype → feature_key`, reads the cached limit from `Madaar Settings` (pushed by the control plane on subscription change), and atomically increments a counter via `UPDATE … SET current_count = current_count + 1 WHERE current_count < limit OR limit = -1`. Zero rows affected → raise `frappe.PermissionError("Limit reached for {feature}")`. Monthly counters reset by scheduled job.

A whitelisted endpoint `madaar_core.api.bootstrap` returns `{tenant_id, package, features:[{key,limit,used}], locale, branding}` — the React app reads this once at login to disable gated buttons in-UI before the server has to refuse.

### Fixtures per tenant (run by `madaar_core.setup.bootstrap_tenant`)
Egyptian COA (ship `chart_of_accounts/eg_standard.json` inside `madaar_core/fixtures/coa/`), default fiscal year, naming series, UoM (Arabic names), Egypt VAT 14% tax template, all custom fields, Arabic relabel via `property_setter.json`, Quotation + Progress Bill approval workflows.

---

## 4. SaaS control plane (`madaar_saas` on `admin.madaar.app`)

DocTypes: **Tenant** (subdomain, site_name, owner, status `trialing|active|past_due|suspended|canceled`, trial_end, region, db_size_mb, package), **Package** (prices, trial_days, app_set child), **Package Feature** (feature_key, limit, period), **Subscription**, **Payment Method** (Fawry, Vodafone Cash, Etisalat Cash, Orange Money, InstaPay, Meeza, Card via Paymob/Kashier, Bank Transfer), **Payment Transaction**, **SaaS Invoice**, **Tenant Provisioning Job**, **Feature Usage Snapshot**.

### Provisioning flow (on first paid Payment Transaction, enqueued on `long` queue)
1. Validate subdomain DNS-safe + unique.
2. `bench new-site {subdomain}.madaar.app --admin-password=$(generated)`.
3. `bench --site {site} install-app erpnext` then loop `install-app` for every app in `Package.app_set` (madaar_core always first).
4. `bench --site {site} execute madaar_core.setup.bootstrap_tenant --kwargs '{"tenant_id":...,"package":...,"owner_email":...}'` — seeds COA, fiscal year, doc series, default warehouse, VAT setup, creates owner with `System Manager`, writes `Madaar Settings` singleton.
5. Cloudflare API: create CNAME `{subdomain}.madaar.app → server`.
6. Wildcard TLS via LetsEncrypt DNS-01 (already issued for `*.madaar.app`); no per-site cert dance.
7. Email owner with login URL + temp password.
8. Update `Tenant.status = active`, finalise Provisioning Job log.

**Suspend**: `bench --site {site} set-config maintenance_mode 1`. **Backups**: per-tier (Free=weekly, Pro=daily, Enterprise=hourly) via `bench backup --with-files` to Cloudflare R2. **Delete**: 30-day soft hold, then `bench drop-site`.

---

## 5. Frontend — React project layout

```
erp-frontend/
├─ package.json                     pnpm; deps listed in §7
├─ vite.config.ts                   proxy /api, /assets, /files, /socket.io → dev.localhost:8000
├─ tailwind.config.ts               minimal; drives theme from tokens.css
├─ tsconfig.json
├─ .env.example                     VITE_ROOT_DOMAIN, VITE_TENANT_OVERRIDE
├─ index.html                       <html lang="ar" dir="rtl"> default
├─ scripts/
│  ├─ generate-tokens.mjs           design_tokens.json → src/styles/tokens.css
│  ├─ generate-pages.mjs            ★ pages.json → src/_generated/** (see §6)
│  ├─ sync-doctype-meta.mjs         pulls DocType meta → src/_generated/types/*.ts
│  ├─ extract-i18n.mjs              merges new keys into locales/{ar,en}/*.json
│  └─ url-to-doctype.map.ts         hand-curated URL→DocType hints
├─ src/
│  ├─ main.tsx                      boot, tenant detection, i18n init
│  ├─ App.tsx                       provider tree
│  ├─ app/
│  │  ├─ providers.tsx              FrappeProvider, QueryClient, I18n, Tenant, Theme, ErrorBoundary
│  │  ├─ router.tsx                 consumes _generated/pages.manifest.ts
│  │  └─ AppShell.tsx               navy sidebar (RTL → right) + topbar + <Outlet/>
│  ├─ lib/
│  │  ├─ tenant/{TenantContext.tsx, detect.ts}
│  │  ├─ api/
│  │  │  ├─ client.ts               FrappeProvider factory with tenant-aware baseURL
│  │  │  ├─ queries.ts mutations.ts keys.ts errors.ts csrf.ts
│  │  │  ├─ realtime.ts             useRealtime(doctype, name?) — invalidates query keys
│  │  │  ├─ files.ts                useFileUpload, getFileURL
│  │  │  └─ reports.ts              useFrappeReport, downloadPrintPDF
│  │  ├─ auth/
│  │  │  ├─ AuthContext.tsx useAuth.ts RequireAuth.tsx RequirePerm.tsx permissions.ts
│  │  ├─ i18n/
│  │  │  ├─ index.ts                react-i18next init, useDirection
│  │  │  └─ locales/{en,ar}/{common,forms,tables}.json + per-module namespaces
│  │  ├─ formatters/                number, numerals (arab/latn), date, currency
│  │  └─ obs/                       sentry.ts analytics.ts
│  ├─ components/
│  │  ├─ ui/                        Button, Input, Select, Card, Badge, Dialog, Drawer, Tabs, Skeleton, Toast (shadcn primitives)
│  │  └─ erp/
│  │     ├─ PageShell.tsx           breadcrumbs + title + actions slot + content
│  │     ├─ Sidebar.tsx Topbar.tsx LangSwitcher.tsx
│  │     ├─ StatCard.tsx            variants: orange|teal|violet|rose|yellow|emerald (gradients via static class lookup)
│  │     ├─ DataTable.tsx           takes {doctype, columns, filters?} — wires to useFrappeGetDocList
│  │     ├─ TreeView.tsx            for Chart of Accounts (uses is_group / parent_account)
│  │     ├─ FormShell.tsx           takes {doctype, fields?} — uses live DocType meta + RHF + Zod
│  │     ├─ LineItemsTable.tsx      RHF field array — journal lines / invoice lines / BOQ items
│  │     ├─ FilterBar.tsx BreadcrumbBar.tsx ActionsToolbar.tsx CategoryChip.tsx PrintButton.tsx
│  │     ├─ AreaCompareChart.tsx DonutChart.tsx KPIChart.tsx TopListCard.tsx
│  │     └─ FrappeReport.tsx        wraps frappe.desk.query_report.run in DataTable shell
│  ├─ modules/                      hand-written overrides; co-located by module
│  │  ├─ core/dashboard/overrides/page.tsx       ← dashboard 001 is too custom to generate
│  │  ├─ accounting/chart-of-accounts/overrides/page.tsx  ← uses TreeView + CategoryChip
│  │  └─ ...                        overrides only where the generator fallback isn't enough
│  ├─ _generated/                   CI-rewritten; NEVER hand-edited
│  │  ├─ pages.manifest.ts          { path, importFn, doctype, requiredPerm }[]
│  │  ├─ pages/<module>/<slug>/{index.tsx, meta.ts, i18n.json}
│  │  ├─ types/{DocType}.ts         TS interfaces per DocType (from sync-doctype-meta)
│  │  └─ report.json                {scaffolded, skipped_override, no_doctype}
│  └─ styles/
│     ├─ tokens.css                 generated from design_tokens.json
│     ├─ globals.css                tailwind layers + logical-prop resets + scrollbar
│     └─ fonts.css                  @fontsource/{tajawal,inter} + :lang() selectors
└─ .github/workflows/{ci.yml, preview.yml, release.yml, frappe-deploy.yml}
```

### Tenant detection (runtime, not build-time)
```ts
// src/lib/tenant/detect.ts
const host = window.location.host;                    // e.g. t1.madaar.app
const ROOT = import.meta.env.VITE_ROOT_DOMAIN;        // madaar.app
const sub  = host.replace(`.${ROOT}`, '');            // t1
export const tenant         = sub === 'app' || sub === host ? null : sub;
export const isControlPlane = sub === 'app';
export const apiBase        = `https://${host}`;      // same-origin; Frappe routes by Host header
```
Host header → Frappe site → no CORS, no separate API host. Control plane (`app.madaar.app`) uses a separate manifest (`controlPlane.manifest.ts`) listing tenant management / billing / provisioning routes.

### Auth
1. `POST /api/method/login` (sets `sid` cookie, SameSite=Lax across `*.madaar.app`).
2. `GET /api/method/frappe.boot.get_bootinfo` → hydrate user, roles, **`can_read/can_write/can_create/can_delete/can_submit/can_cancel/can_print/can_export` arrays** (do not query `DocPerm` directly).
3. Build permission map; expose `usePermission(doctype, action)` and `<RequirePerm doctype="..." action="read">` (generated scaffolds wrap every route).
4. Axios interceptor on 401 → redirect to `/login` preserving `from`.
5. Token mode (`Authorization: token {key}:{secret}`) for automation, opt-in via `localStorage` flag.

### Design system from scan tokens
- `scripts/generate-tokens.mjs` reads `design_tokens.json` and writes `src/styles/tokens.css` using Tailwind v4 `@theme`:
  ```css
  @theme {
    --color-primary: #10b981;
    --color-primary-dark: #059669;
    --color-sidebar: oklch(0.279 0.041 260.031);  /* slate-900 navy */
    --color-sidebar-fg: oklch(0.984 0.003 247.858);
    /* full emerald/orange/teal/violet/rose/yellow/pink/purple/blue/green scales */
    --font-sans: "Tajawal", "Inter", system-ui, sans-serif;
    --radius-card: 0.75rem;
  }
  ```
- `<StatCard variant>` and `<CategoryChip kind>` use **static class lookup objects** (not template literals) so Tailwind can detect the classes during purging.
- Logical CSS properties (`ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`) everywhere — no `left`/`right`. Sidebar uses `inset-inline-start: 0` so it sits on the right in RTL automatically.

### i18n + bidirectional
- `react-i18next` with `i18next-http-backend`; one namespace per module + `common`/`forms`/`tables`. Lazy-loaded.
- Locale in Zustand + `localStorage` (default `ar`).
- `<html lang dir>` updated reactively via effect; tailwind purely uses logical properties so no per-direction stylesheets.
- `formatters/numerals.ts` uses `Intl.NumberFormat(locale, { numberingSystem: locale === 'ar' ? 'arab' : 'latn' })`. ECharts axis/tooltip formatters call this. Storage stays in Western digits.

---

## 6. ★ Page scaffolder (`scripts/generate-pages.mjs`) — handles all 296 pages

**Input**: `scan_output/data/pages.json` (296 entries, each with url/title/name/tables/create_forms).

**For each page**:
1. `routePath` = URL pathname (strip `https://delta-enterprise.net`).
2. `module` = first path segment; `slug` = remaining segments.
3. `viewType` = derived: `/create` or non-trivial `create_forms` → `form`; `tables.length > 0` → `list` (or `tree` for known tree DocTypes like `Account`); otherwise → `detail`.
4. `doctype` = resolved via hand-curated `scripts/url-to-doctype.map.ts` (~80 explicit entries cover ~90 % of pages); unmapped pages emit `doctype: null` and are listed in `report.json` so a human fills them in.
5. **Filter out Laravel hidden fields** (`type: "hidden"`, names `_token`/`_method`).
6. Emit:
   - `_generated/pages/<module>/<slug>/index.tsx` — a thin component that renders `<PageShell>` containing `<DataTable>`, `<TreeView>`, `<FormShell>`, or `<FrappeReport>` based on `meta.viewType`, wrapped in `<RequirePerm>`.
   - `_generated/pages/<module>/<slug>/meta.ts` — `{ routePath, titleKey, doctype, viewType, columns?, fields?, screenshotUrl }`.
   - `_generated/pages/<module>/<slug>/i18n.json` — `{ "page.<slug>.title": "<Arabic from scan>", "page.<slug>.col.code": "الكود", ... }`.
7. Aggregate everything into `_generated/pages.manifest.ts`:
   ```ts
   export const routes = [
     { path: '/accounting/chart-of-accounts',
       importFn: () => import('../modules/accounting/chart-of-accounts/overrides/page')
                       .catch(() => import('./pages/accounting/chart-of-accounts')),
       doctype: 'Account', perm: 'read' },
     // ... 295 more
   ];
   ```
   Router consumes this with `createBrowserRouter` + lazy.
8. **Override mechanism**: if `src/modules/<module>/<slug>/overrides/page.tsx` exists, the manifest's `importFn` prefers it (the `.catch` fallback above). Generator never overwrites overrides. Generator does always rewrite `meta.ts` + `i18n.json` so column renames flow through.
9. `extract-i18n.mjs` merges the per-page `i18n.json` files into `locales/ar/pages.<module>.json` and `locales/en/pages.<module>.json` (EN values start as `__TODO__` placeholders for a translator to fill).
10. **Idempotency**: regenerate freely. CI runs `pnpm gen --check` and fails if `src/_generated/` is dirty — forces regenerated artifacts into PRs.
11. Console output:
    ```
    ✓ 296 pages processed
      scaffolded: 271
      skipped (override exists): 12
      no DocType mapping: 89   ← see report.json
    ```

### Why this works for 296 pages
- ~90 % of pages are CRUD on a DocType. `<DataTable doctype>` + `<FormShell doctype>` consume **live DocType meta** from Frappe (`frappe.desk.form.load.getdoctype`, cached in IndexedDB keyed by `meta.modified` so it busts after schema migrations) — so most forms work end-to-end with **zero per-page code** once the DocType exists in Frappe.
- Reports re-use `<FrappeReport name="…">` which calls `frappe.desk.query_report.run` and feeds the same `<DataTable>` shell.
- The remaining ~10 % (dashboards, KDS, Sales Pipeline kanban, POS terminal, GPS live map, BOQ editor, Mostakhlas calculator) become hand-written overrides — countable, not 296.

---

## 7. Backend ↔ Frontend bridge (`src/lib/api/`)

- **Transport**: `frappe-react-sdk` wrapped in our own `client.ts`. SDK already provides `useFrappeGetDocList`, `useFrappeGetDoc`, `useFrappeUpdateDoc`, `useFrappeCreateDoc`, `useFrappeDeleteDoc`, `useFrappeEventListener` (Socket.IO), plus CSRF handling. Wrapping isolates us if Frappe v16 forces a switch.
- **Query keys**: `qk.list(dt, opts)`, `qk.doc(dt, name)`, `qk.count(dt, filters)`, `qk.meta(dt)`, `qk.report(name, filters)`. Mutations invalidate the `['frappe', dt]` prefix.
- **Errors**: `_server_messages` is a stringified JSON array of stringified JSON objects — `parseFrappeError` unwraps and routes to a `sonner` toast.
- **CSRF**: token grabbed once from `bootinfo`, attached by an axios interceptor on every mutating call; re-fetched on 403 with `CSRFTokenError`.
- **Realtime**: `useRealtime(doctype, name?)` → `useFrappeDocumentEventListener` → `queryClient.invalidateQueries(['frappe', doctype])`. Production needs nginx proxying `/socket.io/` to port 9000 per tenant.
- **Files**: `useFileUpload` hits `/api/method/upload_file` with multipart; `getFileURL` knows about `is_private` and routes to `frappe.utils.file_manager.download_file` when needed.
- **Print**: `<PrintButton>` opens `/api/method/frappe.utils.print_format.download_pdf?doctype&name&format`.
- **DocType types**: `sync-doctype-meta.mjs` runs in CI against a reference Frappe site and writes `src/_generated/types/{DocType}.ts` (interfaces only, for editor autocomplete + `client.getDoc<SalesInvoice>(...)`). Runtime form/table rendering still uses **live** meta so tenant-added custom fields work without rebuilding.

### Composite/computed columns
The scanned tables include columns like "Balance" and "الحالة" that aren't directly stored. Three buckets handled by the scaffolder:
1. Already a Frappe field (`status` on most DocTypes) — straight bind.
2. Add a **virtual field** via Server Script in `madaar_core` (e.g., `balance` on `Account`) — appears like any other field.
3. Pure UI aggregation — `meta.ts` declares `{ id, kind: 'computed', fn: 'accountBalance' }` and the developer implements `accountBalance(row, ctx)` in a sibling `compute.ts` inside the page's override folder (preserved across regenerations).

---

## 8. Local dev environment

- `frappe_docker` (already vendored at `erpnext/docker/`): `docker compose up`. Create `dev.localhost`, `t1.localhost`, `t2.localhost` via `bench new-site`.
- DNS via `nip.io`: `t1.127.0.0.1.nip.io:8000` resolves automatically — no `/etc/hosts` edits.
- `vite.config.ts` proxies `/api`, `/assets`, `/files`, `/socket.io` to the bench.
- `VITE_TENANT_OVERRIDE=t1` env so devs can pin a tenant when running on bare `localhost:5173`.

## 9. CI/CD

- `ci.yml` (on PR): `pnpm lint && pnpm typecheck && pnpm test && pnpm gen --check && pnpm build`. The `gen --check` step runs the scaffolder in dry-run and fails if `src/_generated/` is dirty.
- `preview.yml`: Cloudflare Pages preview per PR with `VITE_ROOT_DOMAIN=preview.madaar.app`.
- `release.yml`: on `main`, single build → S3 + CloudFront behind wildcard `*.madaar.app` (ACM wildcard cert). One immutable build serves every tenant; tenant detection is purely runtime.
- `frappe-deploy.yml`: manual-dispatch — SSH → `bench update --no-backup` → `bench --site all migrate` in batches.

---

## 10. Critical files to be created (week-1 first commits)

Frontend skeleton:
- `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.eslintrc.cjs`, `.prettierrc`, `.env.example`, `index.html`, `README.md`.
- `src/main.tsx`, `src/App.tsx`, `src/app/{providers,router,AppShell}.tsx`.
- `src/lib/tenant/{TenantContext.tsx, detect.ts}`.
- `src/lib/api/{client, queries, mutations, keys, errors, csrf, realtime, files, reports}.ts`.
- `src/lib/auth/{AuthContext.tsx, useAuth.ts, RequireAuth.tsx, RequirePerm.tsx, permissions.ts}`.
- `src/lib/i18n/index.ts` + `src/lib/i18n/locales/{en,ar}/common.json`.
- `src/lib/obs/{sentry,analytics}.ts`.
- `src/styles/{tokens.css, globals.css, fonts.css}`.
- `src/components/ui/` (Button, Input, Select, Card, Badge, Drawer, Dialog, Tabs, Skeleton, Toast).
- `src/components/erp/` (PageShell, Sidebar, Topbar, StatCard, DataTable, FormShell, LineItemsTable, TreeView, FilterBar, BreadcrumbBar, PrintButton, ActionsToolbar, CategoryChip, FrappeReport, AreaCompareChart, DonutChart, KPIChart, TopListCard, LangSwitcher).
- `scripts/{generate-tokens.mjs, generate-pages.mjs, sync-doctype-meta.mjs, extract-i18n.mjs, url-to-doctype.map.ts}`.
- `.github/workflows/{ci.yml, preview.yml, release.yml, frappe-deploy.yml}`.

Backend (one folder per app under a `madaar-apps/` repo, installed into the bench):
- `madaar_core/` — `hooks.py`, `setup.py`, `madaar_core/api.py` (whoami, bootstrap, sync_limits), `madaar_core/limits.py`, fixtures (COA, custom fields, property setters, naming series, tax templates, workflows), DocTypes (`Madaar Settings`, `Madaar Feature Limit`, `Madaar Treasury`, `Madaar Cheque`, `Asset Accident Log`).
- `madaar_egov_tax/` — `eta/` (signing, submit, poll), DocTypes (`Madaar Egypt Tax Settings`, `Madaar EInvoice Submission`, `Madaar EInvoice Bulk Batch`, `Madaar VAT Return`).
- `madaar_construction/` — DocTypes for BOQ, Progress Bill, Change Order, Project Budget, Subcontractor Agreement, Labor Record.
- `madaar_fleet/`, `madaar_workshop/`, `madaar_restaurant/`, `madaar_logistics/`, `madaar_ecommerce/` — see DocType mapping table.
- `madaar_saas/` (control plane only) — Tenant, Package, Subscription, Payment Method, Payment Transaction, Provisioning Job, plus `provisioning.py` (the bench shell-out + Cloudflare DNS).

Critical reference files (already present in repo):
- `h:/coupons/erp_mr_adham/scan_output/data/pages.json` — drives the scaffolder.
- `h:/coupons/erp_mr_adham/scan_output/data/design_tokens.json` — drives `tokens.css`.
- `h:/coupons/erp_mr_adham/scan_output/docs/dashboard_documentation.md` — feature inventory + English keys.
- `h:/coupons/erp_mr_adham/scan_output/screenshots/001_*.png` (dashboard reference), `002_*.png` (TreeTable + CategoryChip reference), `007_*.png` (FormShell + LineItemsTable reference).
- `h:/coupons/erp_mr_adham/erpnext/erpnext/hooks.py` — template for `madaar_core/hooks.py`.
- `h:/coupons/erp_mr_adham/erpnext/erpnext/regional/italy/` — closest template for `madaar_egov_tax`.
- `h:/coupons/erp_mr_adham/erpnext/erpnext/projects/doctype/project/project.py` — base for construction Project hooks.

---

## 11. Phasing — recommended order of execution

| Phase | Output                                                                                                      |
|-------|-------------------------------------------------------------------------------------------------------------|
| 1     | Local bench + `dev.localhost` site + `erpnext` installed. React skeleton + tenant detect + auth + AppShell. |
| 2     | `madaar_core` skeleton with `Madaar Settings`, fixtures, custom fields, limits engine, `bootstrap` API.     |
| 3     | Token generator + design system (StatCard, Sidebar, Topbar, CategoryChip, fonts, RTL).                       |
| 4     | `<DataTable>`, `<FormShell>`, `<TreeView>` against live DocType meta. Hand-build the dashboard override.    |
| 5     | Page scaffolder + URL→DocType map. Run against `pages.json` → 271 generated routes wired into router.       |
| 6     | Fill `url-to-doctype.map.ts` to drive `report.json` → 0 unmapped Accounting + Sales + Purchases + Inventory.|
| 7     | `madaar_construction`, `madaar_fleet`, `madaar_workshop`, `madaar_restaurant`, `madaar_logistics` DocTypes. |
| 8     | `madaar_egov_tax` + ETA submission flow.                                                                    |
| 9     | `madaar_saas` control plane + provisioning automation + Payment Method integrations (Paymob/Kashier/Fawry).  |
| 10    | E2E with two real tenants (`t1`, `t2`). Performance pass on `Madaar GPS Event` + `Live Tracking`.            |

---

## 12. Verification

End-to-end checks once each phase lands:

**Phase 1 (foundation)**
- `pnpm dev` → `http://t1.127.0.0.1.nip.io:5173` shows the login screen with RTL Arabic copy + emerald primary + navy sidebar shell after login.
- Toggling locale switches `<html dir>` between `rtl`/`ltr`, sidebar swaps sides, fonts switch (`Tajawal` ↔ `Inter`).
- `POST /api/method/login` round-trips; `bootinfo` populates `useAuth().permMap`.

**Phase 2–3 (backend + design system)**
- `bench --site t1.localhost execute madaar_core.setup.bootstrap_tenant` succeeds; `Madaar Settings` exists; COA is seeded.
- Visual diff: rendered `<StatCard variant="orange">` next to screenshot `001` matches gradient + radius + shadow.
- `<CategoryChip kind="asset">` matches `002` chip colour.

**Phase 4 (data/form shells)**
- `<DataTable doctype="Account" />` renders the Account tree with the same columns the scan shows (الكود / اسم الحساب / النوع / الطبيعة / المستوى / الحالة / الرصيد / إجراءات).
- `<FormShell doctype="Journal Entry" />` reproduces screenshot `007` (header date/desc/cost-center + dynamic debit/credit line items + totals). Save round-trips to Frappe.

**Phase 5–6 (scaffolder)**
- `pnpm gen` reports `296 pages processed`. Visiting every URL under `/sitemap` (a dev-only debug page that walks `pages.manifest.ts`) renders without console errors.
- `report.json` shows `no DocType mapping: 0` after the map is filled for in-scope modules.

**Phase 7–8 (custom modules + e-invoicing)**
- Create a `Madaar BOQ` → create a `Madaar Progress Bill` against it → submit → confirm auto-generated `Sales Invoice` posts GL with retention parked in the correct liability account.
- Submit a `Sales Invoice` on a tenant with `madaar_egov_tax` installed → confirm an ETA submission moves `pending → signed → submitted → accepted` (against ETA preprod). Verify retry job picks up a forced failure.

**Phase 9 (SaaS)**
- On `admin.madaar.app`, create a Tenant + Subscription + paid Payment Transaction → background job provisions `t3.madaar.app` end-to-end; owner receives email; login on the new subdomain works; bootstrap API returns the package's feature limits.
- Hit a feature limit (e.g., max vehicles) → `before_insert` raises `PermissionError`; React shows the toast and disables the create button proactively from the `bootstrap` response.

**Phase 10 (perf)**
- Load 1M `Madaar GPS Event` rows in a test tenant; live tracking page renders the last 24 h in under 2 s; index on `(vehicle, timestamp)` confirmed via `EXPLAIN`.

---

## 13. Tenancy model — comparison

Two reasonable models. The whole stack was designed for **A** (Frappe site per tenant); the user surfaced **B** in a later message ("create a new copy of the code into GitHub and connect to the subdomain and its folder on the server"). Choosing **B** would invalidate large parts of the rest of this plan, so we lay them out side-by-side here.

### A. Frappe site per tenant (the original plan)

```
                 *.madaar.app  →  one server, one nginx
                            │
                ┌───────────┼───────────────┐
                │           │               │
       admin.madaar.app  t1.madaar.app   t2.madaar.app
                │           │               │
            one bench       one Frappe site per tenant
                │           │               │
        (control plane)  ───┴── shared codebase, shared bench, isolated DBs
```

- **Storage isolation**: each tenant has its own MariaDB database (`_<site_name_hash>`) and its own `sites/<tenant>/private/` folder for uploads. No cross-tenant data leakage. (This is Frappe's native multi-tenant story.)
- **Code isolation**: zero — every tenant runs the exact same `frappe/erpnext/madaar_*` source code. A platform fix is one deploy.
- **Provisioning time**: 30–90 s (the cost of `bench new-site` + COA seed + `bench --site … migrate`). Can be done synchronously after payment.
- **Update flow**: `git pull && bench migrate` once on the bench → every tenant gets the fix on the next request. No deploy fan-out.
- **Per-tenant config**: lives in `Madaar Settings` (a single-doctype singleton per site), `Madaar Feature Limit` rows, Property Setters for hidden/relabelled fields. The control plane writes these via the Frappe REST API; tenants can't.
- **Resource cost**: one node, one bench, one MariaDB instance (single host) handles 50–200 tenants easily before vertical splits.
- **Backup model**: per-site backups via `bench backup --with-files`, parametrised by tier (free=weekly, pro=daily, enterprise=hourly). Restore is `bench restore`.
- **Custom code per tenant**: limited to runtime configuration — feature flags, hidden fields, COA flavours, custom fields. You **cannot** ship "tenant X gets a different Python function" without a custom app, which would still install on the bench (i.e., available to all tenants — the app just sits dormant unless enabled).
- **"Login as tenant"**: implemented via `frappe.auth.LoginManager().login_as(user)` in a server-side endpoint on the admin site that proxies into the target site. Frappe supports this with full audit trail.

### B. Per-tenant git repo + per-tenant server folder

```
   *.madaar.app  →  one server, one nginx, separate upstream per tenant
        │
   ┌────┼────────────────────────────┐
   │    │                            │
admin t1.madaar.app              t2.madaar.app
   │    │                            │
   │  /srv/tenants/t1                /srv/tenants/t2
   │  github.com/madaar/tenant-t1    github.com/madaar/tenant-t2
   │  own bench, own MariaDB         own bench, own MariaDB
```

- **Storage isolation**: identical to A.
- **Code isolation**: full — each tenant has a `git clone` of the platform repo. Lets you patch one tenant without touching others.
- **Provisioning time**: minutes (clone repo → install dependencies → `bench new-site` → boot services → register nginx upstream). Genuinely needs to be a background job with retry.
- **Update flow**: deploy fan-out. A platform fix has to be pulled into N tenant clones (script with `parallel`, `pdsh`, or Ansible). Easy to forget one. Easy for one tenant to drift.
- **Per-tenant customization**: full — you can hand-edit any file. **This is the trap**: now you have N forks, each with their own state of "things the support team added at 11 PM." Within 6 months there's no single "platform version" you can reason about.
- **Resource cost**: ~3–5× model A. Each tenant has its own Frappe process group, its own Redis, its own MariaDB connection pool. Disk: a fresh `node_modules` and Python venv per tenant.
- **Backup model**: same as A, plus you also have to back up the per-tenant git working tree (because of the hand-edits problem above).
- **GitHub repo per tenant**: GitHub bills per private repo / per org seat. 200 tenants = 200 private repos. Likely fine on a Team plan; expensive at scale.
- **"Login as tenant"**: same Frappe mechanism, just routed to the right server folder via host header.
- **CDN-friendly React build**: lost. One immutable build per platform release no longer works because tenants can have different platform versions. Either re-introduce per-tenant builds (slow) or accept that the React code is the part that stays uniform across tenants (and then the tenant-fork advantage goes away anyway).

### When B is actually warranted

The one case where the cost of B is justified is **regulatory** — e.g., a customer's contract requires their data and their code to be in a separately-controlled artifact, demonstrably segregated from the rest of the platform. In that scenario the GitHub repo per tenant doubles as the audit trail. None of the requirements in your message suggest that's the situation here.

### Recommendation

**Use A.** It's what every Frappe-based SaaS does, what plan.md was designed around, and what the existing `madaar_saas` skeleton in `madaar-apps/` is set up for. The trade-off you might be worried about — "tenants are too coupled" — is solved by site-per-tenant DB isolation + feature gating, not by forking the code per tenant.

If you want belt-and-braces isolation later (e.g., a paid "private tier"), the cheap path inside model A is: same code, but pin those tenants to dedicated benches/hosts so they don't share CPU/memory with everyone else. That gets you the isolation benefit without the deploy fan-out cost.

---

## 14. First implementation chunk — super admin shell + Tenant / Package list pages

Scope intentionally small so we land it before touching provisioning automation. Aim: an `admin.madaar.app` you can log into, see a list of tenants, see a list of packages, and view (read-only) the details of either.

### 14.1 What we'll build

| Area | Output |
|---|---|
| Backend | `madaar_saas` app skeleton with three DocTypes: `Madaar Tenant`, `Madaar Package`, `Madaar Package Feature`. Each gets `frappe.has_permission` rules so only `System Manager` on the admin site can read. |
| Backend | Two whitelisted endpoints: `madaar_saas.api.list_tenants` (paged) and `madaar_saas.api.get_tenant(name)`. Return JSON the React app can consume. |
| Frontend | `lib/tenant/detect.ts` already detects control-plane vs tenant — we wire a second route tree (`controlPlane.manifest.ts`) that mounts only when `isControlPlane === true`. Existing tenant routes don't appear on `admin.madaar.app` and vice versa. |
| Frontend | Reuse `<AppShell>` / `<Sidebar>` / `<Topbar>` / `<Footer>` unchanged. New nav config drives a different sidebar. Same emerald palette, same RTL. |
| Frontend | Three pages: `/tenants` (list, `<DataTable>` against `Madaar Tenant`), `/tenants/:name` (read-only detail), `/packages` (list against `Madaar Package`). No create / edit yet — those come in chunk 2 along with provisioning. |
| i18n | New `nav.admin.*` and `admin.tenant.*` keys in both `common.ar.json` and `common.en.json`. |

### 14.2 DocType definitions (just the fields, not the full JSON)

**Madaar Tenant** (`madaar-apps/madaar_saas/madaar_saas/doctype/madaar_tenant/`):
- `tenant_id` (Data, unique, autoname series `TEN-.####`)
- `company_name` (Data, reqd) — what the customer calls themselves
- `subdomain` (Data, reqd, unique, lowercase, DNS-safe) — `t1` in `t1.madaar.app`
- `site_name` (Data, read-only) — derived: `{subdomain}.madaar.app`
- `owner_email` (Data, reqd, email format)
- `owner_phone` (Data)
- `contact_address` (Small Text)
- `status` (Select: `trialing | active | past_due | suspended | canceled`, default `trialing`)
- `trial_end` (Date)
- `region` (Select: `EG | SA | AE | …`, default `EG`)
- `default_language` (Select: `ar | en`, default `ar`)
- `package` (Link → `Madaar Package`, reqd)
- `subscription_start` (Date)
- `subscription_end` (Date)
- `credits` (Currency, default 0) — prepaid balance for usage-based features
- `notes` (Text)
- Audit fields handled by Frappe (`owner`, `creation`, `modified`, `modified_by`).

**Madaar Package** (`madaar-apps/madaar_saas/madaar_saas/doctype/madaar_package/`):
- `package_code` (Data, unique, autoname series `PKG-.####`)
- `package_name` (Data, reqd) — human label
- `description` (Small Text)
- `monthly_price` (Currency)
- `annual_price` (Currency)
- `currency` (Link → `Currency`, default `EGP`)
- `trial_days` (Int, default 14)
- `is_active` (Check, default 1)
- `apps_to_install` (Small Text) — newline-separated list of `madaar_*` app names; provisioning reads this
- `features` (Table → `Madaar Package Feature`) — child table

**Madaar Package Feature** (child of `Madaar Package`):
- `feature_key` (Data, reqd) — e.g. `max_sales_invoices`, `enable_construction`
- `label_ar` (Data) — for the admin UI
- `label_en` (Data)
- `limit` (Int, default -1) — `-1` = unlimited
- `period` (Select: `monthly | yearly | total`, default `total`)

(The runtime enforcement of these limits lives in `madaar_core.limits` per [§3 — Feature gating](#feature-gating). The control plane just *defines* the limits.)

### 14.3 Whitelisted API surface

```python
# madaar_saas/api.py
@frappe.whitelist()
def list_tenants(start=0, page_length=20, search=None, status=None):
    """Returns {count, rows: [{name, company_name, subdomain, status, package, subscription_end, ...}]}.
       Only accessible to System Manager on the admin site."""
    _require_admin()
    ...

@frappe.whitelist()
def get_tenant(name):
    """Returns the full Tenant doc + its Package + computed `current_usage` per feature.
       Same admin-only gate."""
    _require_admin()
    ...

def _require_admin():
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Admin only"), frappe.PermissionError)
    # And the site itself must be the control plane.
    if frappe.local.site != frappe.conf.get("control_plane_site"):
        frappe.throw(_("Admin endpoints not available on tenant sites"), frappe.PermissionError)
```

### 14.4 Frontend layout

```
frontend/src/
├─ app/
│  └─ router.tsx                      ★ branches on isControlPlane: mounts adminRoutes XOR tenantRoutes.
├─ admin/                             ← new top-level folder for admin-only code
│  ├─ adminRoutes.ts                  Static route table (no scaffolder — small + hand-written).
│  ├─ AdminSidebar.tsx                Curated nav for the admin shell (sections: Tenants / Packages / Billing / Audit).
│  ├─ pages/
│  │  ├─ TenantList.tsx               <DataTable doctype="Madaar Tenant" columns={…} /> + status filter chips.
│  │  ├─ TenantDetail.tsx             Header card + tabs: Overview / Subscription / Features / Activity. Read-only in this chunk.
│  │  └─ PackageList.tsx              <DataTable doctype="Madaar Package" /> with monthly_price + apps_to_install columns.
├─ lib/tenant/detect.ts               (existing) — already returns isControlPlane: boolean.
└─ components/erp/AppShell.tsx        (existing) — unchanged; AdminSidebar slots in where Sidebar was.
```

The trick that keeps both shells aligned: `<AppShell>` takes its sidebar as a child instead of importing one directly. Two `<AppShell>` callers (`<TenantAppShell>` / `<AdminAppShell>`) each pass the right sidebar in. Same colours, same Topbar, same Footer.

### 14.5 Files we'll touch / create (chunk-1 only)

| Path | Action |
|---|---|
| `madaar-apps/madaar_saas/` | **NEW** — Frappe app skeleton (`__init__.py`, `setup.py`, `hooks.py`, empty `fixtures/`). |
| `madaar-apps/madaar_saas/madaar_saas/doctype/madaar_tenant/` | **NEW** — `madaar_tenant.json` (DocType), `madaar_tenant.py`, `__init__.py`. |
| `madaar-apps/madaar_saas/madaar_saas/doctype/madaar_package/` | **NEW** — same pattern. |
| `madaar-apps/madaar_saas/madaar_saas/doctype/madaar_package_feature/` | **NEW** — child DocType. |
| `madaar-apps/madaar_saas/madaar_saas/api.py` | **NEW** — `list_tenants`, `get_tenant`, `_require_admin`. |
| `madaar-apps/madaar_saas/madaar_saas/permissions.py` | **NEW** — `has_permission` hook ensuring tenants can't see SaaS DocTypes. |
| `docker-compose.yml` / `docker/entrypoint.backend.sh` | **EDIT** — install `madaar_saas` on the `admin.localhost` site only (not on `dev.localhost` / `t1.localhost`). |
| `frontend/src/admin/` | **NEW** — folder with the three pages + `AdminSidebar.tsx` + `adminRoutes.ts`. |
| `frontend/src/app/router.tsx` | **EDIT** — branch on `useTenant().isControlPlane`. |
| `frontend/src/app/AppShell.tsx` | **EDIT** — accept a `sidebar` prop so both shells reuse it. |
| `frontend/src/lib/i18n/locales/{ar,en}/common.json` | **EDIT** — add `nav.admin.tenants`, `nav.admin.packages`, `admin.tenant.status.*` keys. |

### 14.6 Out of scope for chunk 1

- Provisioning automation (`bench new-site`, DNS, TLS) — chunk 2.
- Create / edit / suspend / "login as" actions on tenants — chunk 2.
- Billing / payment gateway integration (Paymob / Kashier / Fawry) — chunk 3.
- Field-level visibility control per tenant (Property Setter admin UI) — chunk 4.
- Bulk operations (force-migrate all tenants, broadcast notifications) — chunk 5.

### 14.7 Verification for chunk 1

- `bench --site admin.localhost install-app madaar_saas` succeeds; the three DocTypes appear in the Desk's Module Def list.
- Creating a `Madaar Tenant` manually in the Frappe Desk persists; the `site_name` is auto-filled from `subdomain`.
- Hitting `https://admin.localhost:8000/api/method/madaar_saas.api.list_tenants` with a System Manager session returns the row.
- Hitting the same endpoint on `dev.localhost` / `t1.localhost` returns `403 PermissionError` (because `_require_admin` rejects non-control-plane sites).
- React: visiting `admin.localhost:5173` shows the admin sidebar (Tenants / Packages); visiting `t1.localhost:5173` shows the regular tenant sidebar. They don't bleed into each other.

---

## 15. Open items / decisions deferred

1. **DNS provider**: assumed Cloudflare for wildcard DNS-01 + CNAME automation. Swap to Route53 if that's the user's stack.
2. **Payment gateways**: pick one of Paymob / Kashier for card; confirm Fawry / Vodafone Cash / Etisalat Cash / Orange Money / InstaPay / Meeza priorities. Wallet integrations vary in onboarding effort.
3. **Letterhead / branding per tenant**: assumed `Madaar Settings` holds a logo + accent colour; React reads via bootstrap. Confirm scope (per-branch branding? per-print-format?).
4. **Cheques as `Madaar Cheque` (chosen) vs extending `Bank Transaction`**: confirm — the chosen approach is cleaner for the 4-state workflow + reporting.
5. **Restaurant POS**: confirmed reuse of ERPNext `POS Profile` / `POS Invoice` with restaurant overlay fields; KDS as a projection only (no duplicate line items).
6. **PWA / offline**: out of scope for v1.
7. **Mobile fleet / driver app**: scan doesn't include it; flag if needed in a later iteration.
8. **English content for screens that exist only in Arabic in the scan**: translator work — flagged as `__TODO__` in `locales/en/pages.*.json` after extraction.
