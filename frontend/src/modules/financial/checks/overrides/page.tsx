/** الشيكات — Cheques list matching reference 051_الشيكات.png */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { Plus, Eye, FileDown, FileText, BarChart2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface ChequeRow {
  name: string;
  direction?: string;
  status?: string;
  cheque_number?: string;
  cheque_date?: string;
  due_date?: string;
  party_type?: string;
  party?: string;
  bank_name?: string;
  amount?: number;
  currency?: string;
  docstatus?: number;
}

const DIRECTION_LABEL: Record<string, string> = {
  Received: 'شيك مستلم',
  Issued: 'شيك صادر',
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Pending:          { label: 'جديد',            cls: 'bg-blue-100 text-blue-700' },
  Deposited:        { label: 'تحت التحصيل',     cls: 'bg-amber-100 text-amber-700' },
  Cleared:          { label: 'محصّل',           cls: 'bg-emerald-100 text-emerald-700' },
  Bounced:          { label: 'مرجوع',           cls: 'bg-red-100 text-red-700' },
  Cancelled:        { label: 'ملغى',            cls: 'bg-slate-100 text-slate-600' },
  under_collection: { label: 'under_collection', cls: 'bg-slate-100 text-slate-600' },
};

function fmtAmt(n?: number) {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

function exportCSV(rows: ChequeRow[]) {
  const header = 'رقم الشيك,النوع,تاريخ الإصدار,الاستحقاق,البنك,المبلغ,الحالة';
  const lines = rows.map((r) =>
    [r.cheque_number ?? r.name, DIRECTION_LABEL[r.direction ?? ''] ?? r.direction ?? '', r.cheque_date ?? '', r.due_date ?? '', r.bank_name ?? '', r.amount ?? 0, STATUS_BADGE[r.status ?? '']?.label ?? r.status ?? ''].join(','),
  );
  const blob = new Blob(['\uFEFF' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'cheques.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Page() {
  return (
    <RequirePerm doctype="Madaar Cheque" action="read">
      <PageShell
        title="الشيكات"
        subtitle="إدارة الشيكات المستلمة والصادرة"
        actions={
          <Link to="/financial/checks/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
            <Plus size={16} /> شيك جديد
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
  const [directionFilter, setDirectionFilter] = useState<'' | 'Received' | 'Issued'>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filters = useMemo(() => {
    const f: Array<[string, string, unknown]> = [];
    if (directionFilter) f.push(['direction', '=', directionFilter]);
    if (statusFilter) f.push(['status', '=', statusFilter]);
    if (fromDate) f.push(['cheque_date', '>=', fromDate]);
    if (toDate) f.push(['cheque_date', '<=', toDate]);
    return f;
  }, [directionFilter, statusFilter, fromDate, toDate]);

  const { data: rows, isLoading } = useFrappeGetDocList<ChequeRow>('Madaar Cheque', {
    fields: ['name', 'direction', 'status', 'cheque_number', 'cheque_date', 'due_date', 'party_type', 'party', 'bank_name', 'amount', 'currency', 'docstatus'],
    filters: filters as any,
    limit: 200,
    orderBy: { field: 'cheque_date', order: 'desc' },
  });

  return (
    <div className="space-y-4">
      {/* Direction toggle + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 text-sm font-semibold">
          {(['', 'Received', 'Issued'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirectionFilter(d)}
              className={`px-4 py-2 transition-colors ${directionFilter === d ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
            >
              {d === '' ? 'الكل' : d === 'Received' ? 'مستلمة' : 'صادرة'}
            </button>
          ))}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl" title="من تاريخ" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl" title="إلى تاريخ" />
        <div className="flex-1" />
        <button onClick={() => exportCSV(rows ?? [])} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all">
          <FileDown size={15} /> تحميل Excel
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all">
          <FileText size={15} /> تحميل PDF
        </button>
        <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition-all">
          <BarChart2 size={15} /> تصدير البيانات
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3 text-start">رقم الشيك</th>
                <th className="px-5 py-3 text-start">النوع</th>
                <th className="px-5 py-3 text-start">تاريخ الإصدار</th>
                <th className="px-5 py-3 text-start">الاستحقاق</th>
                <th className="px-5 py-3 text-start">البنك</th>
                <th className="px-5 py-3 text-start">المبلغ</th>
                <th className="px-5 py-3 text-start">الحالة</th>
                <th className="px-5 py-3 text-start">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">جاري التحميل...</td></tr>
              )}
              {!isLoading && (rows ?? []).length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">لا توجد شيكات</td></tr>
              )}
              {(rows ?? []).map((r) => {
                const st = STATUS_BADGE[r.status ?? ''] ?? { label: r.status ?? '—', cls: 'bg-slate-100 text-slate-600' };
                const dirLabel = DIRECTION_LABEL[r.direction ?? ''] ?? r.direction ?? '—';
                const isReceived = r.direction === 'Received';
                return (
                  <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{r.cheque_number ?? r.name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isReceived ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{dirLabel}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.cheque_date ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.due_date ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-800 dark:text-white">{r.bank_name ?? '—'}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-slate-800 dark:text-white">{fmtAmt(r.amount)}</td>
                    <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span></td>
                    <td className="px-5 py-3">
                      <button onClick={() => navigate(`/financial/checks/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-indigo-600 transition-all">
                        <Eye size={16} />
                      </button>
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
