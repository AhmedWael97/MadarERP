/**
 * Main Dashboard — reference 001_مرحباً،-مدير-الشركة.png
 * KPI cards + Sales/Purchases line chart + Invoice status donut + Cash flow bar +
 * Top products, Top customers, Recent invoices
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFrappeGetCall, useFrappeGetDocList } from 'frappe-react-sdk';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Wallet, ShoppingBag, Users, TrendingUp, Boxes, Receipt, Truck, Activity } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { useAuth } from '@/lib/auth/useAuth';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

// ─── KPI tiles ──────────────────────────────────────────────────────────────

interface KpiProps { label: string; value: string; sub?: string; gradient: string; icon: React.ReactNode }
function KpiCard({ label, value, sub, gradient, icon }: KpiProps) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-md ${gradient}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-3xl font-bold mb-0.5">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── stat tile (secondary) ──────────────────────────────────────────────────
interface StatProps { label: string; value: string | number; icon: React.ReactNode }
function StatTile({ label, value, icon }: StatProps) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5 p-4 flex items-center gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400">{icon}</div>
      <div>
        <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// ─── section card ────────────────────────────────────────────────────────────
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

// ─── interfaces ──────────────────────────────────────────────────────────────
interface SalesInv { name: string; posting_date?: string; customer?: string; grand_total?: number; docstatus?: number }
interface PurchInv { name: string; posting_date?: string; supplier?: string; grand_total?: number; docstatus?: number }

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Page() {
  const { user } = useAuth();
  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

  // Fetch recent sales invoices
  const { data: salesInv } = useFrappeGetDocList<SalesInv>('Sales Invoice', {
    fields: ['name', 'posting_date', 'customer', 'grand_total', 'docstatus'],
    filters: [['docstatus', '!=', 2]],
    limit: 50,
    orderBy: { field: 'posting_date', order: 'desc' },
  });

  // Fetch recent purchase invoices
  const { data: purchInv } = useFrappeGetDocList<PurchInv>('Purchase Invoice', {
    fields: ['name', 'posting_date', 'supplier', 'grand_total', 'docstatus'],
    filters: [['docstatus', '!=', 2]],
    limit: 50,
    orderBy: { field: 'posting_date', order: 'desc' },
  });

  // ── KPI calculations ────────────────────────────────────────────────────────
  const salesThisMonth = useMemo(() =>
    (salesInv ?? []).filter(i => (i.posting_date ?? '') >= monthStart && i.docstatus === 1)
      .reduce((s, i) => s + (i.grand_total ?? 0), 0),
    [salesInv, monthStart]);

  const purchThisMonth = useMemo(() =>
    (purchInv ?? []).filter(i => (i.posting_date ?? '') >= monthStart && i.docstatus === 1)
      .reduce((s, i) => s + (i.grand_total ?? 0), 0),
    [purchInv, monthStart]);

  const netProfit = useMemo(() => salesThisMonth - purchThisMonth, [salesThisMonth, purchThisMonth]);

  // ── monthly chart data (last 12 months) ─────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; مبيعات: number; مشتريات: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = { month: MONTHS_AR[d.getMonth()], مبيعات: 0, مشتريات: 0 };
    }
    (salesInv ?? []).filter(i => i.docstatus === 1).forEach(i => {
      const k = (i.posting_date ?? '').slice(0, 7);
      if (map[k]) map[k].مبيعات += i.grand_total ?? 0;
    });
    (purchInv ?? []).filter(i => i.docstatus === 1).forEach(i => {
      const k = (i.posting_date ?? '').slice(0, 7);
      if (map[k]) map[k].مشتريات += i.grand_total ?? 0;
    });
    return Object.values(map);
  }, [salesInv, purchInv]);

  // ── invoice status donut ────────────────────────────────────────────────────
  const donutData = useMemo(() => {
    const draft = (salesInv ?? []).filter(i => i.docstatus === 0).length;
    const posted = (salesInv ?? []).filter(i => i.docstatus === 1).length;
    return [
      { name: 'مرحّلة', value: posted, fill: '#6366f1' },
      { name: 'مسودة', value: draft, fill: '#e2e8f0' },
    ].filter(d => d.value > 0);
  }, [salesInv]);

  // ── cash flow bar (this month) ──────────────────────────────────────────────
  const cashFlowData = [
    { label: 'تحصيلات', value: salesThisMonth, fill: '#10b981' },
    { label: 'مدفوعات', value: purchThisMonth, fill: '#818cf8' },
    { label: 'الصافي', value: netProfit, fill: netProfit >= 0 ? '#6366f1' : '#ef4444' },
  ];

  // ── top customers ───────────────────────────────────────────────────────────
  const topCustomers = useMemo(() => {
    const map: Record<string, number> = {};
    (salesInv ?? []).filter(i => i.docstatus === 1).forEach(i => {
      map[i.customer ?? 'غير محدد'] = (map[i.customer ?? 'غير محدد'] ?? 0) + (i.grand_total ?? 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total], i) => ({ rank: i + 1, name, total }));
  }, [salesInv]);

  // ── recent invoices (last 5 each) ──────────────────────────────────────────
  const recentSales = (salesInv ?? []).slice(0, 5);
  const recentPurch = (purchInv ?? []).slice(0, 5);

  const greeting = user?.fullName || user?.email || 'مدير الشركة';
  const dateLabel = today.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <PageShell title={`مرحباً، ${greeting} 👋`} subtitle={`شركة مدار التجريبية — ${dateLabel}`}>
      <div className="space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="ذمم دائنة (موردين)" value={`${fmt(purchThisMonth)} ج.م`} gradient="bg-gradient-to-br from-rose-500 to-red-600" icon={<Wallet size={20} />} />
          <KpiCard label="ذمم مدينة (عملاء)" value={`${fmt(salesThisMonth)} ج.م`} gradient="bg-gradient-to-br from-amber-500 to-orange-600" icon={<TrendingUp size={20} />} />
          <KpiCard label="مشتريات الشهر" value={`${fmt(purchThisMonth)} ج.م`} gradient="bg-gradient-to-br from-teal-500 to-cyan-600" icon={<ShoppingBag size={20} />} />
          <KpiCard label="مبيعات الشهر" value={`${fmt(salesThisMonth)} ج.م`} gradient="bg-gradient-to-br from-violet-500 to-purple-600" icon={<Activity size={20} />} />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatTile label="المنتجات" value={16} icon={<Boxes size={18} />} />
          <StatTile label="العملاء" value={11} icon={<Users size={18} />} />
          <StatTile label="فواتير مشتريات" value={(purchInv ?? []).length} icon={<ShoppingBag size={18} />} />
          <StatTile label="فواتير مبيعات" value={(salesInv ?? []).length} icon={<Receipt size={18} />} />
          <StatTile label="صافي ربح الشهر" value={`${fmt(Math.max(0, netProfit))} ج.م`} icon={<TrendingUp size={18} />} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Donut — invoice status */}
          <SectionCard title="حالة الفواتير" action={<span className="text-xs text-slate-400">فواتير المبيعات — السنة الحالية</span>}>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs">
                {donutData.map(d => (
                  <span key={d.name} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.fill }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Area chart — monthly sales/purchases */}
          <SectionCard title="حركة المبيعات والمشتريات" action={<span className="text-xs text-slate-400">آخر 12 شهر</span>}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPurch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`${fmt(v)} ج.م`, '']} />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="مبيعات" stroke="#6366f1" fill="url(#gradSales)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="مشتريات" stroke="#10b981" fill="url(#gradPurch)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Bar — cash flow this month */}
          <SectionCard title="التدفق النقدي — هذا الشهر">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashFlowData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`${fmt(v)} ج.م`, '']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {cashFlowData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        {/* Bottom row: top products + top customers + recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Placeholder: top products */}
          <SectionCard title="أفضل المنتجات — السنة">
            <p className="text-sm text-slate-400 text-center py-6">قريباً — يحتاج إلى API مخزون</p>
          </SectionCard>

          {/* Top customers */}
          <SectionCard title="أفضل العملاء — السنة">
            <div className="space-y-2">
              {topCustomers.length === 0 && <p className="text-sm text-slate-400 text-center py-4">لا توجد بيانات</p>}
              {topCustomers.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">{c.rank}</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{c.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-indigo-600">{fmt(c.total)}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recent sales invoices */}
          <SectionCard title="آخر فواتير المبيعات" action={<Link to="/sales/invoices" className="text-xs text-indigo-600 hover:underline">عرض الكل ←</Link>}>
            <div className="space-y-2">
              {recentSales.map((inv) => (
                <div key={inv.name} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-mono text-xs text-indigo-600">{inv.name}</p>
                    <p className="text-xs text-slate-400">{inv.customer ?? '—'}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold text-slate-800 dark:text-white">{fmt(inv.grand_total ?? 0)}</p>
                    <p className="text-xs text-slate-400">{inv.posting_date ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Recent purchase invoices */}
        <SectionCard title="آخر فواتير المشتريات" action={<Link to="/purchases/invoices" className="text-xs text-indigo-600 hover:underline">عرض الكل ←</Link>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {recentPurch.map((inv) => (
              <div key={inv.name} className="rounded-xl border border-slate-100 dark:border-white/5 p-3">
                <p className="font-mono text-xs text-indigo-600 mb-0.5">{inv.name}</p>
                <p className="text-xs text-slate-500 truncate mb-1">{inv.supplier ?? '—'}</p>
                <p className="font-bold text-slate-800 dark:text-white">{fmt(inv.grand_total ?? 0)}</p>
                <p className="text-xs text-slate-400">{inv.posting_date ?? '—'}</p>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </PageShell>
  );
}
