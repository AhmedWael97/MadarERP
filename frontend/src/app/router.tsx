import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppShell } from './AppShell';
import { RequireAuth } from '../lib/auth/RequireAuth';
import { routes as generatedRoutes } from '../_generated/pages.manifest';
import { ModuleHub } from '../components/erp/ModuleHub';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const NotFound = lazy(() => import('../pages/NotFound'));

const Loading = (
  <div className="grid min-h-[40vh] place-items-center text-[color:var(--color-muted)]">…</div>
);

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
