import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, X } from 'lucide-react';
import { Sidebar } from '../components/erp/Sidebar';
import { Topbar } from '../components/erp/Topbar';
import { Footer } from '../components/erp/Footer';
import { MobileBottomNav } from '../components/erp/MobileBottomNav';
import { useTenantStore } from '../lib/store/tenantStore';

/**
 * Reference parity (resources/views/layouts/app.blade.php):
 * - Sidebar fixed left/right (272px) on lg+, drawer on mobile.
 * - Sticky topbar (h-16) with backdrop blur.
 * - Body has a subtle slate gradient set on globals.css.
 * - Mobile bottom nav (5 tabs) shown below 1024px.
 *
 * Direction-aware: CSS Grid column order naturally reverses under `dir="rtl"`.
 */
export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();

  // Active-tenant view banner. When the super admin clicks "Open Company"
  // we stash the tenant in the store; the banner shows here and lets them
  // exit back to the super-admin view. Hidden when no tenant is active.
  const activeTenantLabel = useTenantStore((s) => s.activeTenantLabel);
  const enabledModules = useTenantStore((s) => s.enabledModules);
  const clearActiveTenant = useTenantStore((s) => s.clearActiveTenant);
  function exitCompanyView() {
    clearActiveTenant();
    navigate('/super-admin/companies');
  }

  // Topbar/bottom-nav fires a CustomEvent — listen here so we don't have to
  // thread a callback through the whole tree.
  useEffect(() => {
    const handler = () => setMobileOpen((o) => !o);
    window.addEventListener('madaar:sidebar:toggle', handler);
    return () => window.removeEventListener('madaar:sidebar:toggle', handler);
  }, []);

  return (
    <div className="relative min-h-dvh text-app">
      {/* Desktop sidebar — sticky, full height */}
      <div className="hidden lg:block fixed inset-y-0 start-0 z-20">
        <Sidebar />
      </div>

      {/* Mobile drawer + backdrop */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 start-0 z-50 animate-slide-up">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main column — offset by sidebar width on lg+ */}
      <div className="flex min-h-dvh min-w-0 flex-col lg:ms-[17rem]">
        {activeTenantLabel && (
          <div className="flex items-center justify-between gap-3 px-4 py-1.5 bg-amber-500 text-white text-xs font-semibold shadow-sm">
            <span className="flex items-center gap-2 min-w-0">
              <Eye size={14} className="shrink-0" />
              <span className="truncate">
                {isAr ? 'تعرض بيانات الشركة:' : 'Viewing company:'}{' '}
                <strong>{activeTenantLabel}</strong>
                {enabledModules && enabledModules.length > 0 && (
                  <span className="ms-2 opacity-80 font-normal">
                    ({enabledModules.length} {isAr ? 'وحدة' : 'modules'})
                  </span>
                )}
              </span>
            </span>
            <button
              type="button"
              onClick={exitCompanyView}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/20 hover:bg-white/30 transition text-xs font-bold shrink-0"
            >
              <X size={12} />
              {isAr ? 'إغلاق' : 'Exit'}
            </button>
          </div>
        )}
        <Topbar />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 lg:px-6 py-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
        <Footer />
      </div>

      <MobileBottomNav />
    </div>
  );
}
