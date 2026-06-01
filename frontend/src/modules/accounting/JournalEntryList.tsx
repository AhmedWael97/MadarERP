/** Accounting entries list — queries GL Entry (all accounting vouchers: Sales Invoice,
 *  Purchase Invoice, Journal Entry, Payment Entry, Stock Entry, etc.).
 *  Also shows draft Journal Entry records (docstatus=0) in a dedicated panel. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeGetDocCount, useFrappeGetDocList } from 'frappe-react-sdk';
import { FileText, FileCheck2, FileClock, FilePen, Plus, Search } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface GLERow {
  name: string;
  posting_date?: string;
  voucher_type?: string;
  voucher_no?: string;
  account?: string;
  debit?: number;
  credit?: number;
  remarks?: string;
  is_cancelled?: 0 | 1;
}

// Map voucher_type → Arabic display label
const VOUCHER_LABEL: Record<string, string> = {
  'Journal Entry':     'قيد يومية',
  'Sales Invoice':     'فاتورة مبيعات',
  'Purchase Invoice':  'فاتورة مشتريات',
  'Payment Entry':     'سند دفع/قبض',
  'Stock Entry':       'حركة مخزون',
  'Delivery Note':     'إذن تسليم',
  'Purchase Receipt':  'إذن استلام',
  'Credit Note':       'إشعار دائن',
  'Debit Note':        'إشعار مدين',
};

// Map voucher_type → badge CSS
const VOUCHER_BADGE: Record<string, string> = {
  'Journal Entry':    'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'Sales Invoice':    'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  'Purchase Invoice': 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
  'Payment Entry':    'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  'Stock Entry':      'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300',
};

// Map voucher_type → frontend route prefix (for row click navigation)
const VOUCHER_ROUTE: Record<string, string> = {
  'Journal Entry':    '/accounting/journal-entries',
  'Sales Invoice':    '/sales/invoices',
  'Purchase Invoice': '/purchases/invoices',
  'Payment Entry':    '/financial/receipt-vouchers',
};

const STATUS_BADGE = {
  active:    { label: 'نشط',  cls: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  cancelled: { label: 'ملغى', cls: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' },
};

export default function JournalEntryListPage() {
  return (
    <RequirePerm doctype="GL Entry" action="read">
      <PageShell
        title="القيود اليومية"
        subtitle="جميع الحركات المحاسبية: فواتير مبيعات، مشتريات، قيود، مدفوعات"
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

// Source filter options — filter by voucher_type
type SourceKey = '' | 'sales' | 'purchase' | 'journal' | 'payment' | 'stock';
const SOURCE_LABEL: Record<SourceKey, string> = {
  '':         'كل المصادر',
  'sales':    'فواتير المبيعات',
  'purchase': 'فواتير المشتريات',
  'journal':  'قيود اليومية',
  'payment':  'سندات الدفع/القبض',
  'stock':    'حركات المخزون',
};
const SOURCE_FILTER: Record<Exclude<SourceKey, ''>, Array<any>> = {
  'sales':    [['voucher_type', '=', 'Sales Invoice']],
  'purchase': [['voucher_type', '=', 'Purchase Invoice']],
  'journal':  [['voucher_type', '=', 'Journal Entry']],
  'payment':  [['voucher_type', '=', 'Payment Entry']],
  'stock':    [['voucher_type', 'in', ['Stock Entry', 'Delivery Note', 'Purchase Receipt']]],
};

interface JEDraftRow {
  name: string;
  posting_date?: string;
  user_remark?: string;
  total_debit?: number;
  total_credit?: number;
}

/** Panel showing unsubmitted Journal Entry drafts. */
function DraftsPanel() {
  const navigate = useNavigate();
  const { data: drafts, isLoading } = useFrappeGetDocList<JEDraftRow>('Journal Entry', {
    fields: ['name', 'posting_date', 'user_remark', 'total_debit', 'total_credit'],
    filters: [['docstatus', '=', 0]],
    limit: 50,
    orderBy: { field: 'modified', order: 'desc' },
  });

  if (!isLoading && (!drafts || drafts.length === 0)) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-200 dark:border-amber-500/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-amber-200 dark:border-amber-500/20 flex items-center gap-2">
        <FilePen size={16} className="text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">مسودات القيود اليدوية</span>
        {drafts && <span className="text-xs font-semibold bg-amber-200 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">{drafts.length}</span>}
      </div>
      {isLoading ? (
        <p className="px-5 py-4 text-sm text-slate-400">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-amber-600 dark:text-amber-400">
                <th className="px-5 py-2 text-start">رقم القيد</th>
                <th className="px-5 py-2 text-start">التاريخ</th>
                <th className="px-5 py-2 text-start">البيان</th>
                <th className="px-5 py-2 text-end">إجمالي مدين</th>
                <th className="px-5 py-2 text-end">إجمالي دائن</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 dark:divide-amber-500/10">
              {(drafts ?? []).map((je) => (
                <tr key={je.name} className="hover:bg-amber-100/50 dark:hover:bg-amber-500/10 cursor-pointer" onClick={() => navigate(`/accounting/journal-entries/${encodeURIComponent(je.name)}`)}>
                  <td className="px-5 py-2 font-mono font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">{je.name}</td>
                  <td className="px-5 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">{je.posting_date ?? '—'}</td>
                  <td className="px-5 py-2 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">{je.user_remark || '—'}</td>
                  <td className="px-5 py-2 text-end font-mono text-emerald-700 dark:text-emerald-400">{je.total_debit ? fmtNum(je.total_debit) : '—'}</td>
                  <td className="px-5 py-2 text-end font-mono text-red-600 dark:text-red-400">{je.total_credit ? fmtNum(je.total_credit) : '—'}</td>
                  <td className="px-5 py-2 text-end">
                    <Link
                      to={`/accounting/journal-entries/${encodeURIComponent(je.name)}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold text-amber-600 hover:underline"
                    >
                      تعديل
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Body() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'cancelled'>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [source, setSource] = useState<SourceKey>('');

  const { data: total }     = useFrappeGetDocCount('GL Entry');
  const { data: active }    = useFrappeGetDocCount('GL Entry', [['is_cancelled', '=', 0]]);
  const { data: cancelled } = useFrappeGetDocCount('GL Entry', [['is_cancelled', '=', 1]]);
  const { data: draftCount } = useFrappeGetDocCount('Journal Entry', [['docstatus', '=', 0]]);

  const filters = useMemo(() => {
    const f: Array<any> = [];
    if (search.trim()) f.push(['voucher_no', 'like', `%${search.trim()}%`]);
    if (status === 'active')    f.push(['is_cancelled', '=', 0]);
    if (status === 'cancelled') f.push(['is_cancelled', '=', 1]);
    if (fromDate) f.push(['posting_date', '>=', fromDate]);
    if (toDate)   f.push(['posting_date', '<=', toDate]);
    if (source && source in SOURCE_FILTER) {
      for (const sf of SOURCE_FILTER[source as Exclude<SourceKey, ''>]) f.push(sf);
    }
    return f as any;
  }, [search, status, fromDate, toDate, source]);

  const { data: rows, isLoading } = useFrappeGetDocList<GLERow>('GL Entry', {
    fields: ['name', 'posting_date', 'voucher_type', 'voucher_no', 'account', 'debit', 'credit', 'remarks', 'is_cancelled'],
    filters,
    limit: 100,
    orderBy: { field: 'posting_date', order: 'desc' },
  });

  const toolbarColumns: ToolbarColumn[] = useMemo(() => [
    { id: 'voucher_no',    header: 'المستند' },
    { id: 'voucher_type',  header: 'النوع' },
    { id: 'posting_date',  header: 'التاريخ' },
    { id: 'account',       header: 'الحساب' },
    { id: 'debit',         header: 'المدين' },
    { id: 'credit',        header: 'الدائن' },
    { id: 'is_cancelled',  header: 'الحالة' },
  ], []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(toolbarColumns.filter((c) => !hidden.has(c.id)).map((c) => c.id)), [toolbarColumns, hidden]);
  const hide = (id: string) => hidden.has(id);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="إجمالي القيود"  value={Number(total ?? 0)}      icon={<FileText size={20} />}    color="brand" />
        <Stat label="نشطة"           value={Number(active ?? 0)}     icon={<FileCheck2 size={20} />}  color="emerald" />
        <Stat label="ملغاة"          value={Number(cancelled ?? 0)}  icon={<FileClock size={20} />}   color="red" />
        <Stat label="مسودات يدوية"   value={Number(draftCount ?? 0)} icon={<FilePen size={20} />}     color="amber" />
      </div>

      {/* Draft Journal Entries panel */}
      <DraftsPanel />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث برقم المستند..." className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-32 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="cancelled">ملغى</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          <input type="date" value={toDate}   onChange={(e) => setToDate(e.target.value)}   className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          <select value={source} onChange={(e) => setSource(e.target.value as SourceKey)} className="px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" title="المصدر">
            {(Object.keys(SOURCE_LABEL) as SourceKey[]).map((k) => (
              <option key={k} value={k}>{SOURCE_LABEL[k]}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTableToolbar
        doctype="GL Entry"
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
                {!hide('voucher_no')   && <Th>المستند</Th>}
                {!hide('voucher_type') && <Th>النوع</Th>}
                {!hide('posting_date') && <Th>التاريخ</Th>}
                {!hide('account')      && <Th>الحساب</Th>}
                {!hide('debit')        && <Th>المدين</Th>}
                {!hide('credit')       && <Th>الدائن</Th>}
                {!hide('is_cancelled') && <Th>الحالة</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (<tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!isLoading && (rows ?? []).length === 0 && (<tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد قيود</td></tr>)}
              {(rows ?? []).map((gle) => {
                const isCancelled = gle.is_cancelled === 1;
                const s = isCancelled ? STATUS_BADGE.cancelled : STATUS_BADGE.active;
                const voucherBadgeCls = VOUCHER_BADGE[gle.voucher_type ?? ''] ?? 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-300';
                const voucherLabel = VOUCHER_LABEL[gle.voucher_type ?? ''] ?? gle.voucher_type ?? '—';
                const route = gle.voucher_type && gle.voucher_no && VOUCHER_ROUTE[gle.voucher_type]
                  ? `${VOUCHER_ROUTE[gle.voucher_type]}/${encodeURIComponent(gle.voucher_no)}`
                  : null;
                return (
                  <tr
                    key={gle.name}
                    onClick={() => route && navigate(route)}
                    className={`transition-colors ${route ? 'hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer' : ''}`}
                  >
                    {!hide('voucher_no')   && <td className="px-5 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] whitespace-nowrap">{gle.voucher_no ?? '—'}</td>}
                    {!hide('voucher_type') && <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${voucherBadgeCls}`}>{voucherLabel}</span></td>}
                    {!hide('posting_date') && <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{gle.posting_date ?? '—'}</td>}
                    {!hide('account')      && <td className="px-5 py-3 text-sm text-slate-800 dark:text-white max-w-[260px] truncate">{gle.account ?? '—'}</td>}
                    {!hide('debit')        && <td className="px-5 py-3 text-sm font-mono text-emerald-700 dark:text-emerald-400">{gle.debit ? fmtNum(gle.debit) : '—'}</td>}
                    {!hide('credit')       && <td className="px-5 py-3 text-sm font-mono text-red-600 dark:text-red-400">{gle.credit ? fmtNum(gle.credit) : '—'}</td>}
                    {!hide('is_cancelled') && (
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
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

function Stat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'brand' | 'emerald' | 'red' | 'amber' }) {
  const cls = { brand: 'bg-[color:var(--color-brand-100,#d1fae5)] text-[color:var(--color-brand-600)]', emerald: 'bg-emerald-100 text-emerald-600', red: 'bg-red-100 text-red-600', amber: 'bg-amber-100 text-amber-600' }[color];
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
