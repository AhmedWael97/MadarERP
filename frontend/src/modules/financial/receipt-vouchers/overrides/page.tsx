/** Receipt Vouchers (سندات القبض) list — with filters and export buttons */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { Plus, Search, Eye, FileDown, FileText } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface PERow {
  name: string;
  posting_date?: string;
  party_type?: string;
  party?: string;
  custom_payee_name?: string;
  paid_amount?: number;
  mode_of_payment?: string;
  docstatus?: number;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  '0': { label: 'مسودة', cls: 'bg-amber-100 text-amber-700' },
  '1': { label: 'مرحّل', cls: 'bg-emerald-100 text-emerald-700' },
  '2': { label: 'ملغى', cls: 'bg-red-100 text-red-700' },
};

function fmtAmt(n?: number) {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

function exportCSV(rows: PERow[]) {
  const header = 'رقم السند,التاريخ,العميل / المستلم منه,المبلغ,طريقة الدفع,الحالة';
  const lines = rows.map((r) =>
    [r.name, r.posting_date ?? '', r.custom_payee_name || r.party || '—', r.paid_amount ?? 0, r.mode_of_payment ?? '', STATUS[String(r.docstatus ?? 0)]?.label ?? ''].join(','),
  );
  const blob = new Blob(['\uFEFF' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'receipt-vouchers.csv'; a.click();
  URL.revokeObjectURL(url);
}

function printPDF() { window.print(); }

export default function Page() {
  return (
    <RequirePerm doctype="Payment Entry" action="read">
      <PageShell
        title="سندات القبض"
        subtitle="إدارة سندات القبض وتسجيل المدفوعات الواردة"
        actions={
          <Link to="/financial/receipt-vouchers/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
            <Plus size={16} /> سند قبض جديد
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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [mop, setMop] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');

  const filters = useMemo(() => {
    const f: Array<[string, string, unknown]> = [['payment_type', '=', 'Receive']];
    if (fromDate) f.push(['posting_date', '>=', fromDate]);
    if (toDate) f.push(['posting_date', '<=', toDate]);
    if (mop) f.push(['mode_of_payment', '=', mop]);
    if (statusFilter !== '') f.push(['docstatus', '=', Number(statusFilter)]);
    if (partyTypeFilter) f.push(['party_type', '=', partyTypeFilter]);
    if (partyFilter) f.push(['party', '=', partyFilter]);
    return f;
  }, [fromDate, toDate, mop, statusFilter, partyTypeFilter, partyFilter]);

  const { data: rows, isLoading } = useFrappeGetDocList<PERow>('Payment Entry', {
    fields: ['name', 'posting_date', 'party_type', 'party', 'custom_payee_name', 'paid_amount', 'mode_of_payment', 'docstatus'],
    filters: filters as any,
    limit: 200,
    orderBy: { field: 'posting_date', order: 'desc' },
  });

  const { data: mopList } = useFrappeGetDocList<{ name: string }>('Mode of Payment', { fields: ['name'], limit: 50 });
  // Party dropdowns — only populated for the chosen partyTypeFilter to keep
  // the list short and the UI dynamic.
  const { data: customers } = useFrappeGetDocList<{ name: string; customer_name?: string }>(
    'Customer',
    { fields: ['name', 'customer_name'], limit: 300 },
    partyTypeFilter === 'Customer' ? undefined : null,
  );
  const { data: suppliers } = useFrappeGetDocList<{ name: string; supplier_name?: string }>(
    'Supplier',
    { fields: ['name', 'supplier_name'], limit: 300 },
    partyTypeFilter === 'Supplier' ? undefined : null,
  );
  const { data: employees } = useFrappeGetDocList<{ name: string; employee_name?: string }>(
    'Employee',
    { fields: ['name', 'employee_name'], limit: 300 },
    partyTypeFilter === 'Employee' ? undefined : null,
  );
  const partyOpts =
    partyTypeFilter === 'Customer' ? (customers ?? []).map((c) => ({ v: c.name, l: c.customer_name ?? c.name }))
    : partyTypeFilter === 'Supplier' ? (suppliers ?? []).map((s) => ({ v: s.name, l: s.supplier_name ?? s.name }))
    : partyTypeFilter === 'Employee' ? (employees ?? []).map((e) => ({ v: e.name, l: e.employee_name ?? e.name }))
    : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows ?? [];
    return (rows ?? []).filter(
      (r) => r.name.toLowerCase().includes(q) || (r.party ?? '').toLowerCase().includes(q) || (r.custom_payee_name ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 p-3 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث برقم السند أو الجهة..." className="w-full ps-3 pe-9 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg" />
          </div>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg" title="من تاريخ" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg" title="إلى تاريخ" />
          <select value={mop} onChange={(e) => setMop(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
            <option value="">كل طرق الدفع</option>
            {(mopList ?? []).map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
            <option value="">كل الحالات</option>
            <option value="0">مسودة</option>
            <option value="1">مرحّل</option>
            <option value="2">ملغى</option>
          </select>
          <select
            value={partyTypeFilter}
            onChange={(e) => { setPartyTypeFilter(e.target.value); setPartyFilter(''); }}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg"
            title="نوع الجهة"
          >
            <option value="">كل الجهات</option>
            <option value="Customer">عملاء</option>
            <option value="Supplier">موردين</option>
            <option value="Employee">موظفين</option>
          </select>
          {partyTypeFilter && (
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg min-w-[180px]"
              title="الجهة"
            >
              <option value="">— الكل —</option>
              {partyOpts.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Export bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{filtered.length} سند</span>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(filtered)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all">
            <FileDown size={15} /> تحميل Excel
          </button>
          <button onClick={printPDF} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all">
            <FileText size={15} /> تحميل PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3 text-start">رقم السند</th>
                <th className="px-5 py-3 text-start">التاريخ</th>
                <th className="px-5 py-3 text-start">العميل / المستلم منه</th>
                <th className="px-5 py-3 text-start">المبلغ</th>
                <th className="px-5 py-3 text-start">طريقة الدفع</th>
                <th className="px-5 py-3 text-start">الحالة</th>
                <th className="px-5 py-3 text-start">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">جاري التحميل...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">لا توجد سندات</td></tr>
              )}
              {filtered.map((r) => {
                const st = STATUS[String(r.docstatus ?? 0)] ?? STATUS['0'];
                const party = r.custom_payee_name || r.party || '—';
                return (
                  <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{r.name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.posting_date ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-800 dark:text-white">{party}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-emerald-600">{fmtAmt(r.paid_amount)}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.mode_of_payment ?? '—'}</td>
                    <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span></td>
                    <td className="px-5 py-3">
                      <button onClick={() => navigate(`/financial/receipt-vouchers/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-indigo-600 transition-all">
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
