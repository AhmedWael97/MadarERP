import { ReactNode, useMemo, useState } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Download, RefreshCw, Filter as FilterIcon } from 'lucide-react';
import { ErrorPanel } from './ErrorPanel';
import { translateHeader } from './columnMapping';
import { REPORT_CONFIGS, defaultReportConfig } from '../../lib/reports/configs';

/**
 * Custom report runner — replaces Frappe's Query Report UI.
 *
 * We deliberately don't call `frappe.desk.query_report.run`: it returns Frappe's
 * native report bundle (filters, columns, results) which couples our UI to
 * Frappe's report defs. Instead, a Madaar report is just a SQL-friendly
 * aggregation over a DocType, configured here in TypeScript and executed via
 * the bog-standard `frappe.client.get_list` endpoint. The benefit: complete
 * control over how reports look + we can mix multiple DocTypes per report.
 *
 * Design:
 *   - Pass a `ReportConfig` describing one DocType, fields, filters, group_by,
 *     and an optional chart spec. ReportShell fetches the data, builds a
 *     summary card row, optionally renders an ECharts chart, then a table.
 *   - Filters render as a top bar (Date range / Status / etc.). Changing a
 *     filter re-runs the query.
 *   - Export-to-CSV button generates the file client-side from the current view.
 *
 * The generated report pages instantiate this with a per-page config. Pages
 * that need something this can't express (e.g. cross-DocType joins) become
 * hand-written overrides.
 */

export interface ReportColumn {
  /** Frappe fieldname (or aggregate alias like `sum_grand_total`). */
  id: string;
  /** Header label, possibly Arabic. translateHeader() will localize. */
  header: string;
  /** Optional fieldtype hint for formatting (Currency, Date, Int, Float, Check). */
  fieldtype?: string;
  /** Optional custom cell renderer. */
  render?: (row: Record<string, unknown>) => ReactNode;
  /** Whether this column is summed in the totals row. */
  isMeasure?: boolean;
}

export interface ReportKPI {
  label: string;
  /** Reducer over the fetched rows. Receives all rows post-filter. */
  compute: (rows: Record<string, unknown>[]) => number | string;
  /** Optional formatter (default: Intl.NumberFormat). */
  format?: (v: number | string) => string;
  variant?: 'emerald' | 'orange' | 'violet' | 'teal' | 'rose' | 'sky';
}

export interface ReportChart {
  /** ECharts option builder — receives the fetched rows. Return null to hide. */
  build: (rows: Record<string, unknown>[]) => EChartsOption | null;
  /** Chart card title. */
  title?: string;
  height?: number;
}

export interface ReportFilterField {
  /** Internal key, also passed to Frappe as the filter fieldname. */
  fieldname: string;
  label: string;
  type: 'date' | 'daterange' | 'select' | 'link' | 'text';
  /** For type=select: option list. For type=link: target DocType. */
  options?: string[] | string;
  /** Initial value. */
  defaultValue?: string | { from: string; to: string };
}

export interface ReportConfig {
  /** Source DocType. */
  doctype: string;
  /** Fields to fetch (must include any field referenced in columns / kpis / chart). */
  fields: string[];
  /** Static filters always applied (e.g., `docstatus=1`). */
  baseFilters?: Array<[string, string, unknown]>;
  /** User-controllable filters surfaced in the top bar. */
  filters?: ReportFilterField[];
  /** Default ordering. */
  orderBy?: { field: string; order: 'asc' | 'desc' };
  /** Max rows fetched (default 1000). */
  limit?: number;
  /** Table columns. */
  columns: ReportColumn[];
  /** Optional KPI tiles drawn above the table. */
  kpis?: ReportKPI[];
  /** Optional chart card drawn between KPIs and table. */
  chart?: ReportChart;
}

interface Props {
  config: ReportConfig;
  /** Page title shown above the filter bar. Usually rendered by <PageShell> instead. */
  title?: string;
}

const KPI_VARIANT: Record<NonNullable<ReportKPI['variant']>, string> = {
  emerald: 'from-[color:var(--color-emerald-500)] to-[color:var(--color-emerald-600)]',
  orange: 'from-[color:var(--color-orange-400)] to-[color:var(--color-orange-500)]',
  violet: 'from-[color:var(--color-violet-400)] to-[color:var(--color-violet-600)]',
  teal: 'from-[color:var(--color-teal-400)] to-[color:var(--color-teal-600)]',
  rose: 'from-[color:var(--color-rose-400)] to-[color:var(--color-rose-600)]',
  sky: 'from-[color:var(--color-sky-400)] to-[color:var(--color-sky-600)]',
};

/**
 * Convenience wrapper that resolves a route path to a config and renders a friendly
 * "not configured" panel if no config + no fallback DocType is available. Generated
 * report pages always use this entry point.
 */
export function ReportPage({ routePath, doctype }: { routePath: string; doctype?: string | null }) {
  const { t } = useTranslation();
  const config: ReportConfig | null =
    REPORT_CONFIGS[routePath] ?? (doctype ? defaultReportConfig(doctype) : null);
  if (!config) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-card)] px-6 py-10 text-center text-sm text-[color:var(--color-muted)] shadow-[var(--shadow-card)]">
        {t('report.not_configured', {
          defaultValue:
            'This report has not been configured yet. Add an entry in src/lib/reports/configs.ts.',
        })}
      </div>
    );
  }
  return <ReportShell config={config} />;
}

export function ReportShell({ config }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  // Filter state, seeded from config defaults.
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of config.filters ?? []) {
      if (f.defaultValue !== undefined) init[f.fieldname] = f.defaultValue;
    }
    return init;
  });

  // Build Frappe filter triples from baseFilters + active filter values.
  const liveFilters = useMemo<Array<[string, string, unknown]>>(() => {
    const out: Array<[string, string, unknown]> = [...(config.baseFilters ?? [])];
    for (const f of config.filters ?? []) {
      const v = filterValues[f.fieldname];
      if (v === undefined || v === '' || v === null) continue;
      if (f.type === 'daterange' && typeof v === 'object' && v !== null) {
        const r = v as { from?: string; to?: string };
        if (r.from) out.push([f.fieldname, '>=', r.from]);
        if (r.to) out.push([f.fieldname, '<=', r.to]);
      } else {
        out.push([f.fieldname, '=', v]);
      }
    }
    return out;
  }, [config.baseFilters, config.filters, filterValues]);

  const { data, isLoading, error, mutate } = useFrappeGetDocList<Record<string, unknown>>(
    config.doctype,
    {
      fields: config.fields,
      filters: liveFilters as any,
      orderBy: config.orderBy ?? { field: 'modified', order: 'desc' },
      limit: config.limit ?? 1000,
    },
  );

  const rows = data ?? [];

  if (error) return <ErrorPanel error={error} onRetry={() => mutate()} />;

  return (
    <div className="space-y-5">
      {/* Filters */}
      {config.filters && config.filters.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--color-slate-700)]">
            <FilterIcon size={14} />
            <span>{t('action.filter')}</span>
          </div>
          {config.filters.map((f) => (
            <FilterControl
              key={f.fieldname}
              field={f}
              value={filterValues[f.fieldname]}
              onChange={(v) => setFilterValues((prev) => ({ ...prev, [f.fieldname]: v }))}
            />
          ))}
          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-slate-700)] hover:bg-[color:var(--color-app-bg)]"
              title={t('action.refresh')}
            >
              <RefreshCw size={13} />
              {t('action.refresh')}
            </button>
            <button
              type="button"
              onClick={() => exportToCsv(config, rows)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-slate-700)] hover:bg-[color:var(--color-app-bg)]"
              title={t('action.export')}
            >
              <Download size={13} />
              {t('action.export')}
            </button>
          </div>
        </div>
      )}

      {/* KPI tiles */}
      {config.kpis && config.kpis.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {config.kpis.map((k) => {
            const raw = isLoading ? '—' : k.compute(rows);
            const formatted = typeof raw === 'number'
              ? (k.format ?? ((v) => new Intl.NumberFormat(locale).format(Number(v))))(raw)
              : String(raw);
            const variant = KPI_VARIANT[k.variant ?? 'emerald'];
            return (
              <div
                key={k.label}
                className={`overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br ${variant} p-5 text-white shadow-[var(--shadow-card)]`}
              >
                <p className="text-xs font-medium opacity-90">{k.label}</p>
                <p className="mt-2 text-2xl font-bold">{formatted}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {config.chart && (
        <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5 shadow-[var(--shadow-card)]">
          {config.chart.title && (
            <div className="mb-3 text-sm font-semibold text-[color:var(--color-slate-700)]">
              {config.chart.title}
            </div>
          )}
          {(() => {
            const option = config.chart.build(rows);
            if (!option) {
              return (
                <div className="py-8 text-center text-sm text-[color:var(--color-muted)]">
                  {t('common.empty')}
                </div>
              );
            }
            return (
              <ReactECharts
                option={option}
                style={{ height: config.chart.height ?? 320 }}
                opts={{ renderer: 'svg' }}
              />
            );
          })()}
        </div>
      )}

      {/* Data table */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-app-bg)] text-xs uppercase text-[color:var(--color-muted)]">
            <tr>
              {config.columns.map((c) => (
                <th key={c.id} className="px-3 py-2 text-start font-medium">
                  {translateHeader(c.header, i18n.language)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={config.columns.length} className="px-3 py-6 text-center text-[color:var(--color-muted)]">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={config.columns.length} className="px-3 py-6 text-center text-[color:var(--color-muted)]">
                  {t('common.empty')}
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row, i) => (
                <tr
                  key={(row.name as string) ?? i}
                  className="border-t border-[color:var(--color-border)] hover:bg-[color:var(--color-app-bg)]"
                >
                  {config.columns.map((c) => (
                    <td key={c.id} className="px-3 py-2 align-top">
                      {renderCell(row, c, locale)}
                    </td>
                  ))}
                </tr>
              ))}
            {/* Totals row — sums every column flagged isMeasure. */}
            {!isLoading && rows.length > 0 && config.columns.some((c) => c.isMeasure) && (
              <tr className="border-t-2 border-[color:var(--color-border)] bg-[color:var(--color-app-bg)] font-semibold">
                {config.columns.map((c, idx) => {
                  if (idx === 0) {
                    return (
                      <td key={c.id} className="px-3 py-2 text-[color:var(--color-slate-700)]">
                        {t('common.total', { defaultValue: 'Total' })}
                      </td>
                    );
                  }
                  if (!c.isMeasure) {
                    return <td key={c.id} className="px-3 py-2" />;
                  }
                  const sum = rows.reduce((acc, r) => acc + (Number(r[c.id]) || 0), 0);
                  return (
                    <td key={c.id} className="px-3 py-2 text-[color:var(--color-slate-700)]">
                      {new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(sum)}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
        <div className="border-t border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-muted)]">
          {rows.length} {t('common.records', { defaultValue: 'records' })}
        </div>
      </div>
    </div>
  );
}

function renderCell(row: Record<string, unknown>, col: ReportColumn, locale: string): ReactNode {
  if (col.render) return col.render(row);
  const value = row[col.id];
  if (value === null || value === undefined || value === '') return '—';
  if (col.fieldtype === 'Currency' || col.fieldtype === 'Float') {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(value));
  }
  if (col.fieldtype === 'Int') {
    return new Intl.NumberFormat(locale).format(Number(value));
  }
  if (col.fieldtype === 'Date' || col.fieldtype === 'Datetime') {
    const d = new Date(value as string);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(locale);
  }
  if (col.fieldtype === 'Check') return value ? '✓' : '—';
  return String(value);
}

interface FilterControlProps {
  field: ReportFilterField;
  value: unknown;
  onChange: (v: unknown) => void;
}

function FilterControl({ field, value, onChange }: FilterControlProps) {
  const inputClass =
    'rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-2.5 py-1.5 text-xs text-[color:var(--color-slate-700)] outline-none focus:ring-2 ring-primary';

  if (field.type === 'date') {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase text-[color:var(--color-muted)]">{field.label}</span>
        <input type="date" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </label>
    );
  }
  if (field.type === 'daterange') {
    const r = (value as { from?: string; to?: string }) ?? {};
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase text-[color:var(--color-muted)]">{field.label}</span>
        <div className="flex items-center gap-1.5">
          <input type="date" value={r.from ?? ''} onChange={(e) => onChange({ ...r, from: e.target.value })} className={inputClass} />
          <span className="text-xs text-[color:var(--color-muted)]">→</span>
          <input type="date" value={r.to ?? ''} onChange={(e) => onChange({ ...r, to: e.target.value })} className={inputClass} />
        </div>
      </label>
    );
  }
  if (field.type === 'select') {
    const opts = (field.options as string[]) ?? [];
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase text-[color:var(--color-muted)]">{field.label}</span>
        <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">—</option>
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase text-[color:var(--color-muted)]">{field.label}</span>
      <input type="text" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </label>
  );
}

/** Generate a CSV from the current rows and trigger a browser download. */
function exportToCsv(config: ReportConfig, rows: Record<string, unknown>[]) {
  const headers = config.columns.map((c) => csvEscape(c.header));
  const lines = rows.map((r) =>
    config.columns.map((c) => csvEscape(String(r[c.id] ?? ''))).join(','),
  );
  const csv = [headers.join(','), ...lines].join('\n');
  // BOM ensures Excel opens UTF-8 correctly (matters for Arabic).
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.doctype.replace(/\s+/g, '-').toLowerCase()}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
