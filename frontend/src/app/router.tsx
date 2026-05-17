import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppShell } from './AppShell';
import { RequireAuth } from '../lib/auth/RequireAuth';
import { routes as generatedRoutes } from '../_generated/pages.manifest';
import { ModuleHub } from '../components/erp/ModuleHub';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
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
const SuperAdminPlans = lazy(() => import('../pages/SuperAdminPlans'));
const SuperAdminPlanForm = lazy(() => import('../pages/SuperAdminPlans').then((m) => ({ default: m.SuperAdminPlanForm })));
const EmployeeCustody = lazy(() => import('../pages/EmployeeCustody'));
const LMS = lazy(() => import('../pages/LMS'));
const LMSList = lazy(() => import('../pages/LMS').then((m) => ({ default: m.LMSList })));
const LMSForm = lazy(() => import('../pages/LMS').then((m) => ({ default: m.LMSForm })));

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
      const mod = await r.importFn();
      return { Component: mod.default };
    },
  }));

const moduleHubRoutes = MODULES.map((m) => ({
  path: m.key,
  element: <ModuleHub module={m.module ?? m.key} titleKey={m.titleKey} defaultTitle={m.defaultTitle} />,
}));

export const router = createBrowserRouter([
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
      // --- Super Admin panel — hand-written, mirrors the reference's super-admin/* views ---
      {
        path: 'super-admin',
        element: (
          <Suspense fallback={Loading}>
            <SuperAdmin />
          </Suspense>
        ),
      },
      // --- Super Admin: Companies CRUD ---
      {
        path: 'super-admin/companies',
        element: (
          <Suspense fallback={Loading}>
            <SuperAdminCompanies />
          </Suspense>
        ),
      },
      {
        path: 'super-admin/companies/create',
        element: (
          <Suspense fallback={Loading}>
            <SuperAdminCompanyForm />
          </Suspense>
        ),
      },
      {
        path: 'super-admin/companies/:name/edit',
        element: (
          <Suspense fallback={Loading}>
            <SuperAdminCompanyForm />
          </Suspense>
        ),
      },
      // --- Super Admin: Plans CRUD ---
      {
        path: 'super-admin/plans',
        element: (
          <Suspense fallback={Loading}>
            <SuperAdminPlans />
          </Suspense>
        ),
      },
      {
        path: 'super-admin/plans/create',
        element: (
          <Suspense fallback={Loading}>
            <SuperAdminPlanForm />
          </Suspense>
        ),
      },
      {
        path: 'super-admin/plans/:name/edit',
        element: (
          <Suspense fallback={Loading}>
            <SuperAdminPlanForm />
          </Suspense>
        ),
      },
      // --- Super Admin: remaining stub sections (modules/users/settings/letterheads) ---
      {
        path: 'super-admin/:section',
        element: (
          <Suspense fallback={Loading}>
            <SuperAdminList />
          </Suspense>
        ),
      },
      {
        path: 'super-admin/:section/:id',
        element: (
          <Suspense fallback={Loading}>
            <SuperAdminList />
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
]);
