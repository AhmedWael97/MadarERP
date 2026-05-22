import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { Search, AlertTriangle, TrendingUp } from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';

interface SubscriptionRow {
  name: string;
  name_ar?: string;
  tenant_company?: string;
  owner_email?: string;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  monthly_amount?: number;
  currency?: string;
  max_users?: number;
}

const STATUS_PILL: Record<string, { cls: string; label: string }> = {
  trial:     { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',      label: 'تجريبي' },
  active:    { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'نشط' },
  suspended: { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',   label: 'معلّق' },
  cancelled: { cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',       label: 'ملغي' },
  expired:   { cls: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',     label: 'منتهي' },
};

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SuperAdminSubscriptions() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data: resp } = useFrappeGetCall<{ message: SubscriptionRow[] }>('madaar_core.api.list_tenant_subscriptions');
  const all: SubscriptionRow[] = resp?.message ?? [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const rows = all.filter((r) => {
    if (statusFilter && r.subscription_status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (q && !r.name_ar?.includes(search) && !(r.tenant_company ?? '').toLowerCase().includes(q) && !(r.owner_email ?? '').toLowerCase().includes(q)) return false;
    return true;
  });

  // Summary stats
  const totalRevenue  = all.filter((r) => r.subscription_status === 'active').reduce((s, r) => s + (r.monthly_amount ?? 0), 0);
  const activeCount   = all.filter((r) => r.subscription_status === 'active').length;
  const trialCount    = all.filter((r) => r.subscription_status === 'trial').length;
  const expiringSoon  = all.filter((r) => {
    const d = daysUntil(r.subscription_end_date);
    return d !== null && d >= 0 && d <= 14;
  }).length;

  return (
    <PageShell
      title={isAr ? 'إدارة الاشتراكات' : 'Subscriptions'}
      subtitle={isAr ? 'متابعة اشتراكات جميع الشركات' : 'Monitor subscriptions across all companies'}
    >
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1">{isAr ? 'إجمالي الاشتراكات' : 'Total'}</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{all.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1">{isAr ? 'نشطة' : 'Active'}</p>
          <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <TrendingUp size={12} /> {isAr ? 'الإيرادات الشهرية' : 'Monthly revenue'}
          </p>
          <p className="text-2xl font-black text-violet-600">{totalRevenue.toLocaleString()} ج.م</p>
        </div>
        <div className={`rounded-2xl p-4 border ${expiringSoon > 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-white/5'}`}>
          <p className={`text-xs mb-1 flex items-center gap-1 ${expiringSoon > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
            {expiringSoon > 0 && <AlertTriangle size={12} />} {isAr ? 'تنتهي خلال 14 يوم' : 'Expiring ≤ 14 days'}
          </p>
          <p className={`text-2xl font-black ${expiringSoon > 0 ? 'text-amber-600' : 'text-slate-800 dark:text-white'}`}>{expiringSoon}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث…' : 'Search…'}
            className="w-full ps-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-white/5"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="">{isAr ? 'كل الحالات' : 'All statuses'}</option>
          <option value="trial">{isAr ? 'تجريبي' : 'Trial'}</option>
          <option value="active">{isAr ? 'نشط' : 'Active'}</option>
          <option value="suspended">{isAr ? 'معلّق' : 'Suspended'}</option>
          <option value="cancelled">{isAr ? 'ملغي' : 'Cancelled'}</option>
          <option value="expired">{isAr ? 'منتهي' : 'Expired'}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5">
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">{isAr ? 'الشركة' : 'Company'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">{isAr ? 'الباقة' : 'Plan'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">{isAr ? 'الحالة' : 'Status'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">{isAr ? 'تاريخ الانتهاء' : 'Expiry'}</th>
              <th className="px-5 py-3 text-end text-xs font-bold text-slate-500 uppercase">{isAr ? 'الرسوم الشهرية' : 'Monthly'}</th>
              <th className="px-5 py-3 text-end text-xs font-bold text-slate-500 uppercase">{isAr ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
            {rows.map((r) => {
              const pill = STATUS_PILL[r.subscription_status ?? ''] ?? STATUS_PILL.active;
              const days = daysUntil(r.subscription_end_date);
              const isExpiringSoon = days !== null && days >= 0 && days <= 14;
              return (
                <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <p className="font-bold text-slate-800 dark:text-white">{r.name_ar || r.tenant_company}</p>
                    <p className="text-[10px] text-slate-400">{r.owner_email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{r.subscription_plan || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${pill.cls}`}>
                      {pill.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {r.subscription_end_date ? (
                      <div>
                        <p className={`text-xs font-semibold ${isExpiringSoon ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}`} dir="ltr">
                          {r.subscription_end_date}
                        </p>
                        {isExpiringSoon && (
                          <p className="text-[10px] text-amber-500 flex items-center gap-0.5">
                            <AlertTriangle size={10} />
                            {days === 0 ? (isAr ? 'ينتهي اليوم' : 'Expires today') : `${days} ${isAr ? 'يوم' : 'days'}`}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-end font-bold">
                    {r.monthly_amount ? `${r.monthly_amount.toLocaleString()} ${r.currency ?? ''}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-end">
                    <Link
                      to={`/super-admin/companies/${encodeURIComponent(r.name)}`}
                      className="text-xs text-[color:var(--color-brand-600)] font-bold hover:underline"
                    >
                      {isAr ? 'عرض' : 'View'}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                {isAr ? 'لا توجد اشتراكات' : 'No subscriptions found'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
