/**
 * Accounting Dashboard — reference 004_لوحة-الحسابات-العامة-مدار-ERP.png
 * KPIs + account type donut + monthly journal entries bar +
 * Most active accounts + Recent journal entries
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFrappeGetDocCount, useFrappeGetDocList } from 'frappe-react-sdk';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { BookOpen, FileText, DraftingCompass, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

interface KpiProps { label: string; value: string | number; icon: React.ReactNode; color: string }
function KpiCard({ label, value, icon, color }: KpiProps) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>{icon}</div>
      <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

interface JERow { name: string; posting_date?: string; voucher_type?: string; user_remark?: string; total_debit?: number; docstatus?: number }
interface AccountRow { name: string; account_name?: string; root_type?: string; is_group?: 0 | 1 }

const ROOT_COLORS: Record<string, string> = {
  Asset:     '#6366f1',
  Liability: '#ef4444',
  Equity:    '#f59e0b',
  Income:    '#10b981',
  Expense:   '#8b5cf6',
};
const ROOT_AR: Record<string, string> = {
  Asset: 'أصول', Liability: 'خصوم', Equity: 'حقوق ملكية', Income: 'إيرادات', Expense: 'مصروفات',
};

export default function Page() {
  return (
    <RequirePerm doctype="Journal Entry" action="read">
      <Body />
    </RequirePerm>
  );
}

function Body() {
  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

  // Counts
  const { data: totalAccounts } = useFrappeGetDocCount('Account');
  const { data: totalCC } = useFrappeGetDocCount('Cost Center');
  const { data: draftJE } = useFrappeGetDocCount('Journal Entry', [['docstatus', '=', 0]]);
  const { data: postedJE } = useFrappeGetDocCount('Journal Entry', [['docstatus', '=', 1]]);

  // All accounts (for donut)
  const { data: accounts } = useFrappeGetDocList<AccountRow>('Account', {
    fields: ['name', 'root_type', 'is_group'],
    filters: [['is_group', '=', 0]],
    limit: 500,
  });

  // Recent journal entries (50 for chart + list)
  const { data: journalEntries } = useFrappeGetDocList<JERow>('Journal Entry', {
    fields: ['name', 'posting_date', 'voucher_type', 'user_remark', 'total_debit', 'docstatus'],
    filters: [['docstatus', '!=', 2]],
    limit: 100,
    orderBy: { field: 'posting_date', order: 'desc' },
  });

  // Monthly this-month totals
  const thisMonthDebit = useMemo(() =>
    (journalEntries ?? []).filter(j => (j.posting_date ?? '') >= monthStart && j.docstatus === 1)
      .reduce((s, j) => s + (j.total_debit ?? 0), 0),
    [journalEntries, monthStart]);

  // Account type donut
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    (accounts ?? []).forEach(a => {
      const k = a.root_type ?? 'Other';
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => ({ name: ROOT_AR[k] ?? k, value: v, fill: ROOT_COLORS[k] ?? '#94a3b8' }));
  }, [accounts]);

  // Monthly journal entry count (last 6 months)
  const monthlyJE = useMemo(() => {
    const map: Record<string, { month: string; عدد: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, عدد: 0 };
    }
    (journalEntries ?? []).filter(j => j.docstatus === 1).forEach(j => {
      const k = (j.posting_date ?? '').slice(0, 7);
      if (map[k]) map[k].عدد++;
    });
    return Object.values(map);
  }, [journalEntries]);

  // Recent 5 entries for list
  const recent = (journalEntries ?? []).slice(0, 5);

  const STATUS: Record<number, { label: string; cls: string }> = {
    0: { label: 'مسودة', cls: 'bg-amber-100 text-amber-700' },
    1: { label: 'مرحّل', cls: 'bg-emerald-100 text-emerald-700' },
  };

  return (
    <PageShell
      title="لوحة الحسابات العامة"
      subtitle="نظرة عامة على القيود والحسابات المحاسبية"
      actions={
        <Link to="/accounting/journal-entries/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
          <FileText size={16} /> قيد جديد
        </Link>
      }
    >
      <div className="space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="مراكز التكلفة" value={totalCC ?? 0} icon={<Layers size={20} className="text-violet-600" />} color="bg-violet-100 dark:bg-violet-500/10" />
          <KpiCard label="مسودات القيود" value={draftJE ?? 0} icon={<DraftingCompass size={20} className="text-amber-600" />} color="bg-amber-100 dark:bg-amber-500/10" />
          <KpiCard label="القيود المرحّلة" value={postedJE ?? 0} icon={<FileText size={20} className="text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-500/10" />
          <KpiCard label="إجمالي الحسابات" value={totalAccounts ?? 0} icon={<BookOpen size={20} className="text-indigo-600" />} color="bg-indigo-100 dark:bg-indigo-500/10" />
        </div>

        {/* Debit/Credit totals this month */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight size={16} className="opacity-80" />
              <p className="text-sm opacity-80">إجمالي الدائن هذا الشهر</p>
            </div>
            <p className="text-3xl font-bold">{fmt(thisMonthDebit)} ج.م</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight size={16} className="opacity-80" />
              <p className="text-sm opacity-80">إجمالي المدين هذا الشهر</p>
            </div>
            <p className="text-3xl font-bold">{fmt(thisMonthDebit)} ج.م</p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Donut — account types */}
          <SectionCard title="توزيع أنواع الحسابات">
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-1 text-xs">
                {donutData.map(d => (
                  <span key={d.name} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.fill }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Bar — monthly journal entry count */}
          <SectionCard title="حركة القيود الشهرية">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={monthlyJE} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="عدد" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Most active accounts (placeholder) */}
          <SectionCard title="أكثر الحسابات نشاطاً">
            <p className="text-sm text-slate-400 text-center py-6">يحتاج إلى API حركة الحسابات من GL</p>
          </SectionCard>

          {/* Recent journal entries */}
          <SectionCard title="آخر القيود" action={<Link to="/accounting/journal-entries" className="text-xs text-indigo-600 hover:underline">عرض الكل ←</Link>}>
            <div className="space-y-2">
              {recent.map(j => {
                const st = STATUS[j.docstatus ?? 0];
                return (
                  <div key={j.name} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-mono text-xs text-indigo-600">{j.name}</p>
                      <p className="text-xs text-slate-400">{j.posting_date ?? '—'}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st?.cls ?? ''}`}>{st?.label ?? '—'}</span>
                  </div>
                );
              })}
              {recent.length === 0 && <p className="text-sm text-slate-400 text-center py-4">لا توجد قيود</p>}
            </div>
          </SectionCard>
        </div>

      </div>
    </PageShell>
  );
}
