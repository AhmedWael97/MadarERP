import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings as SettingsIcon,
  Store,
  Sun,
  User as UserIcon,
  Warehouse,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/useAuth';

interface QuickAction {
  labelAr: string;
  labelEn: string;
  to: string;
  iconColor: string;     // tailwind color token used for bg + text in the icon disc
  iconPath: string;      // raw SVG path data
}

// Mirrors the 9 quick-create entries in the reference topbar (layouts/partials/topbar.blade.php).
const QUICK_ACTIONS: QuickAction[] = [
  { labelAr: 'فاتورة مبيعات',  labelEn: 'Sales invoice',    to: '/sales/invoices/create',         iconColor: 'indigo',  iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { labelAr: 'فاتورة مشتريات', labelEn: 'Purchase invoice', to: '/purchases/invoices/create',     iconColor: 'teal',    iconPath: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84' },
  { labelAr: 'إضافة عميل',     labelEn: 'Add customer',     to: '/customers/create',              iconColor: 'blue',    iconPath: 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z' },
  { labelAr: 'إضافة منتج',     labelEn: 'Add product',      to: '/inventory/products/create',     iconColor: 'violet',  iconPath: 'M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  { labelAr: 'قيد يدوي',       labelEn: 'Journal entry',    to: '/accounting/journal-entries/create', iconColor: 'amber', iconPath: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125' },
  { labelAr: 'سند صرف',        labelEn: 'Payment voucher',  to: '/financial/payment-vouchers/create', iconColor: 'rose', iconPath: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75' },
  { labelAr: 'سند قبض',        labelEn: 'Receipt voucher',  to: '/financial/receipt-vouchers/create', iconColor: 'emerald', iconPath: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z' },
  { labelAr: 'عرض سعر',        labelEn: 'Quotation',        to: '/sales/quotations/create',       iconColor: 'cyan',    iconPath: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z' },
  { labelAr: 'أمر شراء',       labelEn: 'Purchase order',   to: '/purchases/orders/create',       iconColor: 'orange',  iconPath: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
];

const ICON_BG: Record<string, string> = {
  indigo:  'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  teal:    'bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400',
  blue:    'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  violet:  'bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
  amber:   'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  rose:    'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cyan:    'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  orange:  'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

function useClickOutside<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);
  return ref;
}

function useDarkMode() {
  const [on, setOn] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });
  const toggle = () => {
    setOn((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      try { localStorage.setItem('madaar_dark_mode', String(next)); } catch { /* no-op */ }
      return next;
    });
  };
  useEffect(() => {
    try {
      const stored = localStorage.getItem('madaar_dark_mode');
      if (stored === 'true') {
        document.documentElement.classList.add('dark');
        setOn(true);
      }
    } catch { /* no-op */ }
  }, []);
  return { on, toggle };
}

export function Topbar() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user, logout } = useAuth();
  const dark = useDarkMode();

  const [qaOpen, setQaOpen]               = useState(false);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);

  const qaRef       = useClickOutside<HTMLDivElement>(qaOpen, () => setQaOpen(false));
  const profileRef  = useClickOutside<HTMLDivElement>(profileOpen, () => setProfileOpen(false));
  const notifRef    = useClickOutside<HTMLDivElement>(notifOpen, () => setNotifOpen(false));

  const seed = user?.fullName || user?.email || '?';
  const initial = seed.trim().charAt(0).toUpperCase();

  function switchLang() {
    void i18n.changeLanguage(isAr ? 'en' : 'ar');
    try { localStorage.setItem('madaar.locale', isAr ? 'en' : 'ar'); } catch { /* no-op */ }
    document.documentElement.lang = isAr ? 'en' : 'ar';
    document.documentElement.dir = isAr ? 'ltr' : 'rtl';
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
      <nav className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* ── Right side (in RTL): mobile menu + Quick Access dropdown ── */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button — sidebar drawer trigger handled by AppShell */}
          <button
            type="button"
            aria-label="Toggle menu"
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            onClick={() => {
              try { window.dispatchEvent(new CustomEvent('madaar:sidebar:toggle')); } catch { /* no-op */ }
            }}
          >
            <Menu size={20} />
          </button>

          {/* Quick Access dropdown */}
          <div ref={qaRef} className="relative">
            <button
              type="button"
              onClick={() => setQaOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] border border-[color:var(--color-brand-200)] dark:border-[color:var(--color-brand-500)]/20 hover:bg-[color:var(--color-brand-100)] dark:hover:bg-[color:var(--color-brand-500)]/20 transition-all"
            >
              <Zap size={16} />
              <span className="hidden sm:inline">{isAr ? 'الوصول السريع' : 'Quick access'}</span>
              <ChevronDown size={14} className="opacity-60" />
            </button>
            {qaOpen && (
              <div
                className={[
                  'absolute mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden z-50 animate-fade-in',
                  isAr ? 'right-0' : 'left-0',
                ].join(' ')}
              >
                <div className="p-2 border-b border-slate-100 dark:border-white/5">
                  <p className="px-3 py-1 text-xs font-semibold text-slate-400">
                    ⚡ {isAr ? 'إنشاء سريع' : 'Quick create'}
                  </p>
                </div>
                <div className="p-2 max-h-96 overflow-y-auto">
                  {QUICK_ACTIONS.map((qa) => (
                    <Link
                      key={qa.to}
                      to={qa.to}
                      onClick={() => setQaOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                    >
                      <div className={['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', ICON_BG[qa.iconColor]].join(' ')}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d={qa.iconPath} />
                        </svg>
                      </div>
                      <span className="font-medium">{isAr ? qa.labelAr : qa.labelEn}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Left side: POS, Store, Branch, Warehouse, Lang, Dark, Notifications, Profile ── */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
          {/* POS pill (visible on md+) */}
          <Link
            to="/retail/pos"
            title={isAr ? 'نقاط البيع' : 'POS'}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
          >
            <Store size={16} />
            <span className="hidden sm:inline">POS</span>
          </Link>

          {/* E-Store pill */}
          <Link
            to="/ecommerce"
            title={isAr ? 'المتجر الإلكتروني' : 'Storefront'}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-all"
          >
            <Store size={16} />
            <span className="hidden sm:inline">{isAr ? 'المتجر' : 'Store'}</span>
          </Link>

          {/* Branch selector — visual only until backend wires data */}
          <button
            type="button"
            className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border transition bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
            </svg>
            <span className="hidden sm:inline">{isAr ? 'الفرع الرئيسي' : 'Main branch'}</span>
            <ChevronDown size={14} className="opacity-60" />
          </button>

          {/* Warehouse selector — visual only until backend wires data */}
          <button
            type="button"
            className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border transition bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/20"
          >
            <Warehouse size={16} />
            <span className="hidden sm:inline">{isAr ? 'كل المخازن' : 'All warehouses'}</span>
            <ChevronDown size={14} className="opacity-60" />
          </button>

          {/* Language switcher (flag image, not emoji — matches reference) */}
          <button
            type="button"
            onClick={switchLang}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition"
            title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <img
              src={isAr ? '/images/flag-us.png' : '/images/flag-eg.png'}
              alt={isAr ? 'English' : 'العربية'}
              className="w-6 h-6 rounded-full object-cover"
            />
          </button>

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={dark.toggle}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-white/5 transition"
            aria-label="Toggle dark mode"
          >
            {dark.on ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-white/5 transition"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </button>
            {notifOpen && (
              <div
                className={[
                  'absolute mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden z-50 animate-fade-in',
                  isAr ? 'left-0' : 'right-0',
                ].join(' ')}
              >
                <div className="p-4 border-b border-slate-100 dark:border-white/5">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                    {isAr ? 'الإشعارات' : 'Notifications'}
                  </h3>
                </div>
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    {isAr ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1" />

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-3 py-1 hover:opacity-80 transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[color:var(--color-brand-400)] to-[color:var(--color-brand-600)] flex items-center justify-center text-white text-sm font-bold">
                {initial}
              </div>
              <div className="hidden sm:block text-start">
                <p className="text-sm font-semibold text-slate-700 dark:text-white leading-none">
                  {user?.fullName || user?.email || (isAr ? 'مدير الشركة' : 'Administrator')}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {user?.email || ''}
                </p>
              </div>
            </button>
            {profileOpen && (
              <div
                className={[
                  'absolute mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden z-50 animate-fade-in',
                  isAr ? 'left-0' : 'right-0',
                ].join(' ')}
              >
                <div className="p-3">
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                  >
                    <UserIcon size={16} className="text-slate-400" />
                    {isAr ? 'الملف الشخصي' : 'My profile'}
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                  >
                    <SettingsIcon size={16} className="text-slate-400" />
                    {isAr ? 'الإعدادات' : 'Settings'}
                  </Link>
                </div>
                <div className="p-3 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); void logout(); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition w-full"
                  >
                    <LogOut size={16} />
                    {t('action.logout', isAr ? 'تسجيل الخروج' : 'Sign out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
