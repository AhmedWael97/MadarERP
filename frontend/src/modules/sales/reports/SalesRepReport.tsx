import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import SearchableSelect from '@/components/erp/SearchableSelect';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface SalesInvoiceRow {
  name: string;
  posting_date: string;
  customer: string;
  customer_name?: string;
  rounded_total: number;
  grand_total: number;
  outstanding_amount?: number;
  docstatus: 0 | 1 | 2;
  madaar_sales_person?: string;
}

const INPUT =
  'w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)] transition';

export default function SalesRepReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 8)}01`;

  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [salesRep, setSalesRep] = useState('');
  const [customer, setCustomer] = useState('');
  const [source, setSource] = useState('Sales Invoice');

  const { data: salesPersons } = useFrappeGetDocList<{ name: string }>('Sales Person', {
    fields: ['name'],
    limit: 500,
  });

  const { data: customers } = useFrappeGetDocList<{ name: string; customer_name?: string }>('Customer', {
    fields: ['name', 'customer_name'],
    limit: 1000,
  });

  const siFilters: Array<[string, string, unknown]> = [
    ['docstatus', '=', 1],
    ['posting_date', '>=', fromDate],
    ['posting_date', '<=', toDate],
  ];
  if (salesRep) siFilters.push(['madaar_sales_person', '=', salesRep]);
  if (customer) siFilters.push(['customer', '=', customer]);

  const { data: invoices, isLoading: invoicesLoading } = useFrappeGetDocList<SalesInvoiceRow>(
    'Sales Invoice',
    {
      fields: ['name', 'posting_date', 'customer', 'customer_name', 'rounded_total', 'grand_total', 'outstanding_amount', 'docstatus', 'madaar_sales_person'],
      filters: siFilters as any,
      orderBy: { field: 'posting_date', order: 'desc' },
      limit: 1000,
    },
    source === 'Sales Invoice' ? undefined : null,
  );

  const { data: glRows, isLoading: glLoading } = useFrappeGetDocList<any>(
    'GL Entry',
    {
      fields: ['name', 'posting_date', 'voucher_type', 'voucher_no', 'party', 'party_type', 'debit', 'credit', 'remarks'],
      filters: [
        ['is_cancelled', '=', 0],
        ['posting_date', '>=', fromDate],
        ['posting_date', '<=', toDate],
        ...(source ? ([['voucher_type', '=', source]] as any) : []),
        ['party_type', '=', 'Customer'],
        ...(customer ? ([['party', '=', customer]] as any) : []),
      ],
      orderBy: { field: 'posting_date', order: 'desc' },
      limit: 1000,
    },
    source !== 'Sales Invoice' ? undefined : null,
  );

  const rows = useMemo(() => {
    if (source === 'Sales Invoice') {
      return (invoices ?? []).map((i) => ({
        id: i.name,
        posting_date: i.posting_date,
        sales_rep: i.madaar_sales_person || '—',
        customer: i.customer,
        source: 'Sales Invoice',
        source_no: i.name,
        debit: Number(i.rounded_total || i.grand_total || 0),
        credit: 0,
        amount: Number(i.rounded_total || i.grand_total || 0),
        remarks: i.customer_name ?? '',
      }));
    }
    return (glRows ?? []).map((g: any) => ({
      id: g.name,
      posting_date: g.posting_date,
      sales_rep: salesRep || '—',
      customer: g.party,
      source: g.voucher_type,
      source_no: g.voucher_no,
      debit: Number(g.debit ?? 0),
      credit: Number(g.credit ?? 0),
      amount: Number(g.debit ?? 0) - Number(g.credit ?? 0),
      remarks: g.remarks ?? '',
    }));
  }, [source, invoices, glRows, salesRep]);

  const summary = useMemo(() => {
    const byRep = new Map<string, { amount: number; count: number }>();
    for (const r of rows) {
      const rep = r.sales_rep || '—';
      const cur = byRep.get(rep) ?? { amount: 0, count: 0 };
      cur.amount += r.amount;
      cur.count += 1;
      byRep.set(rep, cur);
    }
    return Array.from(byRep.entries()).map(([rep, v]) => ({ rep, ...v })).sort((a, b) => b.amount - a.amount);
  }, [rows]);

  return (
    <RequirePerm doctype="Sales Invoice" action="read">
      <PageShell title="تقرير المندوبين" subtitle="تصفية حسب المندوب/العميل/المصدر/التاريخ من-إلى">
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">مندوب المبيعات</label>
                <SearchableSelect value={salesRep} onChange={setSalesRep} options={(salesPersons ?? []).map((s) => ({ value: s.name, label: s.name }))} listId="sales-rep-report-salesperson" className={INPUT} placeholder="الكل" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">العميل</label>
                <SearchableSelect value={customer} onChange={setCustomer} options={(customers ?? []).map((c) => ({ value: c.name, label: `${c.name} - ${c.customer_name ?? ''}` }))} listId="sales-rep-report-customer" className={INPUT} placeholder="الكل" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">المصدر</label>
                <SearchableSelect
                  value={source}
                  onChange={setSource}
                  options={[
                    { value: 'Sales Invoice', label: 'Sales Invoice' },
                    { value: 'Payment Entry', label: 'Payment Entry' },
                    { value: 'Journal Entry', label: 'Journal Entry' },
                    { value: 'Delivery Note', label: 'Delivery Note' },
                  ]}
                  listId="sales-rep-report-source"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">من تاريخ</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">إلى تاريخ</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={INPUT} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                  <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 text-start">التاريخ</th>
                    <th className="px-4 py-3 text-start">المندوب</th>
                    <th className="px-4 py-3 text-start">العميل</th>
                    <th className="px-4 py-3 text-start">المصدر</th>
                    <th className="px-4 py-3 text-start">المرجع</th>
                    <th className="px-4 py-3 text-start">القيمة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {(source === 'Sales Invoice' ? invoicesLoading : glLoading) && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">جاري التحميل...</td></tr>
                  )}
                  {!(source === 'Sales Invoice' ? invoicesLoading : glLoading) && rows.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">لا توجد بيانات</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/2">
                      <td className="px-4 py-2.5 font-mono">{r.posting_date}</td>
                      <td className="px-4 py-2.5">{r.sales_rep}</td>
                      <td className="px-4 py-2.5">
                        <Link to={`/customers/${encodeURIComponent(r.customer)}`} className="text-(--color-brand-600) hover:underline">{r.customer}</Link>
                      </td>
                      <td className="px-4 py-2.5">{r.source}</td>
                      <td className="px-4 py-2.5 font-mono">{r.source_no}</td>
                      <td className="px-4 py-2.5 font-mono">{fmt(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 text-sm font-semibold">ملخص حسب المندوب</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                  <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 text-start">المندوب</th>
                    <th className="px-4 py-3 text-start">عدد الحركات</th>
                    <th className="px-4 py-3 text-start">إجمالي القيمة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {summary.map((s) => (
                    <tr key={s.rep}>
                      <td className="px-4 py-2.5">{s.rep}</td>
                      <td className="px-4 py-2.5 font-mono">{s.count}</td>
                      <td className="px-4 py-2.5 font-mono">{fmt(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageShell>
    </RequirePerm>
  );
}

function fmt(n?: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n ?? 0));
}
