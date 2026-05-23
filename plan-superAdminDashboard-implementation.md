# Super Admin → Tenant Demo — Complete Implementation Plan

> **Purpose**: Step-by-step guide to complete the demo where a super admin creates a company,
> selects modules, clicks "Open Company", and sees ONLY those modules in the sidebar.
> All required backend already exists. This is purely a frontend task (3 files to create/edit).

---

## What Already Exists (DO NOT recreate)

| File | Status |
|---|---|
| `frontend/src/pages/SuperAdminCompanies.tsx` | ✅ Complete — list + create/edit form |
| `frontend/src/pages/SuperAdminCompanyDetail.tsx` | ✅ Complete — tabs: overview / modules / accounting / users |
| `frontend/src/components/super-admin/SuperAdminShell.tsx` | ✅ Complete — sidebar shell for /super-admin/* |
| `frontend/src/app/router.tsx` | ✅ All /super-admin/* routes wired |
| `madaar-apps/madaar_core/madaar_core/api.py` | ✅ `list_tenant_subscriptions` exists |
| Frappe DocType `Madaar Tenant Subscription` | ✅ Has `enabled_modules` (JSON string) field |

---

## Demo Flow (what we're building)

```
1. /super-admin/companies → click "شركة جديدة"
2. Fill form → select modules (e.g. Sales, Purchases, Accounting) → Save
3. Row appears in companies list → click "عرض"
4. In company detail → Modules tab → modules already selected
5. Click "▶ فتح الشركة"  ← NEW BUTTON
6. Redirected to /dashboard
7. Sidebar shows ONLY the selected modules  ← KEY FEATURE
8. Banner in header shows "تعرض بيانات الشركة: [name]" + "إغلاق" button ← NEW
9. Click "إغلاق" → back to /super-admin/companies, all modules restored
```

---

## Step 1 — Create Zustand Store

**File to create:** `frontend/src/lib/store/tenantStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  activeTenantName: string | null;   // Frappe doc name (unique key)
  activeTenantLabel: string | null;  // Display name (name_ar or tenant_company)
  enabledModules: string[] | null;   // null = show ALL modules (super admin mode)
  setActiveTenant: (name: string, label: string, modules: string[]) => void;
  clearActiveTenant: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenantName: null,
      activeTenantLabel: null,
      enabledModules: null,
      setActiveTenant: (name, label, modules) =>
        set({ activeTenantName: name, activeTenantLabel: label, enabledModules: modules }),
      clearActiveTenant: () =>
        set({ activeTenantName: null, activeTenantLabel: null, enabledModules: null }),
    }),
    { name: 'madaar-active-tenant' }   // persisted in localStorage
  )
);
```

> **Why `persist`?** So if the user refreshes the page, the company view is remembered.

---

## Step 2 — Add `moduleKey` to Sidebar Items + Filter Logic

**File to edit:** `frontend/src/components/erp/Sidebar.tsx`

### 2a — Add `moduleKey` to the `Item` interface

Find the `interface Item {` block and add `moduleKey?: string`:

```typescript
interface Item {
  to: string;
  labelAr: string;
  icon: LucideIcon;
  accent: AccentColor;
  moduleKey?: string;          // ← ADD THIS LINE
  groups?: Group[];
}
```

### 2b — Add `moduleKey` to every item in `SECTIONS`

The mapping is:

| `to` path | `moduleKey` |
|---|---|
| `/accounting` | `'accounting'` |
| `/treasury` | `'treasury'` |
| `/financial/credit-notes` | `'accounting'` |
| `/customers` | `'sales'` |
| `/suppliers` | `'purchases'` |
| `/fixed-assets/dashboard` | `'assets'` |
| `/sales` | `'sales'` |
| `/purchases` | `'purchases'` |
| `/inventory` | `'inventory'` |
| `/sales-reps` | `'sales'` |
| `/hr` | `'hr'` |
| `/crm` | `'crm'` |
| `/mfg` | `'manufacturing'` |
| `/construction` | `'construction'` |
| `/fleet` | `'fleet'` |
| `/tax` | `'tax'` |
| `/logistics` | `'logistics'` |
| `/ecommerce` | `'ecommerce'` |
| `/lms` | `'lms'` |
| `/events` | `'events'` |
| `/support` | `'support'` |
| `/restaurant` | `'restaurant'` |
| `/workshop` | `'workshop'` |
| `/dashboard` | *(no key — always shown)* |
| `/settings` | *(no key — always shown)* |

Example diff for the accounting item:
```diff
-      { to: '/accounting', labelAr: 'الحسابات العامة', icon: BookOpen, accent: 'emerald', groups: [...] },
+      { to: '/accounting', labelAr: 'الحسابات العامة', icon: BookOpen, accent: 'emerald', moduleKey: 'accounting', groups: [...] },
```

Repeat for every module item in the `SECTIONS` array.

### 2c — Import store + filter in the render function

At the top of Sidebar.tsx, add the import:
```typescript
import { useTenantStore } from '../../lib/store/tenantStore';
```

Find the `Sidebar` component function. Near the top of the function body, add:
```typescript
const enabledModules = useTenantStore((s) => s.enabledModules);

function isModuleVisible(item: Item): boolean {
  if (!item.moduleKey) return true;          // dashboard, settings — always show
  if (enabledModules === null) return true;  // super admin mode — show all
  return enabledModules.includes(item.moduleKey);
}
```

Then find where `SECTIONS` is mapped to render sidebar sections. It will look like:
```typescript
{SECTIONS.map((section) => (
  <div key={section.headerAr}>
    ...
    {section.items.map((item) => (
      <SidebarItem item={item} ... />
    ))}
  </div>
))}
```

Change it to filter:
```typescript
{SECTIONS.map((section) => {
  const visibleItems = section.items.filter(isModuleVisible);
  if (visibleItems.length === 0) return null;  // hide entire section if all items hidden
  return (
    <div key={section.headerAr}>
      ...
      {visibleItems.map((item) => (
        <SidebarItem item={item} ... />
      ))}
    </div>
  );
})}
```

---

## Step 3 — Add "Open Company" Button in CompanyDetail

**File to edit:** `frontend/src/pages/SuperAdminCompanyDetail.tsx`

### 3a — Import store and useNavigate

At top of file, add:
```typescript
import { useNavigate } from 'react-router-dom';
import { useTenantStore } from '../lib/store/tenantStore';
```

### 3b — Add handler inside the `SuperAdminCompanyDetail` component

After all the existing hooks, add:
```typescript
const navigate = useNavigate();
const setActiveTenant = useTenantStore((s) => s.setActiveTenant);

function openCompany() {
  const label = (tenant as any)?.name_ar || (tenant as any)?.tenant_company || name || '';
  setActiveTenant(name ?? '', label, enabledModules);
  navigate('/dashboard');
}
```

### 3c — Add the button to the `actions` prop in PageShell

Find the `actions` prop in the PageShell. It currently has Edit + Back buttons.
Add the Open button:

```tsx
actions={
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={openCompany}
      disabled={enabledModules.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
    >
      ▶ فتح الشركة
    </button>
    <Link
      to={`/super-admin/companies/${encodeURIComponent(name ?? '')}/edit`}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 transition"
    >
      {isAr ? 'تعديل' : 'Edit'}
    </Link>
    <FormBackButton to="/super-admin/companies">
      <ChevronLeft size={14} />
      {isAr ? 'رجوع' : 'Back'}
    </FormBackButton>
  </div>
}
```

---

## Step 4 — Add Company View Banner in Topbar

**File to edit:** `frontend/src/components/erp/Topbar.tsx`
*(If the banner is better in AppShell.tsx, look for where the main layout renders and add it there.)*

### 4a — Import store

```typescript
import { useTenantStore } from '../../lib/store/tenantStore';
import { useNavigate } from 'react-router-dom';
```

### 4b — Add banner inside the Topbar component

```typescript
const { activeTenantLabel, enabledModules, clearActiveTenant } = useTenantStore();
const navigate = useNavigate();

function exitCompanyView() {
  clearActiveTenant();
  navigate('/super-admin/companies');
}
```

Then in the JSX, add a banner ABOVE the main topbar row (or below it):
```tsx
{activeTenantLabel && (
  <div className="flex items-center justify-between px-4 py-1.5 bg-amber-500 text-white text-xs font-semibold">
    <span>
      👁 تعرض بيانات الشركة: <strong>{activeTenantLabel}</strong>
      {enabledModules && (
        <span className="ms-2 opacity-80">
          ({enabledModules.length} موديول)
        </span>
      )}
    </span>
    <button
      onClick={exitCompanyView}
      className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 transition text-xs font-bold"
    >
      ✕ إغلاق
    </button>
  </div>
)}
```

---

## Step 5 — Deploy

```bash
git add frontend/src/lib/store/tenantStore.ts \
        frontend/src/components/erp/Sidebar.tsx \
        frontend/src/pages/SuperAdminCompanyDetail.tsx \
        frontend/src/components/erp/Topbar.tsx

git commit -m "feat: super admin open company - module visibility filter in sidebar"

git push origin main

# On server (bind mount — no rebuild needed):
ssh root@165.232.75.30 "cd /opt/madaar-erp && git pull --no-rebase origin main"
```

---

## Step 6 — Verify Demo Works

1. Navigate to `http://165.232.75.30/super-admin/companies`
2. Create a new company → select modules: **Accounting + Sales + Purchases** only → Save
3. Click "عرض" on the new row
4. In Modules tab → verify the 3 modules are checked
5. Click **"▶ فتح الشركة"**
6. Redirected to `/dashboard`
7. Sidebar should show ONLY:
   - لوحة التحكم (dashboard — always shown)
   - الحسابات العامة
   - الخزائن والسندات (treasury, part of accounting)
   - المبيعات
   - المشتريات
   - إعدادات الشركة (settings — always shown)
8. All other modules (HR, CRM, Fleet, etc.) should be **hidden**
9. Yellow banner at top shows "👁 تعرض بيانات الشركة: [name] (3 موديول)"
10. Click **"✕ إغلاق"** → back to `/super-admin/companies`, all modules restored

---

## Edge Cases / Notes

| Issue | Solution |
|---|---|
| Core modules (accounting, sales, purchases, inventory, treasury) should always be pre-selected when creating new company | Already handled in `SuperAdminCompanyForm` — `enabledModules` defaults to `ALL_MODULES.filter(m => m.isCore)` |
| Zustand `persist` uses `localStorage` — safe for demo, not for production multi-user | For production: replace with API call to get modules per logged-in user's company |
| After `clearActiveTenant()`, enabledModules = null → sidebar shows ALL modules | Correct — this is the super admin view |
| `treasury` items appear under module key `'treasury'` but treasury was previously grouped under accounting in `ALL_MODULES` | Check `ALL_MODULES` in `SuperAdminModules.tsx` — `treasury` is its own `isCore: true` entry with key `'treasury'` |
| The `workshop` module in sidebar — find its `to` path | Search Sidebar.tsx for `/workshop` to find the right item and add `moduleKey: 'workshop'` |

---

## Quick Reference: ALL_MODULES keys (from SuperAdminModules.tsx)

```
'accounting', 'sales', 'purchases', 'inventory', 'treasury',  ← isCore: true
'crm', 'hr', 'construction', 'fleet', 'logistics',            ← isCore: false
'ecommerce', 'restaurant', 'workshop', 'manufacturing',        ← isCore: false
'tax', 'support', 'assets', 'events', 'lms'                   ← isCore: false
```

These are the exact string values stored in `enabled_modules` JSON and what the
sidebar `moduleKey` values must match.
