import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/erp/Sidebar';
import { Topbar } from '../components/erp/Topbar';
import { Footer } from '../components/erp/Footer';

/**
 * Top-level frame: navy sidebar + sticky topbar with quick-action pills + footer band.
 *
 * Grid order is [sidebar, main]. CSS Grid reverses column order under `dir="rtl"`,
 * so the same markup puts the sidebar on the right in Arabic and on the left in English
 * — no per-direction stylesheet needed. Width 17rem (272px) matches the reference.
 */
export function AppShell() {
  return (
    <div className="grid min-h-dvh grid-cols-[17rem_1fr] bg-app text-app">
      <Sidebar />
      <div className="flex min-w-0 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-x-hidden px-6 py-5">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
