import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ComponentType } from 'react';
import { AppShell } from './AppShell';
import { RequireAuth } from '../lib/auth/RequireAuth';
import { routes as generatedRoutes } from '../_generated/pages.manifest';
import { ModuleHub } from '../components/erp/ModuleHub';
import { SuperAdminShell } from '../components/super-admin/SuperAdminShell';

// Collect ALL hand-written override pages at build time (Vite static analysis).
// When a module/slug pair has an override, the generated route is swapped out.
const overridePages = import.meta.glob<{ default: ComponentType }>(
  '../modules/**/overrides/page.tsx',
);

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../modules/core/dashboard/overrides/page'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Settings = lazy(() => import('../pages/Settings'));
const SettingsSection = lazy(() => import('../pages/SettingsSection'));
const Events = lazy(() => import('../pages/Events'));
const EventsList = lazy(() => import('../pages/EventsList'));
const EventsForm = lazy(() => import('../pages/EventsForm'));
const SuperAdmin = lazy(() => import('../pages/SuperAdmin'));
const SuperAdminList = lazy(() => import('../pages/SuperAdmin').then((m) => ({ default: m.SuperAdminList })));
const SuperAdminCompanies = lazy(() => import('../pages/SuperAdminCompanies'));
const SuperAdminCompanyForm = lazy(() => import('../pages/SuperAdminCompanies').then((m) => ({ default: m.SuperAdminCompanyForm })));
const SuperAdminCompanyDetail = lazy(() => import('../pages/SuperAdminCompanyDetail'));
const SuperAdminModules = lazy(() => import('../pages/SuperAdminModules'));
const SuperAdminSubscriptions = lazy(() => import('../pages/SuperAdminSubscriptions'));
const SuperAdminUsers = lazy(() => import('../pages/SuperAdminUsers'));
const SuperAdminSettings = lazy(() => import('../pages/SuperAdminSettings'));
const SuperAdminPlans = lazy(() => import('../pages/SuperAdminPlans'));
const SuperAdminPlanForm = lazy(() => import('../pages/SuperAdminPlans').then((m) => ({ default: m.SuperAdminPlanForm })));
const EmployeeCustody = lazy(() => import('../pages/EmployeeCustody'));
const CustomerDetail = lazy(() => import('../modules/customers/CustomerDetail'));
const CustomerStatement = lazy(() => import('../modules/customers/CustomerStatement'));
const SupplierDetail = lazy(() => import('../modules/suppliers/SupplierDetail'));
const SupplierStatement = lazy(() => import('../modules/suppliers/SupplierStatement'));
const JournalEntryDetail = lazy(() => import('../modules/accounting/JournalEntryDetail'));
const SalesDocumentDetail = lazy(() => import('../modules/sales/SalesDocumentDetail'));
const PurchaseDocumentDetail = lazy(() => import('../modules/purchases/PurchaseDocumentDetail'));
const POSPage = lazy(() => import('../pages/POSPage'));
const LMS = lazy(() => import('../pages/LMS'));
const LMSList = lazy(() => import('../pages/LMS').then((m) => ({ default: m.LMSList })));
const LMSForm = lazy(() => import('../pages/LMS').then((m) => ({ default: m.LMSForm })));

// --- Fleet forms ---
const VehicleForm = lazy(() => import('../modules/fleet/vehicles/VehicleForm'));
const DriverForm = lazy(() => import('../modules/fleet/drivers/DriverForm'));
const RouteForm = lazy(() => import('../modules/fleet/routes/RouteForm'));
const TripForm = lazy(() => import('../modules/fleet/trips/TripForm'));
const FuelLogForm = lazy(() => import('../modules/fleet/fuel/FuelLogForm'));
const MaintenanceForm = lazy(() => import('../modules/fleet/maintenance--requests/MaintenanceForm'));
const AccidentForm = lazy(() => import('../modules/fleet/accidents/AccidentForm'));
const ViolationForm = lazy(() => import('../modules/fleet/violations/ViolationForm'));

// --- Construction forms ---
const ConstructionProjectForm = lazy(() => import('../modules/construction/projects/ConstructionProjectForm'));
const ConstructionEquipmentForm = lazy(() => import('../modules/construction/equipment/ConstructionEquipmentForm'));
const ConstructionContractForm = lazy(() => import('../modules/construction/contracts/ConstructionContractForm'));

// --- Supplier Groups ---
const SupplierGroupList = lazy(() => import('../modules/supplier-groups/SupplierGroups'));
const SupplierGroupForm = lazy(() => import('../modules/supplier-groups/SupplierGroups').then((m) => ({ default: m.SupplierGroupForm })));

// --- Customer Groups ---
const CustomerGroupList = lazy(() => import('../modules/customer-groups/CustomerGroups').then((m) => ({ default: m.CustomerGroupList })));
const CustomerGroupForm = lazy(() => import('../modules/customer-groups/CustomerGroups').then((m) => ({ default: m.CustomerGroupForm })));

// --- Item Groups (product-categories / product-groups) ---
const ItemGroupListCategories = lazy(() => import('../modules/inventory/ItemGroups').then((m) => ({ default: () => m.ItemGroupList({ title: 'تصنيفات المنتجات', subtitle: 'إدارة تصنيفات المنتجات والأصناف', basePath: '/inventory/product-categories' }) })));
const ItemGroupListGroups = lazy(() => import('../modules/inventory/ItemGroups').then((m) => ({ default: () => m.ItemGroupList({ title: 'مجموعات المنتجات', subtitle: 'إدارة مجموعات المنتجات والأصناف', basePath: '/inventory/product-groups' }) })));
const ItemGroupFormCategories = lazy(() => import('../modules/inventory/ItemGroups').then((m) => ({ default: () => m.ItemGroupForm({ mode: 'create', basePath: '/inventory/product-categories' }) })));
const ItemGroupFormCategoriesEdit = lazy(() => import('../modules/inventory/ItemGroups').then((m) => ({ default: () => m.ItemGroupForm({ mode: 'edit', basePath: '/inventory/product-categories' }) })));
const ItemGroupFormGroups = lazy(() => import('../modules/inventory/ItemGroups').then((m) => ({ default: () => m.ItemGroupForm({ mode: 'create', basePath: '/inventory/product-groups' }) })));
const ItemGroupFormGroupsEdit = lazy(() => import('../modules/inventory/ItemGroups').then((m) => ({ default: () => m.ItemGroupForm({ mode: 'edit', basePath: '/inventory/product-groups' }) })));

// --- Sales Price Lists ---
const PriceListPage = lazy(() => import('../modules/sales/PriceLists'));
const PriceListForm = lazy(() => import('../modules/sales/PriceLists').then((m) => ({ default: m.PriceListForm })));

const Loading = (
  <div className="grid min-h-[40vh] place-items-center text-(--color-muted)">…</div>
);

/**
 * Call this on link hover to fetch the route's JS chunk before the user
 * clicks — the browser caches it so the actual navigation is instant.
 */
export function prefetchRoute(path: string): void {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  const route = generatedRoutes.find((r) => r.path === normalised);
  if (route) void route.importFn();
}

// Routes shown in the sidebar that don't have a corresponding generated landing page —
// each gets a ModuleHub that lists its sub-pages.
// `module` overrides the filter applied inside ModuleHub when the URL key differs from
// the module name used in pages.manifest.ts (e.g. route key "assets" but module "fixed-assets").
const MODULES: Array<{ key: string; titleKey: string; defaultTitle: string; module?: string }> = [
  { key: 'accounting', titleKey: 'nav.accounting', defaultTitle: 'الحسابات' },
  { key: 'sales', titleKey: 'nav.sales', defaultTitle: 'المبيعات' },
  { key: 'purchases', titleKey: 'nav.purchases', defaultTitle: 'المشتريات' },
  { key: 'inventory', titleKey: 'nav.inventory', defaultTitle: 'المخزون' },
  { key: 'crm', titleKey: 'nav.crm', defaultTitle: 'إدارة العملاء' },
  { key: 'hr', titleKey: 'nav.hr', defaultTitle: 'الموارد البشرية' },
  { key: 'fleet', titleKey: 'nav.fleet', defaultTitle: 'الأسطول' },
  { key: 'workshop', titleKey: 'nav.workshop', defaultTitle: 'الورشة' },
  { key: 'restaurant', titleKey: 'nav.restaurant', defaultTitle: 'المطعم' },
  { key: 'construction', titleKey: 'nav.construction', defaultTitle: 'المقاولات' },
  { key: 'ecommerce', titleKey: 'nav.ecommerce', defaultTitle: 'المتجر الإلكتروني' },
  { key: 'logistics', titleKey: 'nav.logistics', defaultTitle: 'الخدمات اللوجستية' },
  { key: 'manufacturing', titleKey: 'nav.manufacturing', defaultTitle: 'التصنيع' },
  { key: 'treasury', titleKey: 'nav.treasury', defaultTitle: 'الخزينة' },
  { key: 'tax', titleKey: 'nav.tax', defaultTitle: 'الضرائب' },
  // "assets" sidebar link → pages live under module "fixed-assets" in the manifest
  { key: 'assets', titleKey: 'nav.assets', defaultTitle: 'الأصول الثابتة', module: 'fixed-assets' },
  // "support" sidebar link → pages live under module "support-tickets" in the manifest
  { key: 'support', titleKey: 'nav.support', defaultTitle: 'الدعم الفني', module: 'support-tickets' },
  // NOTE: "settings" is intentionally omitted — the generated /settings page (module "core")
  // is served directly without a hub wrapper.
];

// Strip the leading "/" so paths are relative to the layout route at path "/".
const generated = generatedRoutes
  .filter((r) => r.path !== '/dashboard')
  // Don't shadow our hand-written module hubs.
  .filter((r) => !MODULES.some((m) => r.path === `/${m.key}`))
  // Don't shadow the hand-written /settings hub (the generated one is just a module hub).
  .filter((r) => r.path !== '/settings')
  .map((r) => ({
    path: r.path.replace(/^\//, ''),
    lazy: async () => {
      // Use the hand-written override when one exists for this module/slug.
      const overrideKey = `../modules/${r.module}/${r.slug}/overrides/page.tsx`;
      if (overridePages[overrideKey]) {
        const mod = await overridePages[overrideKey]();
        return { Component: mod.default };
      }
      const mod = await r.importFn();
      return { Component: mod.default };
    },
  }));

const moduleHubRoutes = MODULES.map((m) => ({
  path: m.key,
  element: <ModuleHub module={m.module ?? m.key} titleKey={m.titleKey} defaultTitle={m.defaultTitle} />,
}));

export const router = createBrowserRouter(
  [
  {
    path: '/login',
    element: (
      <Suspense fallback={Loading}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={Loading}>
            <Dashboard />
          </Suspense>
        ),
      },
      ...moduleHubRoutes,
      {
        path: 'settings',
        element: (
          <Suspense fallback={Loading}>
            <Settings />
          </Suspense>
        ),
      },
      {
        path: 'settings/:section',
        element: (
          <Suspense fallback={Loading}>
            <SettingsSection />
          </Suspense>
        ),
      },
      // --- Retail POS — full-screen cashier UI (shift, barcode, payment) ---
      {
        path: 'retail/pos',
        element: (
          <Suspense fallback={Loading}>
            <POSPage mode="retail" />
          </Suspense>
        ),
      },
      // --- Restaurant POS — dine-in + walk-in + delivery + table picker ---
      {
        path: 'restaurant/cashier',
        element: (
          <Suspense fallback={Loading}>
            <POSPage mode="restaurant" />
          </Suspense>
        ),
      },
      // --- LMS — Madaar Learning Management System (Course/Lesson/Batch/Enrollment) ---
      {
        path: 'lms',
        element: (
          <Suspense fallback={Loading}>
            <LMS />
          </Suspense>
        ),
      },
      {
        path: 'lms/:section',
        element: (
          <Suspense fallback={Loading}>
            <LMSList />
          </Suspense>
        ),
      },
      {
        path: 'lms/:section/create',
        element: (
          <Suspense fallback={Loading}>
            <LMSForm />
          </Suspense>
        ),
      },
      {
        path: 'lms/:section/:name/edit',
        element: (
          <Suspense fallback={Loading}>
            <LMSForm />
          </Suspense>
        ),
      },
      // --- Customers: detail + account statement (not in the URL scan, hand-wired here) ---
      {
        path: 'customers/:id',
        element: (
          <Suspense fallback={Loading}>
            <CustomerDetail />
          </Suspense>
        ),
      },
      {
        path: 'customers/:id/statement',
        element: (
          <Suspense fallback={Loading}>
            <CustomerStatement />
          </Suspense>
        ),
      },
      {
        path: 'customers/reports/aging',
        lazy: async () => {
          const mod = await import('../modules/customers/reports--aging/overrides/page');
          return { Component: mod.default };
        },
      },
      {
        path: 'customers/reports/statement',
        lazy: async () => {
          const mod = await import('../modules/customers/reports/CustomersStatementTab');
          return { Component: mod.default };
        },
      },
      {
        path: 'customers/reports/totals',
        lazy: async () => {
          const mod = await import('../modules/reports/CustomerTotalsReport');
          return { Component: mod.default };
        },
      },
      // --- Suppliers: detail + account statement (mirrors customer routes) ---
      {
        path: 'suppliers/:id',
        element: (
          <Suspense fallback={Loading}>
            <SupplierDetail />
          </Suspense>
        ),
      },
      {
        path: 'suppliers/:id/statement',
        element: (
          <Suspense fallback={Loading}>
            <SupplierStatement />
          </Suspense>
        ),
      },
      {
        path: 'suppliers/reports/statement',
        lazy: async () => {
          const mod = await import('../modules/suppliers/reports/SuppliersStatementTab');
          return { Component: mod.default };
        },
      },
      {
        path: 'accounting/reports/mixed-parties-statement',
        lazy: async () => {
          const mod = await import('../modules/accounting/reports/MixedPartiesStatement');
          return { Component: mod.default };
        },
      },
      {
        path: 'sales/reports/by-sales-rep',
        lazy: async () => {
          const mod = await import('../modules/sales/reports/SalesRepReport');
          return { Component: mod.default };
        },
      },
      {
        path: 'sales/commission-policies',
        lazy: async () => {
          const mod = await import('../modules/sales/reports/CommissionPolicyForm');
          return { Component: mod.default };
        },
      },
      {
        path: 'sales/reports/commissions',
        lazy: async () => {
          const mod = await import('../modules/sales/reports/SalesCommissionsReport');
          return { Component: mod.default };
        },
      },
      // --- Accounting: Journal Entry detail (show page) ---
      {
        path: 'accounting/journal-entries/:id',
        element: (
          <Suspense fallback={Loading}>
            <JournalEntryDetail />
          </Suspense>
        ),
      },
      // NOTE: accounting/cost-centers, chart-of-accounts, fiscal-years are now
      // auto-resolved via import.meta.glob in the `generated` array below.
      // Treasury sub-pages below are NOT in the manifest, so must be wired explicitly.
      {
        path: 'treasury/bank-institutions',
        lazy: async () => {
          const mod = await import('../modules/treasury/bank-institutions/overrides/page');
          return { Component: mod.default };
        },
      },
      {
        path: 'treasury/currencies',
        lazy: async () => {
          const mod = await import('../modules/treasury/currencies/overrides/page');
          return { Component: mod.default };
        },
      },
      {
        path: 'treasury/currencies/create',
        lazy: async () => {
          const mod = await import('../modules/treasury/currencies--create/overrides/page');
          return { Component: mod.default };
        },
      },
      {
        path: 'treasury/currencies/:id/edit',
        lazy: async () => {
          const mod = await import('../modules/treasury/currencies--$id--edit/overrides/page');
          return { Component: mod.default };
        },
      },
      {
        path: 'treasury/exchange-rates',
        lazy: async () => {
          const mod = await import('../modules/treasury/exchange-rates/overrides/page');
          return { Component: mod.default };
        },
      },
      {
        path: 'treasury/exchange-rates/create',
        lazy: async () => {
          const mod = await import('../modules/treasury/exchange-rates--create/overrides/page');
          return { Component: mod.default };
        },
      },
      {
        path: 'treasury/exchange-rates/:id/edit',
        lazy: async () => {
          const mod = await import('../modules/treasury/exchange-rates--$id--edit/overrides/page');
          return { Component: mod.default };
        },
      },
      {
        path: 'treasury/banks/create',
        lazy: async () => {
          const mod = await import('../modules/treasury/banks--create/overrides/page');
          return { Component: mod.default };
        },
      },
      {
        path: 'financial/receipt-vouchers/bulk-create',
        lazy: async () => {
          const mod = await import('../modules/financial/receipt-vouchers--bulk-create/overrides/page');
          return { Component: mod.default };
        },
      },
      // --- Accounting: Fiscal Year detail (periods, close/open) ---
      {
        path: 'accounting/fiscal-years/:id',
        lazy: async () => {
          const mod = await import('../modules/accounting/FiscalYearDetail');
          return { Component: mod.default };
        },
      },
      // --- Sales: detail pages for invoice/order/quotation/return ---
      {
        path: 'sales/invoices/:id',
        element: (<Suspense fallback={Loading}><SalesDocumentDetail variant="invoice" /></Suspense>),
      },
      {
        path: 'sales/orders/:id',
        element: (<Suspense fallback={Loading}><SalesDocumentDetail variant="order" /></Suspense>),
      },
      {
        path: 'sales/quotations/:id',
        element: (<Suspense fallback={Loading}><SalesDocumentDetail variant="quotation" /></Suspense>),
      },
      {
        path: 'sales/returns/:id',
        element: (<Suspense fallback={Loading}><SalesDocumentDetail variant="return" /></Suspense>),
      },
      // --- Purchases: detail pages for invoice/order/return ---
      {
        path: 'purchases/invoices/:id',
        element: (<Suspense fallback={Loading}><PurchaseDocumentDetail variant="invoice" /></Suspense>),
      },
      {
        path: 'purchases/orders/:id',
        element: (<Suspense fallback={Loading}><PurchaseDocumentDetail variant="order" /></Suspense>),
      },
      {
        path: 'purchases/returns/:id',
        element: (<Suspense fallback={Loading}><PurchaseDocumentDetail variant="return" /></Suspense>),
      },
      // --- Employee Custody (HR) — wraps ERPNext Employee Advance / Expense Claim ---
      {
        path: 'hr/employee-custody',
        element: (
          <Suspense fallback={Loading}>
            <EmployeeCustody />
          </Suspense>
        ),
      },
      {
        path: 'hr/employee-custody/:section',
        element: (
          <Suspense fallback={Loading}>
            <EmployeeCustody />
          </Suspense>
        ),
      },
      // --- Fleet: Vehicles CRUD ---
      {
        path: 'fleet/vehicles/create',
        element: (<Suspense fallback={Loading}><VehicleForm mode="create" /></Suspense>),
      },
      {
        path: 'fleet/vehicles/:id/edit',
        element: (<Suspense fallback={Loading}><VehicleForm mode="edit" /></Suspense>),
      },
      // --- Fleet: Drivers CRUD ---
      {
        path: 'fleet/drivers/create',
        element: (<Suspense fallback={Loading}><DriverForm mode="create" /></Suspense>),
      },
      {
        path: 'fleet/drivers/:id/edit',
        element: (<Suspense fallback={Loading}><DriverForm mode="edit" /></Suspense>),
      },
      // --- Fleet: Routes CRUD ---
      {
        path: 'fleet/routes/create',
        element: (<Suspense fallback={Loading}><RouteForm mode="create" /></Suspense>),
      },
      {
        path: 'fleet/routes/:id/edit',
        element: (<Suspense fallback={Loading}><RouteForm mode="edit" /></Suspense>),
      },
      // --- Fleet: Trips CRUD ---
      {
        path: 'fleet/trips/create',
        element: (<Suspense fallback={Loading}><TripForm mode="create" /></Suspense>),
      },
      {
        path: 'fleet/trips/:id/edit',
        element: (<Suspense fallback={Loading}><TripForm mode="edit" /></Suspense>),
      },
      // --- Fleet: Fuel Logs CRUD ---
      {
        path: 'fleet/fuel/create',
        element: (<Suspense fallback={Loading}><FuelLogForm mode="create" /></Suspense>),
      },
      {
        path: 'fleet/fuel/:id/edit',
        element: (<Suspense fallback={Loading}><FuelLogForm mode="edit" /></Suspense>),
      },
      // --- Fleet: Maintenance Requests CRUD ---
      {
        path: 'fleet/maintenance/requests/create',
        element: (<Suspense fallback={Loading}><MaintenanceForm mode="create" /></Suspense>),
      },
      {
        path: 'fleet/maintenance/requests/:id/edit',
        element: (<Suspense fallback={Loading}><MaintenanceForm mode="edit" /></Suspense>),
      },
      // --- Fleet: Accidents CRUD ---
      {
        path: 'fleet/accidents/create',
        element: (<Suspense fallback={Loading}><AccidentForm mode="create" /></Suspense>),
      },
      {
        path: 'fleet/accidents/:id/edit',
        element: (<Suspense fallback={Loading}><AccidentForm mode="edit" /></Suspense>),
      },
      // --- Fleet: Violations CRUD ---
      {
        path: 'fleet/violations/create',
        element: (<Suspense fallback={Loading}><ViolationForm mode="create" /></Suspense>),
      },
      {
        path: 'fleet/violations/:id/edit',
        element: (<Suspense fallback={Loading}><ViolationForm mode="edit" /></Suspense>),
      },
      // --- Construction: Projects CRUD ---
      {
        path: 'construction/projects/create',
        element: (<Suspense fallback={Loading}><ConstructionProjectForm mode="create" /></Suspense>),
      },
      {
        path: 'construction/projects/:id/edit',
        element: (<Suspense fallback={Loading}><ConstructionProjectForm mode="edit" /></Suspense>),
      },
      // --- Construction: Equipment CRUD ---
      {
        path: 'construction/equipment/create',
        element: (<Suspense fallback={Loading}><ConstructionEquipmentForm mode="create" /></Suspense>),
      },
      {
        path: 'construction/equipment/:id/edit',
        element: (<Suspense fallback={Loading}><ConstructionEquipmentForm mode="edit" /></Suspense>),
      },
      // --- Construction: Contracts CRUD ---
      {
        path: 'construction/contracts/create',
        element: (<Suspense fallback={Loading}><ConstructionContractForm mode="create" /></Suspense>),
      },
      {
        path: 'construction/contracts/:id/edit',
        element: (<Suspense fallback={Loading}><ConstructionContractForm mode="edit" /></Suspense>),
      },
      // --- Supplier Groups CRUD ---
      {
        path: 'supplier-groups',
        element: (<Suspense fallback={Loading}><SupplierGroupList /></Suspense>),
      },
      {
        path: 'supplier-groups/create',
        element: (<Suspense fallback={Loading}><SupplierGroupForm mode="create" /></Suspense>),
      },
      {
        path: 'supplier-groups/:id/edit',
        element: (<Suspense fallback={Loading}><SupplierGroupForm mode="edit" /></Suspense>),
      },
      // --- Customer Groups CRUD ---
      {
        path: 'customer-groups',
        element: (<Suspense fallback={Loading}><CustomerGroupList /></Suspense>),
      },
      {
        path: 'customer-groups/create',
        element: (<Suspense fallback={Loading}><CustomerGroupForm mode="create" /></Suspense>),
      },
      {
        path: 'customer-groups/:id/edit',
        element: (<Suspense fallback={Loading}><CustomerGroupForm mode="edit" /></Suspense>),
      },
      // --- Inventory: Product Categories (Item Group) ---
      {
        path: 'inventory/product-categories',
        element: (<Suspense fallback={Loading}><ItemGroupListCategories /></Suspense>),
      },
      {
        path: 'inventory/product-categories/create',
        element: (<Suspense fallback={Loading}><ItemGroupFormCategories /></Suspense>),
      },
      {
        path: 'inventory/product-categories/:id/edit',
        element: (<Suspense fallback={Loading}><ItemGroupFormCategoriesEdit /></Suspense>),
      },
      // --- Inventory: Product Groups (Item Group) ---
      {
        path: 'inventory/product-groups',
        element: (<Suspense fallback={Loading}><ItemGroupListGroups /></Suspense>),
      },
      {
        path: 'inventory/product-groups/create',
        element: (<Suspense fallback={Loading}><ItemGroupFormGroups /></Suspense>),
      },
      {
        path: 'inventory/product-groups/:id/edit',
        element: (<Suspense fallback={Loading}><ItemGroupFormGroupsEdit /></Suspense>),
      },
      // --- Sales Price Lists CRUD ---
      {
        path: 'sales/price-lists',
        element: (<Suspense fallback={Loading}><PriceListPage /></Suspense>),
      },
      {
        path: 'sales/price-lists/create',
        element: (<Suspense fallback={Loading}><PriceListForm mode="create" /></Suspense>),
      },
      {
        path: 'sales/price-lists/:id/edit',
        element: (<Suspense fallback={Loading}><PriceListForm mode="edit" /></Suspense>),
      },
      // --- Events (Culture Wheel) — hand-written, not auto-generated from a scan ---
      {
        path: 'events',
        element: (
          <Suspense fallback={Loading}>
            <Events />
          </Suspense>
        ),
      },
      {
        path: 'events/:section',
        element: (
          <Suspense fallback={Loading}>
            <EventsList />
          </Suspense>
        ),
      },
      {
        path: 'events/:section/create',
        element: (
          <Suspense fallback={Loading}>
            <EventsForm />
          </Suspense>
        ),
      },
      {
        path: 'events/:section/:id/edit',
        element: (
          <Suspense fallback={Loading}>
            <EventsForm />
          </Suspense>
        ),
      },
      ...generated,
      {
        path: '*',
        element: (
          <Suspense fallback={Loading}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },

  // ── Super Admin — completely separate layout, no sidebar ─────────────────
  {
    path: '/super-admin',
    element: (
      <RequireAuth>
        <SuperAdminShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: (<Suspense fallback={Loading}><SuperAdmin /></Suspense>),
      },
      {
        path: 'companies',
        element: (<Suspense fallback={Loading}><SuperAdminCompanies /></Suspense>),
      },
      {
        path: 'companies/create',
        element: (<Suspense fallback={Loading}><SuperAdminCompanyForm /></Suspense>),
      },
      {
        path: 'companies/:name/edit',
        element: (<Suspense fallback={Loading}><SuperAdminCompanyForm /></Suspense>),
      },
      {
        path: 'companies/:name',
        element: (<Suspense fallback={Loading}><SuperAdminCompanyDetail /></Suspense>),
      },
      {
        path: 'plans',
        element: (<Suspense fallback={Loading}><SuperAdminPlans /></Suspense>),
      },
      {
        path: 'plans/create',
        element: (<Suspense fallback={Loading}><SuperAdminPlanForm /></Suspense>),
      },
      {
        path: 'plans/:name/edit',
        element: (<Suspense fallback={Loading}><SuperAdminPlanForm /></Suspense>),
      },
      {
        path: 'modules',
        element: (<Suspense fallback={Loading}><SuperAdminModules /></Suspense>),
      },
      {
        path: 'subscriptions',
        element: (<Suspense fallback={Loading}><SuperAdminSubscriptions /></Suspense>),
      },
      {
        path: 'users',
        element: (<Suspense fallback={Loading}><SuperAdminUsers /></Suspense>),
      },
      {
        path: 'settings',
        element: (<Suspense fallback={Loading}><SuperAdminSettings /></Suspense>),
      },
      // Catch-all stub for remaining sections (letterheads, etc.)
      {
        path: ':section',
        element: (<Suspense fallback={Loading}><SuperAdminList /></Suspense>),
      },
      {
        path: ':section/:id',
        element: (<Suspense fallback={Loading}><SuperAdminList /></Suspense>),
      },
    ],
  },
  ],
  {
    // Opt into the React Router v7 behaviours now so we (a) silence the v7
    // deprecation warnings (~50 per session) and (b) get free behaviour
    // when we bump react-router-dom. `v7_startTransition` lives on
    // <RouterProvider/>'s `future` prop (see App.tsx), not here.
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
