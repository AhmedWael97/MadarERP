import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { Search, UserCheck, UserX } from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';

interface UserRow {
  name: string;
  full_name?: string;
  email?: string;
  enabled?: number;
  last_active?: string;
  user_type?: string;
  creation?: string;
}

export default function SuperAdminUsers() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'System User' | 'Website User'>('');

  const { data } = useFrappeGetDocList('User', {
    filters: [['name', '!=', 'Guest'], ['name', '!=', 'Administrator']],
    fields: ['name', 'full_name', 'email', 'enabled', 'last_active', 'user_type', 'creation'],
    limit: 500,
    orderBy: { field: 'creation', order: 'desc' },
  });
  const allUsers: UserRow[] = data ?? [];

  const rows = allUsers.filter((u) => {
    if (typeFilter && u.user_type !== typeFilter) return false;
    const q = search.toLowerCase();
    if (q && !(u.full_name ?? '').toLowerCase().includes(q) && !(u.email ?? '').toLowerCase().includes(q)) return false;
    return true;
  });

  const enabledCount  = allUsers.filter((u) => u.enabled).length;
  const disabledCount = allUsers.filter((u) => !u.enabled).length;
  const sysUserCount  = allUsers.filter((u) => u.user_type === 'System User').length;

  return (
    <PageShell
      title={isAr ? 'إدارة المستخدمين' : 'Users management'}
      subtitle={isAr ? 'جميع مستخدمي النظام عبر جميع الشركات' : 'All system users across all companies'}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1">{isAr ? 'إجمالي المستخدمين' : 'Total users'}</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{allUsers.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><UserCheck size={12} /> {isAr ? 'نشطون' : 'Active'}</p>
          <p className="text-2xl font-black text-emerald-600">{enabledCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><UserX size={12} /> {isAr ? 'معطّلون' : 'Disabled'}</p>
          <p className="text-2xl font-black text-rose-500">{disabledCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-500 mb-1">{isAr ? 'مستخدمو النظام' : 'System users'}</p>
          <p className="text-2xl font-black text-violet-600">{sysUserCount}</p>
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
            placeholder={isAr ? 'بحث بالاسم أو الإيميل…' : 'Search by name or email…'}
            className="w-full ps-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-white/5"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="">{isAr ? 'كل الأنواع' : 'All types'}</option>
          <option value="System User">{isAr ? 'مستخدمو النظام' : 'System User'}</option>
          <option value="Website User">{isAr ? 'مستخدمو الموقع' : 'Website User'}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5">
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">{isAr ? 'المستخدم' : 'User'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">{isAr ? 'الإيميل' : 'Email'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">{isAr ? 'النوع' : 'Type'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">{isAr ? 'الحالة' : 'Status'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">{isAr ? 'آخر نشاط' : 'Last active'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
            {rows.map((u) => (
              <tr key={u.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                <td className="px-5 py-3">
                  <p className="font-semibold text-slate-800 dark:text-white">{u.full_name || u.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono" dir="ltr">{u.name}</p>
                </td>
                <td className="px-5 py-3 text-slate-500" dir="ltr">{u.email || '—'}</td>
                <td className="px-5 py-3 text-slate-500">
                  {u.user_type === 'System User'
                    ? (isAr ? 'مستخدم النظام' : 'System User')
                    : (isAr ? 'مستخدم الموقع' : 'Website User')}
                </td>
                <td className="px-5 py-3">
                  {u.enabled ? (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg font-bold">{isAr ? 'نشط' : 'Active'}</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-600 rounded-lg font-bold">{isAr ? 'معطّل' : 'Disabled'}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs" dir="ltr">{u.last_active || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                {isAr ? 'لا يوجد مستخدمون' : 'No users found'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
