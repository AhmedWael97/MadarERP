# Plan: Super Admin Dashboard — SaaS Tenant Control Plane

## Key Decisions (locked)
- Control plane lives on the **same Frappe site** (dev.localhost / main site), role-gated by "Super Administrator" role
- Tenant provisioning is **fully automated** — API enqueues a background job that runs `bench new-site` + `install-app` + `bootstrap_tenant`
- COA templates = **ERPNext built-in as base**, stored in a custom DocType for customisation
- Field visibility is **per-tenant** via Frappe Property Setter applied on each tenant site

---

## Phase 1 — Backend: Data Model & Core APIs

### 1.1 New DocTypes in `madaar-apps/madaar_core/madaar_core/madaar_core/doctype/`

**`madaar_tenant/`** (NOT istable, NOT issingle)
Fields: tenant_id (unique slug), site_name, company_name, subdomain, status (Pending/Provisioning/Active/Suspended/Blocked), logo (Attach Image), address, city, country, phone, email, package_name (Starter/Pro/Enterprise), subscription_start (Date), subscription_end (Date), admin_email, admin_name, provisioning_log (Long Text read_only), db_name, modules (Table → Madaar Tenant Module), role_limits (Table → Madaar Tenant Role Limit)

**`madaar_tenant_module/`** (istable)
Fields: module_key, module_label, is_enabled (Check)
 
**`madaar_tenant_role_limit/`** (istable)
Fields: role, doctype_name, period (lifetime/monthly), limit (-1 = unlimited)

**`madaar_coa_template/`** (NOT istable, autoname=field:template_name)
Fields: template_name, language (Arabic/English/Custom), description, accounts (Table → Madaar COA Account)

**`madaar_coa_account/`** (istable)
Fields: account_number, account_name_en, account_name_ar, parent_account_number, account_type (Asset/Liability/Equity/Income/Expense), is_group (Check), root_type

### 1.2 New file: `madaar-apps/madaar_core/madaar_core/control_plane.py`
Whitelisted APIs (all require "Super Administrator" role check):
- `get_all_tenants(search, status, page, page_len)` — paginated list
- `get_tenant(tenant_id)` — full detail including modules, limits
- `provision_tenant(company_name, subdomain, package, admin_email, modules, coa_template)` — creates Madaar Tenant record (status=Pending), enqueues `madaar_core.jobs.provision_site`
- `update_tenant_details(tenant_id, logo, address, city, country, phone, email)` — branding/contact
- `set_tenant_status(tenant_id, status, reason)` — Active/Suspended/Blocked; enqueues `madaar_core.jobs.sync_tenant_status` to disable/enable all users on tenant site
- `assign_modules(tenant_id, modules)` — updates Madaar Tenant Module rows; applies to tenant site
- `set_field_visibility(tenant_id, doctype, visible_fieldnames)` — calls into tenant site context to create/update Property Setters for hidden=1 on excluded fields
- `set_role_limits(tenant_id, limits)` — updates Madaar Feature Limit rows on tenant site
- `extend_subscription(tenant_id, end_date, package)` — updates subscription_end + package_name
- `get_coa_templates()` — list available templates
- `apply_coa_template(tenant_id, template_name)` — imports COA accounts on tenant site
- `impersonate_tenant(tenant_id)` — returns a URL with auto-login token for tenant admin site

### 1.3 New file: `madaar-apps/madaar_core/madaar_core/jobs.py`
Background jobs:
- `provision_site(tenant_id)` — runs: `bench new-site`, `bench --site install-app` for all apps, `bootstrap_tenant(...)`, updates status→Active or logs error
- `sync_tenant_status(tenant_id, status)` — switches site context, enables/disables all non-admin users

### 1.4 Update `madaar-apps/madaar_core/madaar_core/hooks.py`
- Register "Super Administrator" role
- Add `scheduler_events` entry for subscription expiry check daily

---

## Phase 2 — Frontend: Super Admin Shell & Guard

### 2.1 Route guard: `frontend/src/lib/auth/RequireSuperAdmin.tsx`
Check `user.roles.includes('Super Administrator')`; otherwise redirect to `/403`

### 2.2 Layout: `frontend/src/components/super-admin/SuperAdminShell.tsx`
Sidebar with sections: Overview, Companies, COA Templates, Settings
Wraps children in `RequireSuperAdmin`

### 2.3 Router: update `frontend/src/app/router.tsx`
Add `/super-admin/*` routes nested under `<SuperAdminShell>`:
- `/super-admin` → `SuperAdminDashboard`
- `/super-admin/companies` → `CompaniesListPage`
- `/super-admin/companies/create` → `CreateCompanyWizard`
- `/super-admin/companies/:id` → `CompanyDetailPage`
- `/super-admin/companies/:id/modules` → `ModulesPage`
- `/super-admin/companies/:id/fields` → `FieldVisibilityPage`
- `/super-admin/companies/:id/limits` → `RoleLimitsPage`
- `/super-admin/companies/:id/subscription` → `SubscriptionPage`
- `/super-admin/companies/:id/coa` → `COAPage`
- `/super-admin/coa-templates` → `COATemplatesPage`

All pages in `frontend/src/pages/super-admin/`

### 2.4 API hooks: `frontend/src/lib/api/superAdmin.ts`
React Query hooks wrapping `useFrappeGetCall` / `useFrappePostCall` for all control_plane.py endpoints

---

## Phase 3 — Companies List & Detail

### 3.1 `frontend/src/pages/super-admin/CompaniesListPage.tsx`
- Table: Company name, Subdomain, Package, Status badge, Subscription end, Actions
- Filters: status dropdown, search
- "New Company" button → `/super-admin/companies/create`

### 3.2 `frontend/src/pages/super-admin/CompanyDetailPage.tsx`
Tabs: Profile | Modules | Field Visibility | Role Limits | Subscription | COA
Each tab is a sub-route or lazy tab panel

### 3.3 Component: `frontend/src/components/super-admin/TenantStatusBadge.tsx`
Color-coded: Active=green, Suspended=yellow, Blocked=red, Pending=gray, Provisioning=blue with spinner

---

## Phase 4 — Create Company Wizard

### 4.1 `frontend/src/pages/super-admin/CreateCompanyWizard.tsx`
Step 1 — Company Info: name, subdomain (auto-slug from name), admin email, logo, address, contacts, package
Step 2 — Modules: toggle grid of all available modules (accounting, sales, purchasing, stock, HR, manufacturing + madaar apps)
Step 3 — Chart of Accounts: radio between "Standard Arabic", "Standard English", "Custom" (with tree preview)
Step 4 — Review & Create: summary + "Create Company" button
On submit: calls `provision_tenant`, shows provisioning progress (poll status every 3s)

---

## Phase 5 — Module, Field & Limit Controls

### 5.1 Module Assignment (`ModulesPage.tsx`)
Grid of toggle cards (module icon, name, description, is_enabled switch)
Calls `assign_modules` on save

### 5.2 Field Visibility (`FieldVisibilityPage.tsx`)
Doctype selector (searchable dropdown)
On select: fetch DocType meta → show all fields as checkboxes
"Visible fields" = checked; unchecked = hidden via Property Setter
Calls `set_field_visibility`

### 5.3 Role Limits (`RoleLimitsPage.tsx`)
Table: Role | DocType | Period | Limit | Actions
Inline edit, add row, delete row
Calls `set_role_limits`

---

## Phase 6 — Subscription, COA & Account Actions

### 6.1 Subscription (`SubscriptionPage.tsx`)
Current plan badge + end date
Form: new end date (date picker), new plan (select)
"Extend" button → calls `extend_subscription`

### 6.2 COA Management (`COAPage.tsx`)
Show currently applied template
Button "Apply Template" → modal with template selector + preview tree
Button "Import Custom" → upload CSV/JSON of accounts

### 6.3 COA Templates Manager (`COATemplatesPage.tsx`)
List of templates, create/edit/delete
Table view of accounts in selected template (tree-structured display)

### 6.4 Company Status Actions (`CompanyDetailPage.tsx` header)
Dropdown: "Block Account" / "Suspend Account" / "Activate"
Confirmation modal before applying
"Login as Admin" button → calls `impersonate_tenant`, opens new tab

---

## Phase 7 — Tenant-Side: Subscription & Module Enforcement

This phase updates the **regular user dashboard** (the existing React app every tenant user sees) so it automatically respects whatever the super admin configured.

### 7.1 Backend: extend `madaar_core.api.bootstrap`
Add two new keys to the response every tenant app already calls on boot:
```
subscription: { status, end_date, days_remaining }
enabled_modules: ["accounting", "sales", "fleet", ...]   # keys from Madaar Tenant Module where is_enabled=1
```
Reads from `Madaar Settings` (which the provisioning job writes). Falls back to "all modules enabled" if no Madaar Tenant record exists (dev / fresh install).

### 7.2 Frontend: extend `AuthContext.tsx`
- Add `subscription: { status, endDate, daysRemaining } | null` and `enabledModules: string[]` to `AuthContextValue`
- Populate from `boot?.message?.subscription` and `boot?.message?.enabled_modules`
- Expose via `useAuth()`

### 7.3 Frontend: module visibility in `Sidebar.tsx`
- Import `useAuth()` → read `enabledModules`
- Filter sidebar nav groups/items: skip any group whose `moduleKey` is not in `enabledModules`
- If `enabledModules` is empty (super admin disabled all) show a "No modules assigned" placeholder

### 7.4 Frontend: module visibility in `ModuleHub.tsx`
- Same filter: only render module cards whose key is in `enabledModules`
- Already-open routes for disabled modules redirect to `/403`

### 7.5 Frontend: `SubscriptionBanner.tsx` (new component)
Shown inside the main app layout (`PageShell.tsx`), above page content:
- **0–7 days remaining** → amber warning bar: "Your subscription expires on {date}. Contact support."
- **Expired (daysRemaining ≤ 0, status Active)** → red bar, app still usable but banner persists
- **Status = Suspended** → full-page overlay: "Account suspended. Contact your administrator."
- **Status = Blocked** → full-page overlay: "Account blocked. Contact Madaar support."
- Hidden for users with role "Super Administrator" or "System Manager"

### 7.6 Frontend: `RequireModule.tsx` guard (new, optional but clean)
Wrapper used on any route that belongs to a specific module:
```tsx
<RequireModule module="fleet">
  <FleetPage />
</RequireModule>
```
Redirects to `/403` if `!enabledModules.includes(module)`. Apply to all module-specific routes in `router.tsx`.

### 7.7 Verification (tenant side)
1. Disable "Fleet" module for a tenant via super admin → log in as tenant user → Fleet sidebar item and module hub card disappear
2. Set `subscription_end` to yesterday via super admin → tenant user sees red expiry bar
3. Set status to Suspended → tenant sees full-page suspension overlay, cannot navigate
4. Re-activate → overlay gone immediately on next page load

---

## Relevant Files
- `madaar-apps/madaar_core/madaar_core/hooks.py` — add role, scheduler event
- `madaar-apps/madaar_core/madaar_core/setup.py` — reference `bootstrap_tenant` pattern
- `madaar-apps/madaar_core/madaar_core/limits.py` — reference feature limit pattern
- `frontend/src/lib/tenant/detect.ts` — `isControlPlane` already coded (admin/app subdomains)
- `frontend/src/lib/auth/AuthContext.tsx` — extend to expose isSuperAdmin
- `frontend/src/lib/auth/RequireAuth.tsx` — reference pattern for `RequireSuperAdmin`
- `frontend/src/app/router.tsx` — add super-admin routes
- `frontend/src/components/erp/Sidebar.tsx` — reference for sidebar pattern
- `frontend/src/components/erp/PageShell.tsx` — reuse shell or create SuperAdminShell
- `frontend/src/_generated/pages.manifest.ts` — NOT needed (super admin pages are hand-crafted)

---

## Verification
1. `docker exec madaar-erp-backend-1 bench --site dev.localhost migrate` — confirms new DocTypes created
2. Log in as Administrator → navigate to `/super-admin` — confirm route + guard work
3. Create a test company → watch Frappe background worker logs for provisioning job
4. Block a company → verify all users on that site are disabled
5. Assign 5 visible fields for Sales Invoice → open tenant site → confirm other fields hidden
6. `docker exec madaar-erp-frontend-1 sh -c "cd /app && npx tsc --noEmit"` — 0 errors

---

## Scope Boundaries
**Included:** All 9 features the user listed
**Excluded:** Payment/billing integration (invoicing the tenant), email notifications on provisioning, public signup page for self-service, multi-language UI for super admin panel (Arabic/English toggle already handled by existing i18n)
