import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/erp/Sidebar';
import { Topbar } from '../components/erp/Topbar';
import { Footer } from '../components/erp/Footer';
import { MobileBottomNav } from '../components/erp/MobileBottomNav';

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
