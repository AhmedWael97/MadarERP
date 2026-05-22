import { Outlet } from 'react-router-dom';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';

const NAV_LINKS: Array<{
  to: string;
  end: boolean;
  label: { ar: string; en: string };
  icon: React.ElementType;
}> = [
  { to: '/super-admin',            end: true,  icon: LayoutDashboard, label: { ar: 'لوحة التحكم',     en: 'Dashboard'  } },
  { to: '/super-admin/companies',  end: false, icon: Building2,       label: { ar: 'الشركات',         en: 'Companies'  } },
  { to: '/super-admin/plans',      end: false, icon: Package,         label: { ar: 'الباقات',         en: 'Plans'      } },
  { to: '/super-admin/modules',    end: false, icon: Package,         label: { ar: 'الموديولات',      en: 'Modules'    } },
  { to: '/super-admin/users',      end: false, icon: Users,           label: { ar: 'المستخدمين',      en: 'Users'      } },
  { to: '/super-admin/settings',   end: false, icon: Settings,        label: { ar: 'إعدادات النظام',  en: 'Settings'   } },
  { to: '/super-admin/letterheads',end: false, icon: FileText,        label: { ar: 'عقود الترخيص',   en: 'Contracts'  } },
];

/**
 * Standalone layout for all /super-admin/* pages.
 * Renders WITHOUT the main sidebar and topbar — it has its own header + nav tabs.
 */
export function SuperAdminShell() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">

      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/50 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">

          {/* Top row: brand + back link */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-600 text-white shadow-sm">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
                  {isAr ? 'مدار — لوحة مدير النظام' : 'Madaar Super Admin'}
                </p>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                  {isAr ? 'الإدارة العليا للمنصة' : 'Platform control plane'}
                </p>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <BackArrow size={14} />
              {isAr ? 'العودة للتطبيق الرئيسي' : 'Back to Main App'}
            </Link>
          </div>

          {/* Nav tabs row */}
          <nav
            className="flex items-center gap-0.5 overflow-x-auto scrollbar-none"
            aria-label={isAr ? 'تنقل لوحة المدير' : 'Super admin navigation'}
          >
            {NAV_LINKS.map(({ to, end, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors',
                    isActive
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                  ].join(' ')
                }
              >
                <Icon size={13} />
                {isAr ? label.ar : label.en}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Page content ──────────────────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-6 pb-16">
        <Outlet />
      </main>

    </div>
  );
}
