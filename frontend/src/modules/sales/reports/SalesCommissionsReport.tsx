import { useMemo, useState } from 'react';
import { useFrappeGetCall, useFrappeGetDocList } from 'frappe-react-sdk';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import SearchableSelect from '@/components/erp/SearchableSelect';

interface SalesCommissionRow {
  name: string;
  posting_date: string;
  company?: string;
  customer: string;
  customer_name?: string;
  sales_rep?: string;
  amount: number;
  percentage: number;
  commission: number;
  policy_name?: string | null;
}

interface SalesCommissionSummaryRow {
  sales_rep?: string;
  sales: number;
  commission: number;
  count: number;
}

interface SalesCommissionsResponse {
  message?: {
    rows?: SalesCommissionRow[];
    summary?: SalesCommissionSummaryRow[];
    total_sales?: number;
    total_commission?: number;
  };
}

const INPUT =
  'w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)] transition';

export default function SalesCommissionsReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 8)}01`;

  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [salesRep, setSalesRep] = useState('');

  const { data: salesPersons } = useFrappeGetDocList<{ name: string }>('Sales Person', {
    fields: ['name'],
    limit: 500,
  });

  const { data, isLoading } = useFrappeGetCall<SalesCommissionsResponse>(
    'madaar_core.api.get_sales_commissions',
    {
      from_date: fromDate,
      to_date: toDate,
      sales_person: salesRep || '',
    },
    `sales-commissions:${fromDate}:${toDate}:${salesRep || 'all'}`,
  );

  const rows = useMemo(() => {
    return data?.message?.rows ?? [];
  }, [data]);

  const summary = useMemo(() => {
    return data?.message?.summary ?? [];
  }, [data]);

  return (
    <RequirePerm doctype="Sales Invoice" action="read">
      <PageShell title="تقرير عمولات المبيعات" subtitle="ربط المبيعات بسياسة العمولة المعرّفة وحساب عمولة كل حركة">
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">مندوب المبيعات</label>
                <SearchableSelect
                  value={salesRep}
                  onChange={setSalesRep}
                  options={(salesPersons ?? []).map((s) => ({ value: s.name, label: s.name }))}
                  listId="commission-rep"
                  className={INPUT}
                  placeholder="الكل"
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
                    <th className="px-4 py-3 text-start">المرجع</th>
                    <th className="px-4 py-3 text-start">العميل</th>
                    <th className="px-4 py-3 text-start">المندوب</th>
                    <th className="px-4 py-3 text-start">المبيعات</th>
                    <th className="px-4 py-3 text-start">النسبة %</th>
                    <th className="px-4 py-3 text-start">العمولة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {isLoading && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">جاري التحميل...</td></tr>
                  )}
                  {!isLoading && rows.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">لا توجد بيانات</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/2">
                      <td className="px-4 py-2.5 font-mono">{r.posting_date}</td>
                      <td className="px-4 py-2.5 font-mono">{r.name}</td>
                      <td className="px-4 py-2.5">{r.customer}</td>
                      <td className="px-4 py-2.5">{r.sales_rep || '—'}</td>
                      <td className="px-4 py-2.5 font-mono">{fmt(r.amount)}</td>
                      <td className="px-4 py-2.5 font-mono">{fmt(r.percentage)}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-600">{fmt(r.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 text-sm font-semibold">ملخص عمولات حسب المندوب</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                  <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 text-start">المندوب</th>
                    <th className="px-4 py-3 text-start">عدد الفواتير</th>
                    <th className="px-4 py-3 text-start">إجمالي المبيعات</th>
                    <th className="px-4 py-3 text-start">إجمالي العمولة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {summary.map((s) => (
                    <tr key={s.sales_rep || 'default'}>
                      <td className="px-4 py-2.5">{s.sales_rep || '—'}</td>
                      <td className="px-4 py-2.5 font-mono">{s.count}</td>
                      <td className="px-4 py-2.5 font-mono">{fmt(s.sales)}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-600">{fmt(s.commission)}</td>
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
