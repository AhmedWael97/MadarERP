import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { Package, Users, CheckCircle2, XCircle } from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';

interface TenantRow {
  name: string;
  name_ar?: string;
  enabled_modules?: string;
  subscription_status?: string;
}

const ALL_MODULES = [
  { key: 'accounting',    nameAr: 'الحسابات',             isCore: true,  icon: '💰' },
  { key: 'sales',         nameAr: 'المبيعات',             isCore: true,  icon: '🛒' },
  { key: 'purchases',     nameAr: 'المشتريات',            isCore: true,  icon: '📦' },
  { key: 'inventory',     nameAr: 'المخزون',              isCore: true,  icon: '🏭' },
  { key: 'treasury',      nameAr: 'الخزينة',              isCore: true,  icon: '🏦' },
  { key: 'crm',           nameAr: 'إدارة العملاء (CRM)',  isCore: false, icon: '🤝' },
  { key: 'hr',            nameAr: 'الموارد البشرية',      isCore: false, icon: '👥' },
  { key: 'construction',  nameAr: 'المقاولات',            isCore: false, icon: '🏗️'  },
  { key: 'fleet',         nameAr: 'الأسطول',              isCore: false, icon: '🚛' },
  { key: 'logistics',     nameAr: 'الخدمات اللوجستية',   isCore: false, icon: '🚚' },
  { key: 'ecommerce',     nameAr: 'المتجر الإلكتروني',   isCore: false, icon: '🛍️'  },
  { key: 'restaurant',    nameAr: 'إدارة المطاعم',        isCore: false, icon: '🍽️'  },
  { key: 'workshop',      nameAr: 'مراكز الصيانة',        isCore: false, icon: '🔧' },
  { key: 'manufacturing', nameAr: 'التصنيع',              isCore: false, icon: '⚙️'  },
  { key: 'tax',           nameAr: 'الضرائب',              isCore: false, icon: '📄' },
  { key: 'support',       nameAr: 'الدعم الفني',          isCore: false, icon: '🎧' },
  { key: 'assets',        nameAr: 'الأصول الثابتة',       isCore: false, icon: '🏢' },
  { key: 'events',        nameAr: 'الفعاليات',            isCore: false, icon: '🎪' },
  { key: 'lms',           nameAr: 'منصة التعليم',         isCore: false, icon: '📚' },
];

export default function SuperAdminModules() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Fetch all companies to compute per-module usage counts
  const { data: tenantsResp } = useFrappeGetCall<{ message: { rows: TenantRow[]; total: number } }>('madaar_core.api.list_tenant_subscriptions');
  const tenants: TenantRow[] = tenantsResp?.message?.rows ?? [];

  // Count how many companies have each module enabled
  function usageCount(moduleKey: string): number {
    return tenants.filter((t) => {
      try {
        const mods: string[] = JSON.parse(t.enabled_modules ?? '[]');
        return mods.includes(moduleKey);
      } catch {
        return false;
      }
    }).length;
  }

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'core' | 'optional'>('all');

  const visible = ALL_MODULES.filter((m) => {
    if (filterType === 'core' && !m.isCore) return false;
    if (filterType === 'optional' && m.isCore) return false;
    if (search && !m.nameAr.includes(search) && !m.key.includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCompanies = tenants.length;

  return (
    <PageShell
      title={isAr ? 'إدارة الموديولات' : 'Modules management'}
      subtitle={isAr ? 'عرض استخدام الموديولات عبر جميع الشركات' : 'View module usage across all companies'}
    >
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1">{isAr ? 'إجمالي الموديولات' : 'Total modules'}</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{ALL_MODULES.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1">{isAr ? 'موديولات أساسية' : 'Core modules'}</p>
          <p className="text-2xl font-black text-violet-600">{ALL_MODULES.filter((m) => m.isCore).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1">{isAr ? 'موديولات اختيارية' : 'Optional modules'}</p>
          <p className="text-2xl font-black text-emerald-600">{ALL_MODULES.filter((m) => !m.isCore).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1">{isAr ? 'الشركات' : 'Companies'}</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{totalCompanies}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Package size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث عن موديول…' : 'Search module…'}
            className="w-full ps-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-white/5"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-xs">
          {(['all', 'core', 'optional'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilterType(v)}
              className={[
                'px-3 py-2 font-semibold transition-colors',
                filterType === v
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              {v === 'all' ? (isAr ? 'الكل' : 'All') : v === 'core' ? (isAr ? 'أساسية' : 'Core') : (isAr ? 'اختيارية' : 'Optional')}
            </button>
          ))}
        </div>
      </div>

      {/* Module cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((mod) => {
          const count = usageCount(mod.key);
          const pct = totalCompanies > 0 ? Math.round((count / totalCompanies) * 100) : 0;
          return (
            <div
              key={mod.key}
              className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mod.icon}</span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{mod.nameAr}</p>
                    <p className="text-xs text-slate-400 font-mono" dir="ltr">{mod.key}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {mod.isCore ? (
                    <span className="text-[10px] px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-lg font-bold">
                      {isAr ? 'أساسي' : 'Core'}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-lg font-bold">
                      {isAr ? 'اختياري' : 'Optional'}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Users size={11} />
                    {count} / {totalCompanies}
                  </span>
                </div>
              </div>

              {/* Usage bar */}
              <div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{pct}% {isAr ? 'من الشركات' : 'of companies'}</p>
              </div>

              {/* Active status indicator */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {count > 0 ? (
                  <><CheckCircle2 size={13} className="text-emerald-500" /><span className="text-emerald-600">{isAr ? 'مفعّل في شركات' : 'Active in companies'}</span></>
                ) : (
                  <><XCircle size={13} className="text-slate-400" /><span className="text-slate-400">{isAr ? 'غير مستخدم' : 'Not used'}</span></>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          {isAr ? 'لا توجد موديولات مطابقة' : 'No modules found'}
        </div>
      )}
    </PageShell>
  );
}
