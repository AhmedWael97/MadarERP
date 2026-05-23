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
import { Link } from 'react-router-dom';
import { useFrappeGetCall, useFrappeGetDocList, useFrappePostCall } from 'frappe-react-sdk';
import { Download, FileSpreadsheet, Printer, Search } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { useTenantStore } from '@/lib/store/tenantStore';

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
  /** Optional row transform (used for tree collapse behavior on some reports). */
  rowTransform?: (rows: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
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
  rowTransform,
}: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [hideSubAccounts, setHideSubAccounts] = useState(false);
  const { call, result, loading } = useFrappePostCall<{
    message?: { columns?: Array<{ fieldname: string; label: string; fieldtype?: string }>; result?: Array<unknown> };
  }>('frappe.desk.query_report.run');

  // ── Auto-resolve `company` filter ──────────────────────────────────────────
  // Every ERPNext accounting report requires a `company` filter — without it
  // the report either errors or silently returns zero rows. We resolve it in
  // this priority:
  //   1. Caller passed `company` explicitly in the filters object.
  //   2. Super-admin "opened" a tenant → activeCompanyName.
  //   3. First Company in the system (covers the common single-tenant case).
  const activeCompanyName = useTenantStore((s) => s.activeCompanyName);
  const { data: companiesResp } = useFrappeGetDocList<{ name: string }>('Company', {
    fields: ['name'],
    limit: 1,
    orderBy: { field: 'creation', order: 'asc' },
  }, activeCompanyName || (filters as any)?.company ? null : 'reports:first-company');
  const fallbackCompany = activeCompanyName || companiesResp?.[0]?.name;

  // ── Auto-resolve `fiscal_year` filter ─────────────────────────────────────
  // Trial Balance / Balance Sheet / Income Statement / Cash Flow ALL require
  // `fiscal_year` in addition to `company` — without it they throw
  // "Fiscal Year None is required". We pick the FY whose date range contains
  // the report's `to_date` (or `report_date`, for the Aging variant), falling
  // back to today.
  const { data: fyResp } = useFrappeGetDocList<{ name: string; year_start_date: string; year_end_date: string }>(
    'Fiscal Year',
    {
      fields: ['name', 'year_start_date', 'year_end_date'],
      limit: 20,
      orderBy: { field: 'year_start_date', order: 'desc' },
    },
    'reports:fiscal-years',
  );

  const resolvedFilters = useMemo(() => {
    const out: Record<string, unknown> = { ...filters };
    if (!out.company && fallbackCompany) {
      out.company = fallbackCompany;
    }
    // Fiscal year picker: only if the caller hasn't supplied one. Pick the FY
    // that contains the report's reference date — different reports use
    // different filter names: Trial Balance uses `to_date`, Balance Sheet /
    // P&L / Cash Flow use `period_end_date`, Aging uses `report_date`. Fall
    // back to today.
    if (!out.fiscal_year && fyResp && fyResp.length) {
      const refDate =
        (out.to_date as string) ||
        (out.period_end_date as string) ||
        (out.report_date as string) ||
        new Date().toISOString().slice(0, 10);
      const fy = fyResp.find(
        (f) => f.year_start_date <= refDate && refDate <= f.year_end_date,
      );
      // String comparison is fine here because both sides are `YYYY-MM-DD`.
      if (fy) out.fiscal_year = fy.name;
      else out.fiscal_year = fyResp[0].name; // fall back to the most recent FY
    }
    return out;
  }, [filters, fallbackCompany, fyResp]);

  // Fetch results — fires on first render (when autoFetch) and on every search click.
  useMemo(() => {
    if (overrideResults) return; // caller is supplying results — don't hit Frappe
    if (!autoFetch && refreshKey === 0) return;
    // Don't fire until we have a company resolved, otherwise the very first
    // render hits the report with no company and gets back zero rows.
    if (!resolvedFilters.company) return;
    void call({
      report_name: reportName,
      filters: resolvedFilters,
      ignore_prepared_report: 0,
    } as any).catch(() => { /* surfaced via UI */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, resolvedFilters.company]);

  const rawRows: Array<unknown> = overrideResults ?? result?.message?.result ?? [];
  const reportCols = result?.message?.columns ?? [];

  // ERPNext script reports return rows as arrays (not objects).
  // Convert them to objects using the column definitions from the response.
  const rows: Array<Record<string, unknown>> = useMemo(() => {
    if (!rawRows.length) return [];
    const first = rawRows[0];
    if (Array.isArray(first)) {
      return (rawRows as unknown[][]).map((row) => {
        const obj: Record<string, unknown> = {};
        row.forEach((val, i) => {
          const colDef = reportCols[i];
          if (colDef?.fieldname) obj[colDef.fieldname] = val;
        });
        return obj;
      });
    }
    return rawRows as Array<Record<string, unknown>>;
  }, [rawRows, reportCols]);

  const visibleRows: Array<Record<string, unknown>> = useMemo(() => {
    const base = hideSubAccounts
      ? rows.filter((r) => Number(r.indent ?? 0) === 0 || Number(r.is_group ?? 0) === 1)
      : rows;
    return rowTransform ? rowTransform(base) : base;
  }, [rows, hideSubAccounts, rowTransform]);

  const totals = useMemo(() => {
    const debit = visibleRows.reduce((s, r) => {
      const v = Number(r.debit ?? r.closing_debit ?? 0);
      if (Number.isFinite(v)) return s + v;
      const t = Number(r.total ?? 0);
      return t > 0 ? s + t : s;
    }, 0);
    const credit = visibleRows.reduce((s, r) => {
      const v = Number(r.credit ?? r.closing_credit ?? 0);
      if (Number.isFinite(v)) return s + v;
      const t = Number(r.total ?? 0);
      return t < 0 ? s + Math.abs(t) : s;
    }, 0);
    return { debit, credit, diff: debit - credit };
  }, [visibleRows]);

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

        <div className="mt-3 flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={hideSubAccounts}
              onChange={(e) => setHideSubAccounts(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            إخفاء الحسابات الفرعية
          </label>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/20 p-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">إجمالي المدين</p>
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-200">{fmtNum(totals.debit)}</p>
        </div>
        <div className="rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-900/20 p-4">
          <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">إجمالي الدائن</p>
          <p className="text-xl font-black text-rose-700 dark:text-rose-200">{fmtNum(totals.credit)}</p>
        </div>
        <div className="rounded-xl border border-violet-100 dark:border-violet-900/40 bg-violet-50/70 dark:bg-violet-900/20 p-4">
          <p className="text-xs text-violet-700 dark:text-violet-300 mb-1">الفرق</p>
          <p className="text-xl font-black text-violet-700 dark:text-violet-200">{fmtNum(totals.diff)}</p>
        </div>
      </div>

      {/* Toolbar (copy / hide columns / template / import) — applies to the visible table. */}
      <DataTableToolbar
        doctype={undefined}
        columns={toolbarColumns}
        rows={visibleRows}
        hide={{ import: true, template: true }}
      />

      {/* Results */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {columns.map((c) => (
                  <th
                    key={c.fieldname}
                    // Numeric columns: right-aligned in BOTH directions
                    // (accounting convention — keeps digits column-aligned for
                    // visual totaling). text-right is the physical property;
                    // text-end would flip to left in RTL which we DON'T want.
                    // Text columns: text-start follows direction (right in
                    // RTL / left in LTR) so Arabic and English headers both
                    // sit on their natural reading edge.
                    className={'px-5 py-3 whitespace-nowrap ' + (c.numeric ? 'text-right' : 'text-start')}
                    style={c.width ? { width: c.width } : undefined}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading && (<tr><td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!loading && visibleRows.length === 0 && (<tr><td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-400">{emptyMessage}</td></tr>)}
              {!loading && visibleRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  {columns.map((c) => (
                    <td
                      key={c.fieldname}
                      // Same alignment rule as the header. dir="ltr" on
                      // numeric cells keeps "15,123.45" reading left-to-right
                      // even though the surrounding page is RTL — otherwise
                      // the comma and decimal jump around.
                      className={'px-5 py-3 text-sm ' + (c.numeric ? 'font-mono text-right' : 'text-start')}
                      dir={c.numeric ? 'ltr' : undefined}
                    >
                      {c.render
                        ? c.render(row)
                        : c.numeric
                          ? fmtNum(Number(row[c.fieldname] ?? 0))
                          : (() => {
                              const raw = row[c.fieldname];
                              const href = resolveReportCellHref(c.fieldname, row, reportName);
                              if (href && raw) {
                                return (
                                  <Link to={href} className="text-[color:var(--color-brand-600)] hover:underline font-semibold">
                                    {String(raw)}
                                  </Link>
                                );
                              }
                              return (raw as ReactNode) ?? '—';
                            })()}
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

function resolveReportCellHref(fieldname: string, row: Record<string, unknown>, reportName: string): string | null {
  const encode = (v: unknown) => encodeURIComponent(String(v ?? ''));
  if (fieldname === 'voucher_no' && row.voucher_no) {
    const v = String(row.voucher_no);
    const voucherType = String(row.voucher_type ?? '');
    if (voucherType === 'Journal Entry') return `/accounting/journal-entries/${encode(v)}`;
    if (voucherType === 'Sales Invoice') return `/sales/invoices/${encode(v)}`;
    if (voucherType === 'Sales Order') return `/sales/orders/${encode(v)}`;
    if (voucherType === 'Quotation') return `/sales/quotations/${encode(v)}`;
    if (voucherType === 'Purchase Invoice') return `/purchases/invoices/${encode(v)}`;
    if (voucherType === 'Purchase Order') return `/purchases/orders/${encode(v)}`;
    if (voucherType === 'Purchase Return') return `/purchases/returns/${encode(v)}`;
    if (voucherType === 'Sales Return') return `/sales/returns/${encode(v)}`;
    return null;
  }
  if (fieldname === 'name' && row.name) {
    const name = String(row.name);
    if (reportName === 'Accounts Receivable') return `/sales/invoices/${encode(name)}`;
    if (reportName === 'Accounts Payable') return `/purchases/invoices/${encode(name)}`;
    return null;
  }
  if (fieldname === 'account' && row.account) {
    return `/accounting/chart-of-accounts/${encode(row.account)}/edit`;
  }
  if (fieldname === 'party' && row.party) {
    const partyType = String(row.party_type ?? '');
    if (partyType === 'Customer') return `/customers/${encode(row.party)}`;
    if (partyType === 'Supplier') return `/suppliers/${encode(row.party)}`;
  }
  return null;
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
