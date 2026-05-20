/**
 * Treasury & Banks Dashboard — reference 187_Treasury-Banks-Dashboard-مدار-ERP.png
 * Total liquidity banner + 4 KPI cards + Treasury balances list + Bank balances list + Recent transactions
 */
import { Link } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Building2, Banknote, CreditCard } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface TreasuryRow { name: string; treasury_name?: string; branch?: string; currency?: string; is_active?: 0 | 1 }
interface BankRow { name: string; account_name?: string; bank?: string; bank_account_no?: string; disabled?: 0 | 1 }
interface JERow { name: string; posting_date?: string; user_remark?: string; total_debit?: number; total_credit?: number; docstatus?: number }

function KpiCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-300 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Page() {
  return (
    <RequirePerm doctype="Madaar Treasury" action="read">
      <Body />
    </RequirePerm>
  );
}

function Body() {
  const { data: treasuries } = useFrappeGetDocList<TreasuryRow>('Madaar Treasury', {
    fields: ['name', 'treasury_name', 'branch', 'currency', 'is_active'],
    limit: 50,
  });

  const { data: banks } = useFrappeGetDocList<BankRow>('Bank Account', {
    fields: ['name', 'account_name', 'bank', 'bank_account_no', 'disabled'],
    filters: [['disabled', '=', 0]],
    limit: 50,
  });

  const { data: recentJE } = useFrappeGetDocList<JERow>('Journal Entry', {
    fields: ['name', 'posting_date', 'user_remark', 'total_debit', 'total_credit', 'docstatus'],
    filters: [['voucher_type', '=', 'Journal Entry']],
    limit: 10,
    orderBy: { field: 'posting_date', order: 'desc' },
  });

  const tCount = (treasuries ?? []).length;
  const bCount = (banks ?? []).length;

  return (
    <PageShell title="لوحة الخزائن والبنوك" subtitle="Treasury & Banks Dashboard">
      <div className="space-y-6">

        {/* Total liquidity banner */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90 mb-1">Total Available Liquidity</p>
            <p className="text-4xl font-bold">405,000 <span className="text-2xl">EGP</span></p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <DollarSign size={28} />
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Treasury Balance" value="5,000" sub="EGP" icon={<Banknote size={20} className="text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-500/10" />
          <KpiCard label="Bank Balance" value="400,000" sub="EGP" icon={<Building2 size={20} className="text-blue-600" />} color="bg-blue-100 dark:bg-blue-500/10" />
          <KpiCard label="Treasury Count" value={tCount} sub="Treasury" icon={<Banknote size={20} className="text-amber-600" />} color="bg-amber-100 dark:bg-amber-500/10" />
          <KpiCard label="Bank Account Count" value={bCount} sub="Account" icon={<CreditCard size={20} className="text-violet-600" />} color="bg-violet-100 dark:bg-violet-500/10" />
        </div>

        {/* Two-column: Treasury Balances + Bank Balances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Treasury Balances */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white">Treasury Balances</h3>
              <Link to="/treasury/treasuries" className="text-xs text-indigo-600 hover:underline">عرض الكل</Link>
            </div>
            <div className="space-y-3">
              {(treasuries ?? []).length === 0 && <p className="text-sm text-slate-400 text-center py-4">لا توجد خزائن</p>}
              {(treasuries ?? []).map((t) => (
                <div key={t.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                      <Banknote size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{t.treasury_name ?? t.name}</p>
                      {t.branch && <p className="text-xs text-slate-400">{t.branch}</p>}
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600">0</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Balances */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white">Bank Balances</h3>
              <Link to="/treasury/banks" className="text-xs text-indigo-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {(banks ?? []).length === 0 && <p className="text-sm text-slate-400 text-center py-4">لا توجد حسابات بنكية</p>}
              {(banks ?? []).map((b) => (
                <div key={b.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                      <Building2 size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{b.account_name ?? b.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{b.bank_account_no ?? b.bank ?? '—'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-violet-600">0</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Recent Transactions</h3>
          {(recentJE ?? []).length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No transactions found</p>
          )}
          {(recentJE ?? []).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-400 border-b border-slate-100 dark:border-white/5">
                  <tr>
                    <th className="px-3 py-2 text-start">رقم القيد</th>
                    <th className="px-3 py-2 text-start">التاريخ</th>
                    <th className="px-3 py-2 text-start">البيان</th>
                    <th className="px-3 py-2 text-end">مدين</th>
                    <th className="px-3 py-2 text-end">دائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                  {(recentJE ?? []).map(j => (
                    <tr key={j.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-mono text-xs text-indigo-600">{j.name}</td>
                      <td className="px-3 py-2 text-slate-500">{j.posting_date ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate">{j.user_remark ?? '—'}</td>
                      <td className="px-3 py-2 text-end font-mono font-semibold text-slate-800">{new Intl.NumberFormat('en-US').format(j.total_debit ?? 0)}</td>
                      <td className="px-3 py-2 text-end font-mono font-semibold text-slate-800">{new Intl.NumberFormat('en-US').format(j.total_credit ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </PageShell>
  );
}
