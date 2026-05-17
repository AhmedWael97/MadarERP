/**
 * FinancialReportShell — shared scaffold for the 7 accounting reports.
 *
 * All 7 reference reports follow the same shape:
 *   1. Title + subtitle (page header)
 *   2. Filter card (date range + optional report-specific filter like account)
 *   3. Toolbar (export buttons via DataTableToolbar)
 *   4. Results table (custom per-report render)
 *
 * Strategy: wrap ERPNext's built-in `frappe.desk.query_report.run`. ERPNext
 * already ships solid implementations of GL, Trial Balance, Balance Sheet,
 * P&L, Cash Flow, AR/AP Aging — we just reuse them and render with our
 * reference styling.
 *
 * Usage:
 *   <FinancialReportShell
 *     title="ميزان المراجعة"
 *     subtitle="عرض أرصدة جميع الحسابات"
 *     reportName="Trial Balance"
 *     filters={{ from_date, to_date, company }}
 *     extraFilterUI={<DatePicker ... />}
 *     columns={[...]}   // optional override; otherwise uses ERPNext's columns
 *   />
 */
import { ReactNode, useMemo, useState } from 'react';
import { useFrappePostCall } from 'frappe-react-sdk';
import { Download, FileSpreadsheet, Printer, Search } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

export interface ReportColumn {
  /** Raw header text — keep Arabic if reference uses Arabic. */
  label: string;
  /** Field id from ERPNext query_report result (usually camelCase like `account_number`). */
  fieldname: string;
  /** Cell render override. Default: stringify with currency/number formatting. */
  render?: (row: Record<string, unknown>) => ReactNode;
  /** Treat as number — formats with thousands separators + 2 decimals. */
  numeric?: boolean;
  /** Override width hint (px). */
  width?: number;
}

interface Props {
  title: string;
  subtitle?: string;
  /** Frappe report identifier (matches what `bench list-reports` would show). */
  reportName: string;
  /** Filter values passed to query_report. */
  filters: Record<string, unknown>;
  /** Custom filter UI rendered above the report (date pickers etc.). */
  filterUI: ReactNode;
  /** Result columns to render. */
  columns: ReportColumn[];
  /** Pass-through for required perm doctype check. */
  permDoctype?: string;
  /** Hide the export buttons (some reports want their own layout). */
  hideExport?: boolean;
  /** Auto-trigger fetch on mount (default true). When false, only on Search click. */
  autoFetch?: boolean;
  /** Optional results override: when provided, the shell renders these instead of calling query_report. Used by reports that aggregate client-side. */
  results?: Array<Record<string, unknown>>;
  /** Optional footer row (totals etc.). */
  footer?: ReactNode;
  /** Empty-state message when no rows. */
  emptyMessage?: string;
}

export function FinancialReportShell({
  title,
  subtitle,
  reportName,
  filters,
  filterUI,
  columns,
  permDoctype,
  hideExport,
  autoFetch = true,
  results: overrideResults,
  footer,
  emptyMessage = 'لا توجد بيانات للفترة المحددة',
}: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { call, result, loading } = useFrappePostCall<{
    message?: { columns?: any[]; result?: Array<Record<string, unknown>> };
  }>('frappe.desk.query_report.run');

  // Fetch results — fires on first render (when autoFetch) and on every search click.
  useMemo(() => {
    if (overrideResults) return; // caller is supplying results — don't hit Frappe
    if (!autoFetch && refreshKey === 0) return;
    void call({
      report_name: reportName,
      filters,
      ignore_prepared_report: 0,
    } as any).catch(() => { /* surfaced via UI */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const rows = overrideResults ?? result?.message?.result ?? [];

  // Wire toolbar export columns to the report's display columns.
  const toolbarColumns: ToolbarColumn[] = columns.map((c) => ({ id: c.fieldname, header: c.label }));

  const body = (
    <div className="space-y-6">
      {/* Filter card */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filterUI}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="w-full px-4 py-2.5 bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Search size={16} /> عرض
            </button>
          </div>
        </div>

        {!hideExport && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
            <button type="button" onClick={() => downloadCsv(columns, rows, `${reportName}.csv`)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5">
              <FileSpreadsheet size={16} /> تحميل Excel
            </button>
            <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5">
              <Download size={16} /> عرض PDF
            </button>
            <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5">
              <Printer size={16} /> طباعة
            </button>
          </div>
        )}
      </div>

      {/* Toolbar (copy / hide columns / template / import) — applies to the visible table. */}
      <DataTableToolbar
        doctype={undefined}
        columns={toolbarColumns}
        rows={rows}
        hide={{ import: true, template: true }}
      />

      {/* Results */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {columns.map((c) => (
                  <th key={c.fieldname} className="px-5 py-3 text-start whitespace-nowrap" style={c.width ? { width: c.width } : undefined}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading && (<tr><td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!loading && rows.length === 0 && (<tr><td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-400">{emptyMessage}</td></tr>)}
              {!loading && rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  {columns.map((c) => (
                    <td key={c.fieldname} className={'px-5 py-3 text-sm ' + (c.numeric ? 'font-mono text-end' : '')}>
                      {c.render ? c.render(row) : c.numeric ? fmtNum(Number(row[c.fieldname] ?? 0)) : (row[c.fieldname] as ReactNode) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {footer && <tfoot>{footer}</tfoot>}
          </table>
        </div>
      </div>
    </div>
  );

  if (permDoctype) {
    return (
      <RequirePerm doctype={permDoctype} action="read">
        <PageShell title={title} subtitle={subtitle}>{body}</PageShell>
      </RequirePerm>
    );
  }
  return <PageShell title={title} subtitle={subtitle}>{body}</PageShell>;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '—';
  try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); } catch { return String(n); }
}

function downloadCsv(columns: ReportColumn[], rows: Array<Record<string, unknown>>, filename: string) {
  const escape = (s: string) => (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => {
      const v = row[c.fieldname];
      const s = v === null || v === undefined ? '' : c.numeric ? fmtNum(Number(v)) : String(v);
      return escape(s);
    }).join(',')
  ).join('\n');
  const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

// Reusable date-range filter inputs (used by 6 of 7 reports).
export function DateRangeFilters({
  fromDate,
  toDate,
  onFromDate,
  onToDate,
}: {
  fromDate: string;
  toDate: string;
  onFromDate: (v: string) => void;
  onToDate: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">من تاريخ</label>
        <input type="date" value={fromDate} onChange={(e) => onFromDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">إلى تاريخ</label>
        <input type="date" value={toDate} onChange={(e) => onToDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm" />
      </div>
    </>
  );
}
