import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Receipt, Package, Users, Menu } from 'lucide-react';

// Mirrors the 5-tab mobile bottom nav from the reference (layouts/app.blade.php).
// Visible below 1024px; hidden in landscape via globals.css media queries.
export function MobileBottomNav() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { pathname } = useLocation();

  const tabs = [
    { to: '/dashboard',        label: isAr ? 'الرئيسية'  : 'Home',      icon: Home,    match: (p: string) => p === '/' || p.startsWith('/dashboard') },
    { to: '/sales/invoices',   label: isAr ? 'المبيعات'  : 'Sales',     icon: Receipt, match: (p: string) => p.startsWith('/sales') },
    { to: '/inventory/products', label: isAr ? 'المخزون' : 'Stock',     icon: Package, match: (p: string) => p.startsWith('/inventory') },
    { to: '/customers',        label: isAr ? 'العملاء'   : 'Customers', icon: Users,   match: (p: string) => p.startsWith('/customers') },
  ];

  return (
    <nav className="mobile-bottom-nav no-print">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.match(pathname);
        return (
          <NavLink key={tab.to} to={tab.to} className={active ? 'active' : ''}>
            <Icon strokeWidth={1.5} />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
      <button
        type="button"
        onClick={() => {
          try { window.dispatchEvent(new CustomEvent('madaar:sidebar:toggle')); } catch { /* no-op */ }
        }}
        className="!bg-transparent"
        aria-label={isAr ? 'القائمة' : 'Menu'}
      >
        <Menu strokeWidth={1.5} />
        <span>{isAr ? 'القائمة' : 'Menu'}</span>
      </button>
    </nav>
  );
}
