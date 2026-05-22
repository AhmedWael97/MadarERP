/** تقرير الشيكات — Checks report matching reference 062_تقرير-الشيكات.png */
import { useMemo, useState } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { FileText, Search, FileDown } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface ChequeRow {
  name: string;
  cheque_number?: string;
  cheque_date?: string;
  due_date?: string;
  party?: string;
  party_type?: string;
  amount?: number;
  bank_name?: string;
  direction?: string;
  status?: string;
}

const DIRECTION_BADGE: Record<string, { label: string; cls: string }> = {
  Received: { label: 'مستلم', cls: 'bg-emerald-100 text-emerald-700' },
  Issued:   { label: 'صادر',  cls: 'bg-orange-100 text-orange-700' },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Pending:          { label: 'جديد',           cls: 'bg-blue-100 text-blue-700' },
  Deposited:        { label: 'تحت التحصيل',    cls: 'bg-amber-100 text-amber-700' },
  Cleared:          { label: 'محصّل',          cls: 'bg-emerald-100 text-emerald-700' },
  Bounced:          { label: 'مرجوع',          cls: 'bg-red-100 text-red-700' },
  Cancelled:        { label: 'ملغى',           cls: 'bg-slate-100 text-slate-600' },
  under_collection: { label: 'تحت التحصيل',   cls: 'bg-amber-100 text-amber-700' },
};

function fmtAmt(n?: number) {
  if (!n) return '0';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

function exportCSV(rows: ChequeRow[]) {
  const header = 'رقم الشيك,الإصدار,الاستحقاق,الجهة,المبلغ,البنك,النوع,الحالة';
  const lines = rows.map((r) =>
    [
      r.cheque_number ?? r.name,
      r.cheque_date ?? '',
      r.due_date ?? '',
      r.party ?? '',
      r.amount ?? 0,
      r.bank_name ?? '',
      DIRECTION_BADGE[r.direction ?? '']?.label ?? r.direction ?? '',
      STATUS_BADGE[r.status ?? '']?.label ?? r.status ?? '',
    ].join(','),
  );
  const blob = new Blob(['\uFEFF' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'checks-report.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Page() {
  return (
    <RequirePerm doctype="Madaar Cheque" action="read">
      <PageShell title="تقرير الشيكات" subtitle="حالة الشيكات ومواعيد الاستحقاق">
        <Body />
      </PageShell>
    </RequirePerm>
  );
}

function Body() {
  const [directionFilter, setDirectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [applied, setApplied] = useState({ direction: '', status: '' });

  function runReport() {
    setApplied({ direction: directionFilter, status: statusFilter });
  }

  const filters = useMemo(() => {
    const f: Array<[string, string, unknown]> = [];
    if (applied.direction) f.push(['direction', '=', applied.direction]);
    if (applied.status)    f.push(['status', '=', applied.status]);
    return f;
  }, [applied]);

  const { data: rows, isLoading } = useFrappeGetDocList<ChequeRow>('Madaar Cheque', {
    fields: ['name', 'cheque_number', 'cheque_date', 'due_date', 'party', 'party_type', 'amount', 'bank_name', 'direction', 'status'],
    filters: filters as any,
    limit: 500,
    orderBy: { field: 'cheque_date', order: 'desc' },
  });

  const data = rows ?? [];
  const totalReceived = data.filter((r) => r.direction === 'Received').reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalIssued   = data.filter((r) => r.direction === 'Issued').reduce((s, r) => s + (r.amount ?? 0), 0);

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

          {/* Direction */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">نوع الشيك</span>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className={INPUT_SM}
            >
              <option value="">الكل</option>
              <option value="Received">شيكات مستلمة</option>
              <option value="Issued">شيكات صادرة</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">الحالة</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={INPUT_SM}
            >
              <option value="">كل الحالات</option>
              <option value="Pending">جديد</option>
              <option value="Deposited">تحت التحصيل</option>
              <option value="Cleared">محصّل</option>
              <option value="Bounced">مرجوع</option>
              <option value="Cancelled">ملغى</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="شيكات مستلمة" value={`${fmtAmt(totalReceived)} ج.م`} color="emerald" />
        <StatCard label="شيكات صادرة"  value={`${fmtAmt(totalIssued)} ج.م`}   color="orange" />
        <StatCard label="العدد"         value={String(data.length)}             color="slate" />
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
                  {['رقم الشيك', 'الإصدار', 'الاستحقاق', 'الجهة', 'المبلغ', 'البنك', 'النوع', 'الحالة'].map((h) => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.map((r) => {
                  const dirBadge = DIRECTION_BADGE[r.direction ?? ''];
                  const stBadge  = STATUS_BADGE[r.status ?? ''];
                  return (
                    <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {r.cheque_number ?? r.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">{r.cheque_date ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">{r.due_date ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.party ?? '—'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-white">{fmtAmt(r.amount)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.bank_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        {dirBadge ? (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${dirBadge.cls}`}>
                            {dirBadge.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">{r.direction ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {stBadge ? (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${stBadge.cls}`}>
                            {stBadge.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">{r.status ?? '—'}</span>
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

function StatCard({ label, value, color }: { label: string; value: string; color: 'emerald' | 'orange' | 'slate' }) {
  const clsMap = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400',
    orange:  'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/30 text-orange-700 dark:text-orange-400',
    slate:   'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-700 dark:text-slate-300',
  };
  return (
    <div className={`rounded-2xl border p-4 ${clsMap[color]}`}>
      <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold font-mono">{value}</p>
    </div>
  );
}
