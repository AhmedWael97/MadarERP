/** Payment Vouchers (سندات الصرف) list — filter card + totals + auto-refresh. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { ArrowUpFromLine, Calendar, CreditCard, Eye, FileDown, FileText, Filter, Plus, RefreshCcw, Search, TrendingDown, Users, X } from 'lucide-react';
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
  if (!n) return '0';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

function exportCSV(rows: PERow[]) {
  const header = 'رقم السند,التاريخ,المورد / المصروف إليه,المبلغ,طريقة الدفع,الحالة';
  const lines = rows.map((r) =>
    [r.name, r.posting_date ?? '', r.custom_payee_name || r.party || '—', r.paid_amount ?? 0, r.mode_of_payment ?? '', STATUS[String(r.docstatus ?? 0)]?.label ?? ''].join(','),
  );
  const blob = new Blob(['﻿' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'payment-vouchers.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Page() {
  return (
    <RequirePerm doctype="Payment Entry" action="read">
      <PageShell
        title="سندات الصرف"
        subtitle="إدارة سندات الصرف وتسجيل المدفوعات الصادرة"
        actions={
          <Link to="/financial/payment-vouchers/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-rose-500/20">
            <Plus size={16} /> سند صرف جديد
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
    const f: Array<[string, string, unknown]> = [['payment_type', '=', 'Pay']];
    if (fromDate) f.push(['posting_date', '>=', fromDate]);
    if (toDate) f.push(['posting_date', '<=', toDate]);
    if (mop) f.push(['mode_of_payment', '=', mop]);
    if (statusFilter !== '') f.push(['docstatus', '=', Number(statusFilter)]);
    if (partyTypeFilter) f.push(['party_type', '=', partyTypeFilter]);
    if (partyFilter) f.push(['party', '=', partyFilter]);
    return f;
  }, [fromDate, toDate, mop, statusFilter, partyTypeFilter, partyFilter]);

  // Explicit swrKey makes the cache scope crystal clear (and prevents any
  // collision with /financial/receipt-vouchers which also queries Payment Entry).
  const swrKey = `pe:pay:${JSON.stringify(filters)}`;
  const { data: rows, isLoading, mutate: refresh } = useFrappeGetDocList<PERow>(
    'Payment Entry',
    {
      fields: ['name', 'posting_date', 'party_type', 'party', 'custom_payee_name', 'paid_amount', 'mode_of_payment', 'docstatus'],
      filters: filters as any,
      limit: 200,
      orderBy: { field: 'posting_date', order: 'desc' },
    },
    swrKey,
  );

  const { data: mopList } = useFrappeGetDocList<{ name: string }>('Mode of Payment', { fields: ['name'], limit: 50 });
  const { data: suppliers } = useFrappeGetDocList<{ name: string; supplier_name?: string }>(
    'Supplier',
    { fields: ['name', 'supplier_name'], limit: 300 },
    partyTypeFilter === 'Supplier' ? undefined : null,
  );
  const { data: customers } = useFrappeGetDocList<{ name: string; customer_name?: string }>(
    'Customer',
    { fields: ['name', 'customer_name'], limit: 300 },
    partyTypeFilter === 'Customer' ? undefined : null,
  );
  const { data: employees } = useFrappeGetDocList<{ name: string; employee_name?: string }>(
    'Employee',
    { fields: ['name', 'employee_name'], limit: 300 },
    partyTypeFilter === 'Employee' ? undefined : null,
  );
  const partyOpts =
    partyTypeFilter === 'Supplier' ? (suppliers ?? []).map((s) => ({ v: s.name, l: s.supplier_name ?? s.name }))
    : partyTypeFilter === 'Customer' ? (customers ?? []).map((c) => ({ v: c.name, l: c.customer_name ?? c.name }))
    : partyTypeFilter === 'Employee' ? (employees ?? []).map((e) => ({ v: e.name, l: e.employee_name ?? e.name }))
    : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows ?? [];
    return (rows ?? []).filter(
      (r) => r.name.toLowerCase().includes(q) || (r.party ?? '').toLowerCase().includes(q) || (r.custom_payee_name ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, r) => s + Number(r.paid_amount ?? 0), 0);
    const submitted = filtered.filter((r) => r.docstatus === 1).reduce((s, r) => s + Number(r.paid_amount ?? 0), 0);
    const draft = filtered.filter((r) => r.docstatus === 0).length;
    return { total, submitted, draft, count: filtered.length };
  }, [filtered]);

  const activeFilterCount =
    (fromDate ? 1 : 0) + (toDate ? 1 : 0) + (mop ? 1 : 0) + (statusFilter ? 1 : 0) + (partyTypeFilter ? 1 : 0) + (partyFilter ? 1 : 0);

  function clearFilters() {
    setFromDate(''); setToDate(''); setMop(''); setStatusFilter(''); setPartyTypeFilter(''); setPartyFilter('');
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<TrendingDown size={18} />} label="إجمالي المصروف" value={`${fmtAmt(totals.submitted)}`} tone="rose" />
        <Stat icon={<ArrowUpFromLine size={18} />} label="إجمالي السندات" value={`${fmtAmt(totals.total)}`} tone="blue" />
        <Stat icon={<CreditCard size={18} />} label="عدد السندات" value={String(totals.count)} tone="violet" />
        <Stat icon={<Filter size={18} />} label="مسودات" value={String(totals.draft)} tone="amber" />
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">الفلاتر</h3>
            {activeFilterCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {activeFilterCount} نشط
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 transition">
                <X size={12} /> مسح الفلاتر
              </button>
            )}
            <button onClick={() => refresh()} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 rounded-lg transition">
              <RefreshCcw size={12} /> تحديث
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <Label icon={<Search size={13} />}>بحث</Label>
            <div className="relative">
              <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="رقم السند، اسم المورد، أو المصروف إليه..."
                className="w-full ps-3 pe-9 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label icon={<Calendar size={13} />}>من تاريخ</Label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition" />
            </div>
            <div>
              <Label icon={<Calendar size={13} />}>إلى تاريخ</Label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition" />
            </div>
            <div>
              <Label icon={<CreditCard size={13} />}>طريقة الدفع</Label>
              <select value={mop} onChange={(e) => setMop(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition">
                <option value="">كل الطرق</option>
                {(mopList ?? []).map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <Label>الحالة</Label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition">
                <option value="">الكل</option>
                <option value="0">مسودة</option>
                <option value="1">مرحّل</option>
                <option value="2">ملغى</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label icon={<Users size={13} />}>نوع الجهة</Label>
              <select value={partyTypeFilter}
                onChange={(e) => { setPartyTypeFilter(e.target.value); setPartyFilter(''); }}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition">
                <option value="">كل الجهات</option>
                <option value="Supplier">موردين</option>
                <option value="Customer">عملاء</option>
                <option value="Employee">موظفين</option>
              </select>
            </div>
            {partyTypeFilter && (
              <div className="md:col-span-3">
                <Label icon={<Users size={13} />}>
                  {partyTypeFilter === 'Supplier' ? 'المورد' : partyTypeFilter === 'Customer' ? 'العميل' : 'الموظف'}
                </Label>
                <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition">
                  <option value="">— الكل —</option>
                  {partyOpts.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{filtered.length} سند معروض</span>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(filtered)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-sm">
            <FileDown size={15} /> تحميل Excel
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-sm">
            <FileText size={15} /> تحميل PDF
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3 text-start">رقم السند</th>
                <th className="px-5 py-3 text-start">التاريخ</th>
                <th className="px-5 py-3 text-start">المورد / المصروف إليه</th>
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
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-slate-400 mb-3">لا توجد سندات مطابقة</p>
                    <button onClick={() => refresh()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700">
                      <RefreshCcw size={14} /> إعادة المحاولة
                    </button>
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const st = STATUS[String(r.docstatus ?? 0)] ?? STATUS['0'];
                const party = r.custom_payee_name || r.party || '—';
                return (
                  <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-mono text-sm font-semibold text-rose-600 dark:text-rose-400">{r.name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.posting_date ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-800 dark:text-white">{party}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-rose-600">{fmtAmt(r.paid_amount)}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.mode_of_payment ?? '—'}</td>
                    <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span></td>
                    <td className="px-5 py-3">
                      <button onClick={() => navigate(`/financial/payment-vouchers/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-rose-600 transition-all">
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

function Label({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
      {icon}
      <span>{children}</span>
    </label>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'rose' | 'blue' | 'violet' | 'amber' }) {
  const toneCls = {
    rose:    'bg-rose-50    text-rose-700    dark:bg-rose-500/10    dark:text-rose-400',
    blue:    'bg-blue-50    text-blue-700    dark:bg-blue-500/10    dark:text-blue-400',
    violet:  'bg-violet-50  text-violet-700  dark:bg-violet-500/10  dark:text-violet-400',
    amber:   'bg-amber-50   text-amber-700   dark:bg-amber-500/10   dark:text-amber-400',
  }[tone];
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl grid place-items-center ${toneCls}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white font-mono truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}
