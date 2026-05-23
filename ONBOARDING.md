# ONBOARDING — Madaar ERP

Read this first. You have ~10 minutes to be productive on this codebase.

This is the file an AI agent (or new human contributor) should consume on first contact. It covers what the project *is*, where things *live*, the conventions that aren't visible from any single file, and the gotchas that will burn you if you ignore them.

For the full design rationale, read [plan.md](./plan.md) (672 lines). This file is the fast path — the rules of the road, not the architecture spec.

---

## 1. What this project is, in one breath

A multi-tenant SaaS ERP cloning a scanned Laravel reference ("مدار ERP" by Delta Enterprise). Backend is **Frappe v15 + ERPNext + 9 custom Frappe apps**. Frontend is a **single React SPA** that serves every tenant — tenant identity is detected at runtime from the hostname. Locale is **Arabic + English with full RTL**. Currency is **EGP**, region is Egypt (e-invoicing, etc.).

Each customer gets their own Frappe **site** (i.e., their own MariaDB database) on a subdomain like `t1.madaar.app`. Code is shared across all tenants — one bench, one SPA build.

---

## 2. Repo layout

```
h:/coupons/erp_mr_adham/
├── README.md                     short top-level intro + docker quick-start
├── plan.md                       ★ 672-line master design. Read sections 3, 5, 6 first.
├── ONBOARDING.md                 ← you are here
├── docker-compose.yml            db + redis + backend (bench) + frontend (vite)
├── docker/                       backend.Dockerfile + frontend.Dockerfile + entrypoint
├── scripts/
│   └── deploy.sh                 ★ the only deploy script. Server mode runs bench
│                                   migrate + rebuilds SPA; local mode just rebuilds.
├── erpnext/                      vendored ERPNext source — REFERENCE ONLY, never edit
├── scan_output/                  ★ the Laravel scan that drives the page generator:
│   ├── data/pages.json             296 pages with tables + form fields
│   ├── data/design_tokens.json     Tailwind v4 CSS variables (emerald + navy)
│   └── screenshots/                001..296 PNGs of the reference UI
├── madaar-apps/                  ★ our custom Frappe apps (one per package):
│   ├── madaar_core/                installed on EVERY tenant. Has the cash/cheque/
│   │                               LMS/treasury doctypes, the limits engine, the
│   │                               bootstrap API, and all custom-field fixtures.
│   ├── madaar_construction/        BOQ, Progress Bill (Mostakhlas), Change Order
│   ├── madaar_ecommerce/           Banner, CMS Page, Store, Shipping Method
│   ├── madaar_egov_tax/            Egypt ETA e-invoicing
│   ├── madaar_events/              Event Request, Finance Case, Schedule, Closure
│   ├── madaar_fleet/               Vehicle, Driver, Trip, Fuel Log, GPS Event
│   ├── madaar_logistics/           Shipment, COD Settlement, Delivery Order
│   ├── madaar_restaurant/          Hall, Table, Modifier, Reservation
│   └── madaar_workshop/            Vehicle Job Card, Service Type, Technician
└── frontend/                     React + Vite + Tailwind v4 SPA
    ├── package.json              scripts: dev, build, typecheck, gen
    ├── scripts/                  generate-pages.mjs (★), generate-tokens.mjs,
    │                             url-to-doctype.map.mjs, page-titles-{ar,en}.mjs
    └── src/
        ├── main.tsx              boot, i18n init, FrappeProvider, tenant detect
        ├── App.tsx               provider tree
        ├── app/
        │   ├── router.tsx        ★ all routes. Generated routes are at the bottom.
        │   └── AppShell.tsx      sidebar + topbar + <Outlet/>
        ├── components/erp/       PageShell, Sidebar, Topbar, DataTable, FormShell, …
        ├── components/super-admin/ admin-only shell
        ├── lib/
        │   ├── auth/             RequireAuth, RequirePerm, useAuth, permissions
        │   ├── tenant/           detect.ts — runtime tenant detection from host
        │   ├── i18n/             react-i18next + ar/en locales
        │   └── …
        ├── modules/              ★ hand-written overrides per module/slug.
        │                         <module>/<slug>/overrides/page.tsx wins over
        │                         the generated _generated/pages/<module>/<slug>.
        ├── pages/                top-level pages NOT in the scan (POSPage, LMS,
        │                         Settings, SuperAdmin*, Events…)
        └── _generated/           ★ CI-rewritten. NEVER hand-edit. Files in here
                                  are produced by `pnpm gen` from scan_output.
```

---

## 3. Tech stack quick reference

| Layer | Choice |
|---|---|
| Backend | Frappe v15 + ERPNext, single bench, MariaDB, Redis, Python 3.11 |
| Custom backend | 9 Frappe apps under `madaar-apps/` |
| Frontend bundler | Vite 5 + React 18 + TypeScript |
| Routing | React Router v6.4 data router |
| Server state | `frappe-react-sdk` (wraps TanStack Query) — `useFrappeGetDocList`, `useFrappeGetCall`, `useFrappePostCall`, `useFrappeCreateDoc` |
| Forms | React Hook Form + Zod |
| Styling | Tailwind v4 with `@theme`; tokens come from `scan_output/data/design_tokens.json` via `generate-tokens.mjs` |
| Tables | TanStack Table v8 wrapped in `<DataTable doctype=… />` |
| Icons | lucide-react |
| i18n | react-i18next, AR default, RTL switch on `<html dir>` |
| Fonts | Tajawal (AR) + Inter (EN), `:lang(...)` selectors |

---

## 4. Critical conventions (read before editing)

### 4.1 Backend — Frappe app structure

A custom DocType lives at:
```
madaar-apps/<app>/<app>/<app>/doctype/<doctype_name_snake>/<doctype_name_snake>.{json,py}
```
e.g. `madaar-apps/madaar_core/madaar_core/madaar_core/doctype/madaar_cheque/madaar_cheque.json`.

The `.json` is the DocType definition (fields, perms, autoname). The `.py` is the Python controller class. Hooks fire as methods on this class: `validate()`, `on_submit()`, `on_cancel()`, `on_update()`, `before_insert()`.

Whitelisted API endpoints (called from React) live in `<app>/<app>/api.py` and use the `@frappe.whitelist()` decorator. They're called from the frontend as `madaar_core.api.<function_name>`.

### 4.2 Frontend — three places a page can live

1. **Generated** (`frontend/src/_generated/pages/<module>/<slug>/index.tsx`) — produced by `scripts/generate-pages.mjs` from `scan_output/data/pages.json`. Don't hand-edit. Re-run `pnpm gen` to regenerate.
2. **Override** (`frontend/src/modules/<module>/<slug>/overrides/page.tsx`) — wins over the generated one. Use this when the auto-scaffold isn't enough. The router prefers the override via `import.meta.glob` in [frontend/src/app/router.tsx](frontend/src/app/router.tsx).
3. **Hand-written top-level** (`frontend/src/pages/*.tsx`) — for pages that aren't in the URL scan (POSPage, LMS, Settings, SuperAdmin*, Events). Wire them in `router.tsx` manually.

### 4.3 Frontend — sidebar entries

Sidebar config lives in [frontend/src/components/erp/Sidebar.tsx](frontend/src/components/erp/Sidebar.tsx). It's a hand-written array of `{ headerAr, items: [{ to, labelAr, icon, accent, groups: […] }] }`. To add a link, append to the right module's `groups[].leaves[]`. Routes that aren't in this array still work — they just won't show in the sidebar.

### 4.4 i18n

Locale is `ar` by default. Inline Arabic literals are fine throughout the codebase (most of the UI is Arabic-only because the scan is Arabic-only). When you do need a runtime English alternative, use `const isAr = i18n.language === 'ar';` and ternary it inline:
```tsx
{isAr ? 'بحث' : 'Search'}
```
Don't introduce new react-i18next namespaces unless you're translating a whole module.

### 4.5 Tailwind tokens

Brand colours come from CSS variables defined in `src/styles/tokens.css` (generated from `scan_output/data/design_tokens.json`). Use `bg-[color:var(--color-brand-600)]` etc. The linter may suggest a shorter form (`bg-brand-600`) — both work. Use logical properties: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*` — never `ml-*`/`mr-*`/`left-*`/`right-*`, because RTL has to "just work".

### 4.6 API patterns

Reading a list:
```tsx
const { data, isLoading } = useFrappeGetDocList<Row>('Sales Invoice', {
  filters: [['docstatus', '=', 1]],
  fields: ['name', 'customer', 'grand_total'],
  limit: 50,
});
```

Calling a custom GET endpoint:
```tsx
const { data, mutate } = useFrappeGetCall<{ message: Row[] }>(
  'madaar_core.api.list_pos_profiles',
  undefined,                  // params
  'pos-profiles-key',         // SWR key (optional; defaults to method name)
);
```

Calling a custom POST/mutation endpoint:
```tsx
const { call, loading } = useFrappePostCall<{ message: Out }>('madaar_core.api.open_pos_shift');
await call({ pos_profile: 'POS - X', opening_amount: 0 });
```

Creating a doc:
```tsx
const { createDoc, loading } = useFrappeCreateDoc();
await createDoc('POS Invoice', payload);
```

---

## 5. ★ The money-routing rule (project policy)

When wiring any custom money-movement doctype's `on_submit` (Cheque, Treasury transfer, Progress Bill, Fuel Log, COD Settlement, Workshop Job Card, Event Finance Case, LMS Payment, etc.), route the GL accounts by payment method:

- **Cash** → the linked `Madaar Treasury`'s `account` field (a GL `Account` of type Cash).
- **Cheque or Bank** → the linked Frappe `Bank Account`'s `account` field (a GL `Account` of type Bank).

Never hard-code `"Cash - <abbr>"`. Always read the GL account off the Treasury or Bank Account master.

Worked example — Madaar Cheque on submit (see [madaar_cheque.py](madaar-apps/madaar_core/madaar_core/madaar_core/doctype/madaar_cheque/madaar_cheque.py)):
- Received from a Customer → debit linked Bank Account's GL, credit party receivable (via `erpnext.accounts.party.get_party_account`)
- Issued to a Supplier → debit party payable, credit linked Bank Account's GL
- Cancel reverses the JV (find it via the `journal_entry` link field stored on the cheque)

For Cash flows, the pattern is identical but the debit/credit account comes from `Madaar Treasury.account` instead of `Bank Account.account`.

---

## 6. Common tasks — how do I…

### …add a new page that wasn't in the scan?

1. Create the component at `frontend/src/pages/MyPage.tsx` (or under `frontend/src/modules/<module>/MyPage.tsx` if it's module-scoped).
2. Add a lazy import to [frontend/src/app/router.tsx](frontend/src/app/router.tsx).
3. Add a route inside the `'/'` parent's `children` array (above `...generated` so it doesn't get shadowed).
4. Add a sidebar entry in [frontend/src/components/erp/Sidebar.tsx](frontend/src/components/erp/Sidebar.tsx) if it should be navigable.

### …add a new DocType to an existing custom app?

1. Create `madaar-apps/<app>/<app>/<app>/doctype/<snake_name>/{<snake_name>.json, <snake_name>.py, __init__.py}`.
2. Define the fields in the `.json` (copy the format from a sibling — there are dozens of examples).
3. Implement the Python controller class in the `.py` (inherit from `frappe.model.document.Document`).
4. On the Frappe host, run `bench --site <site> migrate` to install the schema.

**JSON gotcha**: never save these files with a UTF-8 BOM (`\xef\xbb\xbf` prefix). `bench migrate` crashes on it. Most editors will save without BOM by default; verify with `head -c 3 file.json | xxd`. If you see `ef bb bf`, strip it.

### …make a custom doctype post to GL?

Follow the rule in §5. The pattern is always:
1. Resolve the GL account (`Treasury.account` for cash, `Bank Account.account` for bank/cheque).
2. Resolve the party's receivable/payable: `from erpnext.accounts.party import get_party_account`.
3. Build a `Journal Entry` with two rows (debit + credit), attach `party_type`/`party` ONLY to the row that lives on the party account.
4. `je.insert()` + `je.submit()`. Store `je.name` back on the source doc (add a read-only `journal_entry` Link field if it doesn't exist).
5. `on_cancel` → cancel the linked JV.

Reference implementation: [madaar_cheque.py](madaar-apps/madaar_core/madaar_core/madaar_core/doctype/madaar_cheque/madaar_cheque.py).

### …add a whitelisted API endpoint?

Append a function to `madaar-apps/<app>/<app>/api.py` with the `@frappe.whitelist()` decorator. The frontend will reach it at `<app>.api.<function_name>`. See [madaar_core/api.py](madaar-apps/madaar_core/madaar_core/api.py) for many examples (bootstrap, dashboard_stats, super_admin_overview, POS endpoints).

### …deploy?

```bash
git push origin main
ssh <frappe-host>
cd /path/to/erp_mr_adham
bash scripts/deploy.sh <site-name>           # e.g. site1.local
```

[scripts/deploy.sh](scripts/deploy.sh) does: `git pull` → install missing madaar apps via `bench get-app` → `bench migrate` → clear cache → `pnpm install && pnpm gen && pnpm build` → rsync `frontend/dist/` to `/var/www/madaar-spa/` → reload nginx.

If a new madaar app needs to be installed on a site for the first time (the script only auto-installs the ones missing from `apps/`):
```bash
bench --site <site-name> install-app madaar_events
bench --site <site-name> migrate
```

---

## 7. Anti-patterns — don't do these

- **Don't edit `frontend/src/_generated/`** — anything in there is overwritten by `pnpm gen`. Use the override mechanism in `frontend/src/modules/<module>/<slug>/overrides/page.tsx` instead.
- **Don't edit `erpnext/`** — it's a vendored reference clone, never installed from this repo. Real ERPNext install happens via `bench get-app erpnext` in the Dockerfile.
- **Don't delete existing doctypes or fields** in `madaar-apps/`. The user's policy is: extend freely, but hide unused fields in the frontend rather than removing them in the backend. (Removals break migrations on tenants that already have data.)
- **Don't save `madaar-apps/**/*.json` with a UTF-8 BOM.** Bench migrate dies on it. If your editor adds one, strip it.
- **Don't hard-code GL account names** like `"Cash - MAD"`. Read off Treasury or Bank Account. (See §5.)
- **Don't use physical CSS properties** (`ml-*`, `mr-*`, `left-*`, `right-*`). Use logical (`ms-*`, `me-*`, `start-*`, `end-*`) so RTL works for free.
- **Don't add a new Tailwind class via template literals** like `` `bg-${color}-500` `` — the purge can't see them. Use a static lookup map.
- **Don't push directly to `main` if a hook fails.** Pre-commit/pre-push hooks exist for a reason; fix the underlying issue.

---

## 8. Recent state (as of 2026-05-23)

The most active development surface right now:

- **POS (retail cashier)** — newly shipped. Lives at `/retail/pos`. Backend in [madaar_core/api.py](madaar-apps/madaar_core/madaar_core/api.py) (`list_pos_profiles`, `get_pos_profile`, `current_pos_opening`, `open_pos_shift`, `close_pos_shift`, `get_pos_payment_modes`, `lookup_item_by_barcode`, `create_default_pos_profile`). Frontend in [POSPage.tsx](frontend/src/pages/POSPage.tsx).
- **Super Admin** — `/super-admin/*` shell with a separate layout, no sidebar. Manages Companies, Plans, Subscriptions, Modules, Users.
- **GL posting** — surface-only pass landed for Madaar Cheque and Madaar Event Finance Case. Still missing for Madaar Treasury Transfer (the doctype doesn't exist yet), Progress Bill, Fuel Log, COD Settlement, Workshop Job Card, Reservation, Labor Record, Change Order, Construction Contract, Event Contract, LMS Payment.
- **Dashboards** — real KPIs + charts across 14 module dashboards via [src/lib/dashboards/configs.tsx](frontend/src/lib/dashboards/configs.tsx).
- **Page coverage** — most of the 296 scanned URLs route to either generated pages or hand-written overrides. Some custom doctypes don't have a backing app installed on every tenant — symptom is "DocType X returned no field metadata".

Run `git log --oneline -20` to see what landed in the last day.

---

## 9. Glossary

| Term | Meaning |
|---|---|
| **مدار / Madaar** | The reference ERP system being cloned (Delta Enterprise's Laravel app at `delta-enterprise.net` and `H:\coupons\Madaar ERP\Madaar ERP`) |
| **DocType** | A Frappe entity definition — like a SQL table + form + permissions + lifecycle hooks all in one |
| **Site** | A Frappe tenant — has its own MariaDB database, its own apps installed, its own URL |
| **Bench** | The Frappe runtime — a directory containing all apps, sites, and configs |
| **Mostakhlas / مستخلص** | Progress Bill in construction — a periodic invoice for work-in-progress on a project |
| **BOQ** | Bill of Quantities — itemized estimate of construction work |
| **POS Profile** | ERPNext's "cashier register configuration" (warehouse, currency, payment modes, default customer) |
| **ETA** | Egyptian Tax Authority — the regulator for Egypt's e-invoicing |
| **e-invoice** | Government-submitted invoice with UUID + signed XML, tracked via `Madaar EInvoice Submission` |
| **Bench Entry** | A Journal Entry voucher_type for bank-side cash movements |
| **GL Entry** | A row in `tabGL Entry` — Frappe's underlying ledger |
| **Property Setter** | Frappe's mechanism for tweaking field labels/visibility per site without forking the DocType |
| **Custom Field** | Frappe's mechanism for adding a field to a stock DocType (e.g. `madaar_barcode` on `Item`) |

---

## 10. Where to find things — fast lookup

| Want to find… | Look here |
|---|---|
| All routes | [frontend/src/app/router.tsx](frontend/src/app/router.tsx) |
| All sidebar links | [frontend/src/components/erp/Sidebar.tsx](frontend/src/components/erp/Sidebar.tsx) |
| All whitelisted APIs (tenant) | [madaar-apps/madaar_core/madaar_core/api.py](madaar-apps/madaar_core/madaar_core/api.py) |
| Tenant detection logic | [frontend/src/lib/tenant/detect.ts](frontend/src/lib/tenant/detect.ts) |
| Auth + perm logic | [frontend/src/lib/auth/](frontend/src/lib/auth/) |
| The shared `<PageShell>` | [frontend/src/components/erp/PageShell.tsx](frontend/src/components/erp/PageShell.tsx) |
| The shared `<DataTable>` | [frontend/src/components/erp/DataTable.tsx](frontend/src/components/erp/DataTable.tsx) |
| Page scaffolder | [frontend/scripts/generate-pages.mjs](frontend/scripts/generate-pages.mjs) |
| Token generator | [frontend/scripts/generate-tokens.mjs](frontend/scripts/generate-tokens.mjs) |
| URL → DocType map | [frontend/scripts/url-to-doctype.map.mjs](frontend/scripts/url-to-doctype.map.mjs) |
| Deploy script | [scripts/deploy.sh](scripts/deploy.sh) |
| Backend custom fields fixtures | `madaar-apps/madaar_core/madaar_core/hooks.py` (`fixtures` block) |
| The Laravel scan that drives the generators | [scan_output/data/pages.json](scan_output/data/pages.json) |
| The full design rationale | [plan.md](./plan.md) — sections 3 (backend split), 5 (frontend layout), 6 (scaffolder) |

---

## 11. When in doubt

- Read [plan.md](./plan.md) sections 3, 5, 6 — they cover 90% of the architectural intent.
- Check `git log --oneline -30` for what's been moving recently.
- For a specific module, scan `madaar-apps/<app>/<app>/<app>/doctype/` for what doctypes exist, then `frontend/src/modules/<area>/` for the matching React side.
- If a page errors with "DocType X returned no field metadata", the corresponding madaar app isn't installed on that tenant site. Fix on the Frappe host:
  ```bash
  bench --site <site-name> install-app <madaar_app>
  bench --site <site-name> migrate
  ```
