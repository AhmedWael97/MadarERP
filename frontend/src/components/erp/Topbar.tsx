import { useTranslation } from 'react-i18next';
import { Bell, ChevronDown, LogOut, Plus, Store, Warehouse, GitBranch, Wallet } from 'lucide-react';
import { useAuth } from '../../lib/auth/useAuth';
import { setLocale } from '../../lib/i18n';
import { useTenant } from '../../lib/tenant/TenantContext';

type PillVariant = 'green' | 'orange' | 'amber' | 'violet' | 'slate';

const PILL_CLASS: Record<PillVariant, string> = {
  green:
    'bg-[color:var(--color-emerald-50)] text-[color:var(--color-emerald-700)] border-[color:var(--color-emerald-200)] hover:bg-[color:var(--color-emerald-100)]',
  orange:
    'bg-[color:var(--color-orange-50)] text-[color:var(--color-orange-600)] border-[color:var(--color-orange-200)] hover:bg-[color:var(--color-orange-100)]',
  amber:
    'bg-[color:var(--color-yellow-50)] text-[color:var(--color-yellow-800)] border-[color:var(--color-yellow-200)] hover:bg-[color:var(--color-yellow-100)]',
  violet:
    'bg-[color:var(--color-violet-50)] text-[color:var(--color-violet-700)] border-[color:var(--color-violet-200)] hover:bg-[color:var(--color-violet-100)]',
  slate:
    'bg-[color:var(--color-slate-50)] text-[color:var(--color-slate-700)] border-[color:var(--color-slate-200)] hover:bg-[color:var(--color-slate-100)]',
};

function Pill({
  icon,
  children,
  variant = 'green',
  chevron = false,
  onClick,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: PillVariant;
  chevron?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        PILL_CLASS[variant],
      ].join(' ')}
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
      {chevron && <ChevronDown size={12} className="opacity-60" />}
    </button>
  );
}

export function Topbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const isAr = i18n.language === 'ar';

  // Initials for the avatar — first letter of the user's display name or email.
  const seed = user?.fullName || user?.email || '?';
  const initial = seed.trim().charAt(0).toUpperCase();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-card)] px-5 py-2.5 shadow-[var(--shadow-card)]">
      {/* Right cluster (in RTL): profile + locale + notifications + logout.
          In LTR these end up on the right anyway thanks to flex order. */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-app-bg)] py-1 ps-1 pe-3">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[color:var(--color-violet-500)] to-[color:var(--color-violet-700)] text-xs font-bold text-white">
            {initial}
          </div>
          <div className="hidden flex-col leading-tight md:flex">
            <span className="text-xs font-semibold">{user?.fullName || 'مدير الشركة'}</span>
            <span className="text-[10px] text-[color:var(--color-muted)]">{user?.email}</span>
          </div>
        </div>

        <button
          type="button"
          aria-label="notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-[color:var(--color-slate-600)] hover:bg-[color:var(--color-app-bg)]"
        >
          <Bell size={16} />
          <span className="absolute -top-0.5 -end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--color-rose-500)] px-1 text-[9px] font-bold text-white">
            3
          </span>
        </button>

        <button
          type="button"
          onClick={() => setLocale(isAr ? 'en' : 'ar')}
          aria-label="toggle language"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-2.5 text-xs font-semibold text-[color:var(--color-slate-700)] hover:bg-[color:var(--color-app-bg)]"
        >
          <span className="text-base leading-none" aria-hidden>
            {isAr ? '🇺🇸' : '🇸🇦'}
          </span>
          <span>{isAr ? 'EN' : 'AR'}</span>
        </button>

        {tenant && (
          <span className="rounded-full bg-[color:var(--color-emerald-500)]/15 px-2.5 py-1 text-xs font-medium text-[color:var(--color-emerald-700)]">
            {tenant}
          </span>
        )}

        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[color:var(--color-slate-800)] px-3 text-xs font-medium text-white transition-colors hover:bg-[color:var(--color-slate-900)]"
        >
          <LogOut size={14} />
          <span>{t('action.logout')}</span>
        </button>
      </div>

      {/* Left cluster (in RTL = visual right edge): the quick-pill row from the reference. */}
      <div className="flex flex-wrap items-center gap-2">
        <Pill icon={<Plus size={13} />} variant="violet" chevron>
          الوصول السريع
        </Pill>
        <Pill icon={<Store size={13} />} variant="green">
          POS
        </Pill>
        <Pill icon={<Store size={13} />} variant="orange">
          المتجر
        </Pill>
        <Pill icon={<GitBranch size={13} />} variant="amber" chevron>
          اختر الفرع
        </Pill>
        <Pill icon={<Warehouse size={13} />} variant="green" chevron>
          كل المخازن
        </Pill>
        <Pill icon={<Wallet size={13} />} variant="slate" chevron>
          مدير الخزينة
        </Pill>
      </div>
    </header>
  );
}
