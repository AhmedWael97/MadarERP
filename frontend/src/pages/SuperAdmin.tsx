import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFrappeGetCall } from 'frappe-react-sdk';
import {
  Building2,
  Users,
  DollarSign,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';
import { StatCard } from '../components/erp/StatCard';

interface BootstrapMessage {
  message?: {
    total_companies?: number;
    active_companies?: number;
    trial_companies?: number;
    suspended_companies?: number;
    total_users?: number;
    active_users?: number;
    monthly_revenue?: number;
    total_plans?: number;
    companies_by_plan?: Array<{ name_ar: string; companies_count: number }>;
    expiring_subscriptions?: Array<{ name: string; name_ar: string; plan_name_ar?: string; end_date?: string }>;
    recent_companies?: Array<{ name: string; name_ar: string; plan_name_ar?: string; subscription_status?: string }>;
    module_stats?: Array<{ key: string; name: string; count: number }>;
  };
}

const STATUS_PILL: Record<string, { ar: string; en: string; cls: string }> = {
  active:    { ar: 'نشط',  en: 'Active',    cls: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' },
  trial:     { ar: 'تجريبي', en: 'Trial',    cls: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600' },
  suspended: { ar: 'معلق',  en: 'Suspended', cls: 'bg-red-100 dark:bg-red-500/10 text-red-600' },
  cancelled: { ar: 'ملغي',  en: 'Cancelled', cls: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600' },
  expired:   { ar: 'منتهي', en: 'Expired',   cls: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600' },
};

/**
 * Super Admin landing dashboard — visual mirror of
 * `resources/views/super-admin/dashboard.blade.php` from the reference.
 *
 * Data: optimistically calls `madaar_core.api.super_admin_overview` (a Frappe
 * whitelisted endpoint to be added to madaar_core/api.py). When the endpoint
 * is not yet wired, every stat falls back to `—` and lists show empty states,
 * so the page still renders cleanly during the backend buildout.
 */
export default function SuperAdmin() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, error } = useFrappeGetCall<BootstrapMessage>(
    'madaar_core.api.super_admin_overview',
    undefined,
    'super-admin-overview',
  );
  const m = data?.message ?? {};

  const moduleStats = useMemo(() => m.module_stats ?? [], [m.module_stats]);
  const totalCompanies = m.total_companies ?? 0;

  return (
    <PageShell
      title={isAr ? 'لوحة تحكم النظام' : 'System Dashboard'}
      subtitle={isAr ? 'نظرة شاملة على أداء المنصة والاشتراكات' : 'Platform performance & subscription overview'}
      actions={
        <Link
          to="/super-admin/companies/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm"
        >
          <Plus size={16} />
          {isAr ? 'شركة جديدة' : 'New company'}
        </Link>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
          {isAr
            ? 'نقطة النهاية madaar_core.api.super_admin_overview غير موجودة بعد — البيانات أدناه مجرد قوالب.'
            : 'Endpoint madaar_core.api.super_admin_overview is not wired yet — the cards below show placeholders.'}
        </div>
      )}

      {/* ── Stat cards (4-up on lg) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          color="blue"
          icon={<Building2 size={22} />}
          label={isAr ? 'إجمالي الشركات' : 'Total companies'}
          value={m.total_companies ?? '—'}
          caption={`${m.active_companies ?? 0} ${isAr ? 'نشطة' : 'active'}`}
        />
        <StatCard
          color="emerald"
          icon={<Users size={22} />}
          label={isAr ? 'إجمالي المستخدمين' : 'Total users'}
          value={m.total_users ?? '—'}
          caption={`${m.active_users ?? 0} ${isAr ? 'نشط' : 'active'}`}
        />
        <StatCard
          color="amber"
          icon={<DollarSign size={22} />}
          label={isAr ? 'الإيرادات الشهرية' : 'Monthly revenue'}
          value={m.monthly_revenue ?? '—'}
          caption={`${m.total_plans ?? 0} ${isAr ? 'باقات نشطة' : 'active plans'}`}
        />
        <StatCard
          color="rose"
          icon={<AlertTriangle size={22} />}
          label={isAr ? 'تجريبية / معلقة' : 'Trial / suspended'}
          value={(m.trial_companies ?? 0) + (m.suspended_companies ?? 0)}
          caption={`${m.trial_companies ?? 0} ${isAr ? 'تجريبية —' : 'trial —'} ${m.suspended_companies ?? 0} ${isAr ? 'معلقة' : 'suspended'}`}
        />
      </div>

      {/* ── Companies by plan + Module usage ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/30 p-5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">
            {isAr ? 'الشركات حسب الباقة' : 'Companies by plan'}
          </h3>
          {(m.companies_by_plan?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {m.companies_by_plan!.map((plan, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{plan.name_ar}</span>
                    <span className="text-slate-400">
                      {plan.companies_count} {isAr ? 'شركة' : 'companies'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all"
                      style={{
                        width:
                          totalCompanies > 0
                            ? `${(plan.companies_count / totalCompanies) * 100}%`
                            : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              {isAr ? 'لا توجد باقات بعد' : 'No plans yet'}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/30 p-5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">
            {isAr ? 'استخدام الموديولات' : 'Module usage'}
          </h3>
          {moduleStats.length > 0 ? (
            <div className="space-y-3">
              {moduleStats.map((mod) => (
                <div key={mod.key} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{mod.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{
                          width:
                            totalCompanies > 0
                              ? `${(mod.count / totalCompanies) * 100}%`
                              : '0%',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-8 text-left">{mod.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              {isAr ? 'لا توجد إحصائيات' : 'No stats yet'}
            </p>
          )}
        </div>
      </div>

      {/* ── Recent companies + Expiring subscriptions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-white">
              {isAr ? 'أحدث الشركات' : 'Recent companies'}
            </h3>
            <Link to="/super-admin/companies" className="text-xs text-emerald-600 hover:text-emerald-500">
              {isAr ? 'عرض الكل ←' : 'See all →'}
            </Link>
          </div>
          {(m.recent_companies?.length ?? 0) > 0 ? (
            <div>
              {m.recent_companies!.map((c) => {
                const pill = STATUS_PILL[c.subscription_status ?? 'active'] ?? STATUS_PILL.active;
                return (
                  <Link
                    key={c.name}
                    to={`/super-admin/companies/${encodeURIComponent(c.name)}`}
                    className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/20 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-2 px-2 rounded-lg transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-white">{c.name_ar}</p>
                      <p className="text-[10px] text-slate-400">{c.plan_name_ar ?? (isAr ? 'بدون باقة' : 'No plan')}</p>
                    </div>
                    <span className={['text-[10px] px-2 py-0.5 rounded-lg font-bold', pill.cls].join(' ')}>
                      {isAr ? pill.ar : pill.en}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              {isAr ? 'لا توجد شركات بعد' : 'No companies yet'}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/30 p-5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">
            {isAr ? '⚠ اشتراكات على وشك الانتهاء' : '⚠ Subscriptions expiring soon'}
          </h3>
          {(m.expiring_subscriptions?.length ?? 0) > 0 ? (
            m.expiring_subscriptions!.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/20 last:border-0"
              >
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-white">{c.name_ar}</p>
                  <p className="text-[10px] text-slate-400">{c.plan_name_ar ?? ''}</p>
                </div>
                <span className="text-xs font-bold text-amber-600">{c.end_date ?? ''}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              {isAr ? '✓ لا توجد اشتراكات منتهية قريبا' : '✓ No subscriptions expiring soon'}
            </p>
          )}
        </div>
      </div>

      {/* ── Sub-section cards (Companies / Plans / Modules / Users / Settings / Letterheads) ── */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUB_SECTIONS.map((s) => (
          <SubSectionCard key={s.to} section={s} isAr={isAr} />
        ))}
      </div>
    </PageShell>
  );
}

interface SubSection {
  to: string;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  iconColor: string;
}

const SUB_SECTIONS: SubSection[] = [
  { to: '/super-admin/companies',   labelAr: 'إدارة الشركات',    labelEn: 'Companies',     descAr: 'إنشاء، تعديل، تعليق الشركات', descEn: 'Create, edit and suspend tenants', iconColor: 'blue' },
  { to: '/super-admin/plans',       labelAr: 'الباقات والأسعار', labelEn: 'Plans & pricing', descAr: 'الباقات النشطة والمميزات',     descEn: 'Active plans and feature limits',  iconColor: 'amber' },
  { to: '/super-admin/modules',     labelAr: 'إدارة الموديولات',  labelEn: 'Modules',       descAr: 'تفعيل / تعطيل الموديولات',     descEn: 'Enable or disable feature modules', iconColor: 'violet' },
  { to: '/super-admin/users',       labelAr: 'المستخدمين',       labelEn: 'Users',         descAr: 'كل المستخدمين عبر الشركات',    descEn: 'All users across tenants',         iconColor: 'emerald' },
  { to: '/super-admin/settings',    labelAr: 'إعدادات النظام',    labelEn: 'System settings', descAr: 'منصة، أمان، نسخ احتياطي، تكامل', descEn: 'Platform, security, backup, integrations', iconColor: 'slate' },
  { to: '/super-admin/letterheads', labelAr: 'عقود الترخيص',     labelEn: 'License contracts', descAr: 'الترويسات وعقود الترخيص',   descEn: 'Letterheads & license contracts',  iconColor: 'rose' },
];

const SUB_BG: Record<string, string> = {
  blue:    'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  amber:   'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  violet:  'bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  slate:   'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400',
  rose:    'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

function SubSectionCard({ section, isAr }: { section: SubSection; isAr: boolean }) {
  const Chevron = isAr ? ChevronLeft : ChevronRight;
  return (
    <Link
      to={section.to}
      className="group flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={['grid h-12 w-12 shrink-0 place-items-center rounded-xl', SUB_BG[section.iconColor]].join(' ')}>
        <Building2 size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-slate-800 dark:text-white">
          {isAr ? section.labelAr : section.labelEn}
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
          {isAr ? section.descAr : section.descEn}
        </div>
      </div>
      <Chevron size={16} className="shrink-0 text-slate-300 dark:text-slate-600 transition-colors group-hover:text-[color:var(--color-brand-500)]" />
    </Link>
  );
}

/**
 * Generic list page for the super-admin sub-routes (companies, plans, modules,
 * users, letterheads). Renders a styled card with a placeholder until the
 * backend endpoint is wired.
 */
export function SuperAdminList() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { section = 'companies' } = useParams<{ section: string }>();

  const TITLES: Record<string, { ar: string; en: string }> = {
    companies:    { ar: 'إدارة الشركات',    en: 'Companies' },
    plans:        { ar: 'الباقات والأسعار', en: 'Plans & pricing' },
    modules:      { ar: 'إدارة الموديولات',  en: 'Modules' },
    users:        { ar: 'المستخدمين',       en: 'Users' },
    settings:     { ar: 'إعدادات النظام',    en: 'System settings' },
    letterheads:  { ar: 'عقود الترخيص',     en: 'License contracts' },
  };
  const t = TITLES[section] ?? { ar: section, en: section };

  return (
    <PageShell title={isAr ? t.ar : t.en} subtitle={isAr ? 'إدارة عبر لوحة مدير النظام' : 'Manage from the super-admin console'}>
      <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isAr
            ? 'هذه الصفحة جاهزة بصرياً — تربط بالـ doctypes الخاصة بمدار للوحة مدير النظام بمجرد إنشائها في madaar_core.'
            : 'Page is visually ready — it wires to madaar_core super-admin doctypes once they are created.'}
        </p>
      </div>
    </PageShell>
  );
}
