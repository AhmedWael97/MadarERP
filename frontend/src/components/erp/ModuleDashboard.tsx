/**
 * ModuleDashboard — config-driven analytics view used by every module's
 * /<module>/dashboard route. Fetches a small batch of doctype lists in
 * parallel, derives KPIs and ECharts options from the rows, then renders
 * a stats strip + chart grid + quick-action card.
 *
 * The aim is to avoid hand-rolling 15 nearly-identical dashboard pages.
 * Each module ships a `DashboardCfg` in `lib/dashboards/configs.ts`; a
 * thin override page calls `<ModuleDashboard cfg={cfg} />`.
 */
import { ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from './PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

// ─── Config types ───────────────────────────────────────────────────────────
export type DashRow = Record<string, unknown>;

export interface DashQuery {
  doctype: string;
  fields: string[];
  filters?: Array<[string, string, unknown]>;
  limit?: number;
  orderBy?: { field: string; order: 'asc' | 'desc' };
}

export type Tone = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'teal' | 'orange' | 'indigo' | 'slate';

export interface DashKPI {
  label: string;
  derive: (rs: Record<string, DashRow[]>) => number | string;
  /** Optional format e.g. for currency. Receives the raw derive() value. */
  format?: (v: number | string) => string;
  icon?: ReactNode;
  tone?: Tone;
  /** Optional sublabel under the value (e.g. "آخر 30 يوم"). */
  hint?: string;
}

export interface DashChart {
  title: string;
  subtitle?: string;
  /** Build an ECharts option object from the fetched query results.
   *  Return null to hide the chart card. */
  build: (rs: Record<string, DashRow[]>) => EChartsOption | null;
  /** Tailwind width — defaults to col-span-2 (half on lg). */
  span?: 1 | 2 | 3;
  /** Min height in px. */
  height?: number;
}

export interface DashLink {
  to: string;
  label: string;
  /** Optional badge text shown on the right (count etc.). */
  badge?: (rs: Record<string, DashRow[]>) => string | number | null;
  icon?: ReactNode;
}

export interface DashboardCfg {
  title: string;
  subtitle?: string;
  /** Permission gate — set to the module's primary doctype. Pass null to allow anyone. */
  permDoctype?: string | null;
  /** Named queries that drive everything else. */
  queries: Record<string, DashQuery>;
  kpis: DashKPI[];
  charts?: DashChart[];
  /** Quick-action / "open" links rendered at the bottom. */
  links?: DashLink[];
}

// ─── Tone palette ───────────────────────────────────────────────────────────
const TONE: Record<Tone, { wrap: string; icon: string; ring: string }> = {
  emerald: { wrap: 'from-emerald-500/10 to-emerald-500/0', icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
  sky:     { wrap: 'from-sky-500/10 to-sky-500/0',         icon: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',             ring: 'ring-sky-500/20' },
  violet:  { wrap: 'from-violet-500/10 to-violet-500/0',   icon: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',   ring: 'ring-violet-500/20' },
  amber:   { wrap: 'from-amber-500/10 to-amber-500/0',     icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',     ring: 'ring-amber-500/20' },
  rose:    { wrap: 'from-rose-500/10 to-rose-500/0',       icon: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',         ring: 'ring-rose-500/20' },
  teal:    { wrap: 'from-teal-500/10 to-teal-500/0',       icon: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',         ring: 'ring-teal-500/20' },
  orange:  { wrap: 'from-orange-500/10 to-orange-500/0',   icon: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400', ring: 'ring-orange-500/20' },
  indigo:  { wrap: 'from-indigo-500/10 to-indigo-500/0',   icon: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400', ring: 'ring-indigo-500/20' },
  slate:   { wrap: 'from-slate-500/10 to-slate-500/0',     icon: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',     ring: 'ring-slate-500/20' },
};

const fmtNum = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

// ─── Hook: parallel multi-query fetch (declared at top level for stable hook order) ─
function useDashQueries(cfg: DashboardCfg) {
  // We always fetch the same fixed slot count to keep hook order stable. The
  // configs in practice use <= 8 named queries; if you need more, expand here.
  const keys = Object.keys(cfg.queries);
  const slot0 = useDashQuery(cfg.queries[keys[0]]);
  const slot1 = useDashQuery(cfg.queries[keys[1]]);
  const slot2 = useDashQuery(cfg.queries[keys[2]]);
  const slot3 = useDashQuery(cfg.queries[keys[3]]);
  const slot4 = useDashQuery(cfg.queries[keys[4]]);
  const slot5 = useDashQuery(cfg.queries[keys[5]]);
  const slot6 = useDashQuery(cfg.queries[keys[6]]);
  const slot7 = useDashQuery(cfg.queries[keys[7]]);
  const slots = [slot0, slot1, slot2, slot3, slot4, slot5, slot6, slot7];

  const rows: Record<string, DashRow[]> = {};
  keys.forEach((k, i) => { rows[k] = slots[i] ?? []; });
  return rows;
}

function useDashQuery(q: DashQuery | undefined) {
  const { data } = useFrappeGetDocList<DashRow>(
    q?.doctype ?? 'User',
    q
      ? {
          fields: q.fields,
          filters: (q.filters ?? []) as any,
          limit: q.limit ?? 500,
          orderBy: q.orderBy,
        }
      : { fields: ['name'], limit: 1 },
    q ? undefined : null, // null swrKey disables the fetch
  );
  return data ?? [];
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function ModuleDashboard({ cfg }: { cfg: DashboardCfg }) {
  const wrapped = (
    <PageShell title={cfg.title} subtitle={cfg.subtitle}>
      <Body cfg={cfg} />
    </PageShell>
  );
  if (cfg.permDoctype === null || cfg.permDoctype === undefined) return wrapped;
  return <RequirePerm doctype={cfg.permDoctype} action="read">{wrapped}</RequirePerm>;
}

function Body({ cfg }: { cfg: DashboardCfg }) {
  const rows = useDashQueries(cfg);
  return (
    <div className="space-y-6">
      <KPIGrid kpis={cfg.kpis} rows={rows} />
      {cfg.charts && cfg.charts.length > 0 && <ChartGrid charts={cfg.charts} rows={rows} />}
      {cfg.links && cfg.links.length > 0 && <LinksCard links={cfg.links} rows={rows} />}
    </div>
  );
}

function KPIGrid({ kpis, rows }: { kpis: DashKPI[]; rows: Record<string, DashRow[]> }) {
  const values = useMemo(() => kpis.map((k) => {
    const raw = k.derive(rows);
    const formatted = k.format ? k.format(raw) : typeof raw === 'number' ? fmtNum.format(raw) : String(raw);
    return { ...k, formatted };
  }), [kpis, rows]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {values.map((k, i) => {
        const tone = TONE[k.tone ?? 'sky'];
        return (
          <div key={i} className={`relative overflow-hidden bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl p-4 ring-1 ${tone.ring}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${tone.wrap} pointer-events-none`} />
            <div className="relative flex items-start gap-3">
              {k.icon && <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${tone.icon}`}>{k.icon}</div>}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{k.label}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white font-mono mt-1 truncate">{k.formatted}</p>
                {k.hint && <p className="text-[11px] text-slate-400 mt-0.5">{k.hint}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChartGrid({ charts, rows }: { charts: DashChart[]; rows: Record<string, DashRow[]> }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {charts.map((c, i) => {
        const option = c.build(rows);
        if (!option) return null;
        const spanCls = c.span === 1 ? 'lg:col-span-1' : c.span === 3 ? 'lg:col-span-2' : 'lg:col-span-1';
        return (
          <div key={i} className={`bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl p-4 ${spanCls}`}>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.title}</h3>
              {c.subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.subtitle}</p>}
            </div>
            <ReactECharts option={option} style={{ height: c.height ?? 280, width: '100%' }} notMerge lazyUpdate />
          </div>
        );
      })}
    </div>
  );
}

function LinksCard({ links, rows }: { links: DashLink[]; rows: Record<string, DashRow[]> }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">روابط سريعة</h3>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-white/5">
        {links.map((l) => {
          const badge = l.badge ? l.badge(rows) : null;
          return (
            <li key={l.to}>
              <Link to={l.to} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition group">
                {l.icon && <div className="w-8 h-8 rounded-lg grid place-items-center bg-slate-100 dark:bg-white/5 text-slate-500 group-hover:text-emerald-600">{l.icon}</div>}
                <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 transition">{l.label}</span>
                {badge != null && badge !== '' && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{badge}</span>
                )}
                <ArrowLeft size={14} className="text-slate-400 rtl:rotate-180 group-hover:text-emerald-600 transition" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Tiny helpers configs can use ──────────────────────────────────────────
export const currency = (v: number | string): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(v) || 0);

export const sumField = (rs: DashRow[], f: string): number =>
  rs.reduce((s, r) => s + (Number(r[f]) || 0), 0);

export const countWhere = (rs: DashRow[], pred: (r: DashRow) => boolean): number =>
  rs.filter(pred).length;

export const groupSum = (rs: DashRow[], key: string, measure: string): Map<string, number> => {
  const m = new Map<string, number>();
  for (const r of rs) {
    const k = String(r[key] ?? '—');
    m.set(k, (m.get(k) ?? 0) + (Number(r[measure]) || 0));
  }
  return m;
};

export const groupCount = (rs: DashRow[], key: string): Map<string, number> => {
  const m = new Map<string, number>();
  for (const r of rs) {
    const k = String(r[key] ?? '—');
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
};

/** Build a basic horizontal bar chart from a Map<string, number>. */
export function barChart(data: Map<string, number>, color = '#10b981', topN = 10): EChartsOption | null {
  const top = [...data.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
  if (top.length === 0) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '4%', right: '4%', bottom: 30, top: 10, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: top.map((t) => t[0]).reverse() },
    series: [{ type: 'bar', data: top.map((t) => t[1]).reverse(), itemStyle: { color, borderRadius: [0, 6, 6, 0] } }],
  };
}

/** Build a donut/pie chart from a Map<string, number>. */
export function donutChart(data: Map<string, number>, palette?: string[]): EChartsOption | null {
  const entries = [...data.entries()].filter((e) => e[1] > 0);
  if (entries.length === 0) return null;
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    color: palette ?? ['#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#22c55e'],
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: true,
        label: { show: false },
        data: entries.map(([name, value]) => ({ name, value })),
      },
    ],
  };
}

/** Build a line/area chart of daily totals from a list of {date,value} rows. */
export function trendChart(
  rs: DashRow[],
  dateField: string,
  measure: string,
  color = '#3b82f6',
): EChartsOption | null {
  const byDay = new Map<string, number>();
  for (const r of rs) {
    const d = String(r[dateField] ?? '').slice(0, 10);
    if (!d) continue;
    byDay.set(d, (byDay.get(d) ?? 0) + (Number(r[measure]) || 0));
  }
  const sorted = [...byDay.entries()].sort();
  if (sorted.length === 0) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, bottom: 30, top: 10 },
    xAxis: { type: 'category', data: sorted.map((s) => s[0]) },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        areaStyle: { opacity: 0.15 },
        data: sorted.map((s) => s[1]),
        itemStyle: { color },
        lineStyle: { color, width: 2 },
      },
    ],
  };
}

/** A handy ISO-date helper: returns YYYY-MM-DD for N days ago. */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
