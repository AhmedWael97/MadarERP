/** تقرير السندات — Vouchers (Payment Entry) report matching reference 063_تقرير-السندات.png */
import { useMemo, useState } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { FileText, Search, FileDown } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface PERow {
  name: string;
  posting_date?: string;
  payment_type?: string;
  paid_amount?: number;
  mode_of_payment?: string;
  remarks?: string;
  custom_payee_name?: string;
  party?: string;
  docstatus?: number;
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  Receive: { label: 'سند قبض', cls: 'bg-emerald-100 text-emerald-700' },
  Pay:     { label: 'سند صرف', cls: 'bg-red-100 text-red-700' },
};

const STATUS_BADGE: Record<number, { label: string; cls: string }> = {
  0: { label: 'مسودة',  cls: 'bg-amber-100 text-amber-700' },
  1: { label: 'معتمد',  cls: 'bg-emerald-100 text-emerald-700' },
  2: { label: 'ملغى',   cls: 'bg-red-100 text-red-700' },
};

function fmtAmt(n?: number) {
  if (!n) return '0';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

function exportCSV(rows: PERow[]) {
  const header = 'رقم السند,التاريخ,النوع,المبلغ,طريقة الدفع,البيان,الحالة';
  const lines = rows.map((r) =>
    [
      r.name,
      r.posting_date ?? '',
      TYPE_BADGE[r.payment_type ?? '']?.label ?? r.payment_type ?? '',
      r.paid_amount ?? 0,
      r.mode_of_payment ?? '',
      r.remarks ?? (r.custom_payee_name || r.party || ''),
      STATUS_BADGE[r.docstatus ?? 0]?.label ?? '',
    ].join(','),
  );
  const blob = new Blob(['\uFEFF' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'vouchers-report.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Page() {
  return (
    <RequirePerm doctype="Payment Entry" action="read">
      <PageShell title="تقرير السندات" subtitle="سندات القبض والصرف">
        <Body />
      </PageShell>
    </RequirePerm>
  );
}

function Body() {
  const today = new Date().toISOString().slice(0, 10);
  const [typeFilter, setTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(today);
  const [applied, setApplied] = useState({ type: '', from: '', to: today });

  function runReport() {
    setApplied({ type: typeFilter, from: fromDate, to: toDate });
  }

  const filters = useMemo(() => {
    const f: Array<[string, string, unknown]> = [];
    if (applied.type) f.push(['payment_type', '=', applied.type]);
    if (applied.from) f.push(['posting_date', '>=', applied.from]);
    if (applied.to)   f.push(['posting_date', '<=', applied.to]);
    return f;
  }, [applied]);

  const { data: rows, isLoading } = useFrappeGetDocList<PERow>('Payment Entry', {
    fields: ['name', 'posting_date', 'payment_type', 'paid_amount', 'mode_of_payment', 'remarks', 'custom_payee_name', 'party', 'docstatus'],
    filters: filters as any,
    limit: 500,
    orderBy: { field: 'posting_date', order: 'desc' },
  });

  const data = rows ?? [];
  const totalReceive = data.filter((r) => r.payment_type === 'Receive').reduce((s, r) => s + (r.paid_amount ?? 0), 0);
  const totalPay = data.filter((r) => r.payment_type === 'Pay').reduce((s, r) => s + (r.paid_amount ?? 0), 0);
  const net = totalReceive - totalPay;

  const INPUT_SM = 'px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all';

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Export / Run */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <FileText size={15} /> PDF
          </button>
          <button
            type="button"
            onClick={() => exportCSV(data)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <FileDown size={15} /> Excel
          </button>
          <button
            type="button"
            onClick={runReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Search size={15} /> عرض
          </button>

          <div className="flex-1" />

          {/* Type */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">نوع السند</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={INPUT_SM}
            >
              <option value="">الكل</option>
              <option value="Receive">سند قبض</option>
              <option value="Pay">سند صرف</option>
            </select>
          </div>

          {/* From date */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">من تاريخ</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={INPUT_SM} />
          </div>

          {/* To date */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">إلى تاريخ</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={INPUT_SM} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي القبض" value={`${fmtAmt(totalReceive)} ج.م`} color="emerald" />
        <StatCard label="إجمالي الصرف" value={`${fmtAmt(totalPay)} ج.م`} color="red" />
        <StatCard label="الصافي" value={`${fmtAmt(Math.abs(net))} ج.م`} color={net >= 0 ? 'emerald' : 'red'} />
        <StatCard label="العدد" value={String(data.length)} color="slate" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">جارٍ التحميل...</div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">لا توجد بيانات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  {['رقم السند', 'التاريخ', 'النوع', 'المبلغ', 'طريقة الدفع', 'البيان', 'الحالة'].map((h) => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.map((r) => {
                  const typeBadge = TYPE_BADGE[r.payment_type ?? ''];
                  const statusBadge = STATUS_BADGE[r.docstatus ?? 0];
                  const description = r.remarks || r.custom_payee_name || r.party || '—';
                  return (
                    <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{r.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">{r.posting_date ?? '—'}</td>
                      <td className="px-4 py-3">
                        {typeBadge ? (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${typeBadge.cls}`}>
                            {typeBadge.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">{r.payment_type ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-white">{fmtAmt(r.paid_amount)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.mode_of_payment ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-50 truncate">{description}</td>
                      <td className="px-4 py-3">
                        {statusBadge && (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusBadge.cls}`}>
                            {statusBadge.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: 'emerald' | 'red' | 'slate' }) {
  const clsMap = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400',
    red:     'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30 text-red-700 dark:text-red-400',
    slate:   'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-700 dark:text-slate-300',
  };
  return (
    <div className={`rounded-2xl border p-4 ${clsMap[color]}`}>
      <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold font-mono">{value}</p>
    </div>
  );
}
