import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface Customer {
  name: string;
  customer_name?: string;
  madaar_customer_code?: string;
}

interface GLEntry {
  name: string;
  party: string;
  party_type: string;
  debit: number;
  credit: number;
  is_cancelled?: 0 | 1;
}

export default function CustomerTotalsReportPage() {
  const { data: customers, isLoading: customersLoading } = useFrappeGetDocList<Customer>('Customer', {
    fields: ['name', 'customer_name', 'madaar_customer_code'],
    limit: 2000,
  });

  const { data: glRows, isLoading: glLoading } = useFrappeGetDocList<GLEntry>('GL Entry', {
    fields: ['name', 'party', 'party_type', 'debit', 'credit', 'is_cancelled'],
    filters: [
      ['party_type', '=', 'Customer'],
      ['is_cancelled', '=', 0],
    ],
    limit: 5000,
  });

  const rows = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number }>();
    for (const g of glRows ?? []) {
      const p = g.party;
      const prev = map.get(p) ?? { debit: 0, credit: 0 };
      prev.debit += Number(g.debit ?? 0);
      prev.credit += Number(g.credit ?? 0);
      map.set(p, prev);
    }

    return (customers ?? []).map((c) => {
      const v = map.get(c.name) ?? { debit: 0, credit: 0 };
      return {
        name: c.name,
        label: `${c.madaar_customer_code ?? ''}${c.madaar_customer_code ? ' - ' : ''}${c.customer_name ?? c.name}`,
        debit: v.debit,
        credit: v.credit,
        total: v.debit - v.credit,
      };
    }).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [customers, glRows]);

  const totals = useMemo(() => {
    const debit = rows.reduce((a, r) => a + r.debit, 0);
    const credit = rows.reduce((a, r) => a + r.credit, 0);
    return { debit, credit, total: debit - credit };
  }, [rows]);

  return (
    <RequirePerm doctype="Customer" action="read">
      <PageShell
        title="تقرير إجمالي العملاء"
        subtitle="كل عميل في سطر واحد مع إجمالي المدين/الدائن/الرصيد"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card label="إجمالي مدين" value={totals.debit} color="text-red-600" />
            <Card label="إجمالي دائن" value={totals.credit} color="text-emerald-600" />
            <Card label="الصافي" value={totals.total} color={totals.total >= 0 ? 'text-red-600' : 'text-emerald-600'} />
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                  <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 text-start">العميل</th>
                    <th className="px-4 py-3 text-start">مدين</th>
                    <th className="px-4 py-3 text-start">دائن</th>
                    <th className="px-4 py-3 text-start">الرصيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {(customersLoading || glLoading) && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">جاري التحميل...</td></tr>
                  )}
                  {!customersLoading && !glLoading && rows.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">لا توجد بيانات</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/2">
                      <td className="px-4 py-2.5">
                        <Link to={`/customers/${encodeURIComponent(r.name)}/statement`} className="text-(--color-brand-600) hover:underline">
                          {r.label}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-red-600">{fmt(r.debit)}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-600">{fmt(r.credit)}</td>
                      <td className={`px-4 py-2.5 font-mono font-semibold ${r.total >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(r.total)}</td>
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

function Card({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{fmt(value)}</p>
    </div>
  );
}

function fmt(n?: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n ?? 0));
}
