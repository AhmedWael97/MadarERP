/** Journal Entry list — matches reference `journal-entries/index.blade.php`.
 *  Stats row + date-range filter + colored status pills + clickable rows. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeGetDocCount, useFrappeGetDocList } from 'frappe-react-sdk';
import { FileText, FileCheck2, FileClock, FileWarning, Plus, Search } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface JERow {
  name: string;
  posting_date?: string;
  user_remark?: string;
  total_debit?: number;
  total_credit?: number;
  docstatus?: 0 | 1 | 2;
  voucher_type?: string;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: 'مسودة', cls: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  posted: { label: 'مرحّل', cls: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  cancelled: { label: 'ملغى', cls: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' },
};

export default function JournalEntryListPage() {
  return (
    <RequirePerm doctype="Journal Entry" action="read">
      <PageShell
        title="القيود اليومية"
        subtitle="إدارة القيود المحاسبية اليدوية والتلقائية"
        actions={
          <Link to="/accounting/journal-entries/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
            <Plus size={16} /> قيد جديد
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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'draft' | 'posted' | 'cancelled'>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [voucherType, setVoucherType] = useState('');

  const { data: total } = useFrappeGetDocCount('Journal Entry');
  const { data: draft } = useFrappeGetDocCount('Journal Entry', [['docstatus', '=', 0]]);
  const { data: posted } = useFrappeGetDocCount('Journal Entry', [['docstatus', '=', 1]]);
  const { data: cancelled } = useFrappeGetDocCount('Journal Entry', [['docstatus', '=', 2]]);

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (search.trim()) f.push(['user_remark', 'like', `%${search.trim()}%`]);
    if (status === 'draft') f.push(['docstatus', '=', 0]);
    if (status === 'posted') f.push(['docstatus', '=', 1]);
    if (status === 'cancelled') f.push(['docstatus', '=', 2]);
    if (fromDate) f.push(['posting_date', '>=', fromDate]);
    if (toDate) f.push(['posting_date', '<=', toDate]);
    if (voucherType) f.push(['voucher_type', '=', voucherType]);
    return f as any;
  }, [search, status, fromDate, toDate, voucherType]);

  const { data: rows, isLoading } = useFrappeGetDocList<JERow>('Journal Entry', {
    fields: ['name', 'posting_date', 'user_remark', 'total_debit', 'total_credit', 'docstatus', 'voucher_type'],
    filters,
    limit: 100,
    orderBy: { field: 'posting_date', order: 'desc' },
  });

  const toolbarColumns: ToolbarColumn[] = useMemo(() => [
    { id: 'name', header: 'رقم القيد' },
    { id: 'posting_date', header: 'التاريخ' },
    { id: 'user_remark', header: 'الوصف' },
    { id: 'total_debit', header: 'المدين' },
    { id: 'total_credit', header: 'الدائن' },
    { id: 'docstatus', header: 'الحالة' },
  ], []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(toolbarColumns.filter((c) => !hidden.has(c.id)).map((c) => c.id)), [toolbarColumns, hidden]);
  const hide = (id: string) => hidden.has(id);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="إجمالي القيود" value={Number(total ?? 0)} icon={<FileText size={20} />} color="brand" />
        <Stat label="مسودات" value={Number(draft ?? 0)} icon={<FileWarning size={20} />} color="amber" />
        <Stat label="مرحّلة" value={Number(posted ?? 0)} icon={<FileCheck2 size={20} />} color="emerald" />
        <Stat label="ملغاة" value={Number(cancelled ?? 0)} icon={<FileClock size={20} />} color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث برقم أو وصف القيد..." className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-32 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
            <option value="">كل الحالات</option>
            <option value="draft">مسودة</option>
            <option value="posted">مرحّل</option>
            <option value="cancelled">ملغى</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" placeholder="من تاريخ" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" placeholder="إلى تاريخ" />
          <select value={voucherType} onChange={(e) => setVoucherType(e.target.value)} className="px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
            <option value="">كل الأنواع</option>
            <option value="Journal Entry">قيد يدوي</option>
            <option value="Sales Invoice">مبيعات</option>
            <option value="Purchase Invoice">مشتريات</option>
            <option value="Payment Entry">سند دفع / قبض</option>
            <option value="Credit Note">إشعار دائن</option>
            <option value="Debit Note">إشعار مدين</option>
          </select>
        </div>
      </div>

      <DataTableToolbar
        doctype="Journal Entry"
        columns={toolbarColumns}
        rows={(rows ?? []) as unknown as Array<Record<string, unknown>>}
        visibleColumnIds={visibleIds}
        onVisibleColumnsChange={(next) => {
          const all = toolbarColumns.map((c) => c.id);
          setHidden(new Set(all.filter((id) => !next.has(id))));
        }}
      />

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {!hide('name') && <Th>رقم القيد</Th>}
                {!hide('posting_date') && <Th>التاريخ</Th>}
                {!hide('user_remark') && <Th>الوصف</Th>}
                {!hide('total_debit') && <Th>المدين</Th>}
                {!hide('total_credit') && <Th>الدائن</Th>}
                {!hide('docstatus') && <Th>الحالة</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (<tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!isLoading && (rows ?? []).length === 0 && (<tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد قيود</td></tr>)}
              {(rows ?? []).map((je) => {
                const s = je.docstatus === 1 ? 'posted' : je.docstatus === 2 ? 'cancelled' : 'draft';
                return (
                  <tr
                    key={je.name}
                    onClick={() => navigate(`/accounting/journal-entries/${encodeURIComponent(je.name)}`)}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    {!hide('name') && <td className="px-5 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">{je.name}</td>}
                    {!hide('posting_date') && <td className="px-5 py-3 text-sm text-slate-600">{je.posting_date ?? '—'}</td>}
                    {!hide('user_remark') && <td className="px-5 py-3 text-sm text-slate-800 dark:text-white max-w-[300px] truncate">{je.user_remark ?? '—'}</td>}
                    {!hide('total_debit') && <td className="px-5 py-3 text-sm font-mono">{fmtNum(je.total_debit ?? 0)}</td>}
                    {!hide('total_credit') && <td className="px-5 py-3 text-sm font-mono">{fmtNum(je.total_credit ?? 0)}</td>}
                    {!hide('docstatus') && (
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[s].cls}`}>{STATUS_BADGE[s].label}</span>
                      </td>
                    )}
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

function Stat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'brand' | 'emerald' | 'amber' | 'red' }) {
  const cls = { brand: 'bg-[color:var(--color-brand-100,#d1fae5)] text-[color:var(--color-brand-600)]', emerald: 'bg-emerald-100 text-emerald-600', amber: 'bg-amber-100 text-amber-600', red: 'bg-red-100 text-red-600' }[color];
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-4 text-center">
      <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${cls} flex items-center justify-center`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value.toLocaleString('en-US')}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-5 py-3 text-start whitespace-nowrap">{children}</th>;
}
function fmtNum(n: number): string {
  try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); } catch { return String(n); }
}
