/** Fiscal Years list — Arabic display with formatted period column.
 *  Shows year, formatted start → end period, duration (months), and status.
 *  Hand-rolled here instead of FleetEntityList so we can render a custom
 *  combined period cell (the user reported that the period dates weren't
 *  appearing as a clear range). */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { Calendar, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface FYRow {
  name: string;
  year?: string;
  year_start_date?: string;
  year_end_date?: string;
  disabled?: 0 | 1;
  auto_created?: 0 | 1;
}

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function fmtDate(d?: string) {
  if (!d) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return d;
  const day = parseInt(m[3], 10);
  const month = AR_MONTHS[parseInt(m[2], 10) - 1];
  const year = m[1];
  return `${day} ${month} ${year}`;
}

function monthsBetween(from?: string, to?: string): number {
  if (!from || !to) return 0;
  const a = new Date(from), b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
}

export default function Page() {
  return (
    <RequirePerm doctype="Fiscal Year" action="read">
      <PageShell
        title="السنوات المالية"
        subtitle="تعريف الفترات المحاسبية وتاريخ بدايتها ونهايتها"
        actions={
          <Link to="/accounting/fiscal-years/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
            <Plus size={16} /> سنة مالية جديدة
          </Link>
        }
      >
        <Body />
      </PageShell>
    </RequirePerm>
  );
}

function Body() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'' | '0' | '1'>('');

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (statusFilter !== '') f.push(['disabled', '=', Number(statusFilter)]);
    return f as any;
  }, [statusFilter]);

  const { data: rows, isLoading } = useFrappeGetDocList<FYRow>('Fiscal Year', {
    fields: ['name', 'year', 'year_start_date', 'year_end_date', 'disabled', 'auto_created'],
    filters,
    limit: 100,
    orderBy: { field: 'year_start_date', order: 'desc' },
  });

  // Find the row that contains today — drives the highlight.
  const today = new Date().toISOString().slice(0, 10);
  const currentName = useMemo(
    () => (rows ?? []).find((r) => r.year_start_date && r.year_end_date && r.year_start_date <= today && today <= r.year_end_date)?.name,
    [rows, today],
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg"
          >
            <option value="">كل الحالات</option>
            <option value="0">نشطة</option>
            <option value="1">مغلقة</option>
          </select>
          <div className="flex-1" />
          <span className="text-xs text-slate-500">{(rows ?? []).length} سنة مالية</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3 text-start">السنة المالية</th>
                <th className="px-5 py-3 text-start">الفترة</th>
                <th className="px-5 py-3 text-start">المدة</th>
                <th className="px-5 py-3 text-start">الحالة</th>
                <th className="px-5 py-3 text-start">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">جاري التحميل...</td></tr>
              )}
              {!isLoading && (rows ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">لا توجد سنوات مالية</td></tr>
              )}
              {(rows ?? []).map((r) => {
                const months = monthsBetween(r.year_start_date, r.year_end_date);
                const isCurrent = r.name === currentName;
                return (
                  <tr key={r.name} className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${isCurrent ? 'bg-emerald-50/40 dark:bg-emerald-500/5' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[color:var(--color-brand-600)]">{r.year ?? r.name}</span>
                        {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">الحالية</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <span>{fmtDate(r.year_start_date)}</span>
                        <span className="text-slate-400">←</span>
                        <span>{fmtDate(r.year_end_date)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {months > 0 ? `${months} شهر` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.disabled ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {r.disabled ? 'مغلقة' : 'نشطة'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/accounting/fiscal-years/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition" aria-label="edit"><Pencil size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
