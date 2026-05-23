/**
 * Active-tenant store for the super-admin "Open Company" flow.
 *
 * When a super admin clicks "Open Company" on the company detail page, we
 * stash the target tenant's identity + enabled-modules list here. The
 * sidebar reads `enabledModules` to filter which sidebar items are visible,
 * and the topbar reads `activeTenantLabel` to render the "you are viewing
 * <X>" banner with an exit button.
 *
 * `null` enabledModules = no tenant override active → show every sidebar
 * item the user has permission for (super-admin's natural view).
 *
 * Persisted to `localStorage` (`madaar-active-tenant`) so a refresh keeps
 * the view. Cleared via `clearActiveTenant()` (called by the banner's exit
 * button).
 *
 * NOTE: for production multi-user this should probably come from a
 * server-issued claim on login, not localStorage — see
 * plan-superAdminDashboard-implementation.md §Edge Cases. This is fine for
 * the demo flow.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  /** Frappe doc name of the Madaar Tenant Subscription (unique key). */
  activeTenantName: string | null;
  /** Display label — `name_ar` if present, else `tenant_company`, else the doc name. */
  activeTenantLabel: string | null;
  /** Module keys enabled on the tenant. `null` means "no override, show everything". */
  enabledModules: string[] | null;
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
        set({
          activeTenantName: name,
          activeTenantLabel: label,
          // Always store as an array so the sidebar's `.includes()` check
          // never has to deal with stray `undefined`s after a JSON round-trip.
          enabledModules: Array.isArray(modules) ? modules : [],
        }),
      clearActiveTenant: () =>
        set({
          activeTenantName: null,
          activeTenantLabel: null,
          enabledModules: null,
        }),
    }),
    { name: 'madaar-active-tenant' },
  ),
);
