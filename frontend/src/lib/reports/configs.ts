/**
 * Catalog of report configurations.
 *
 * Each entry maps a route path (`/sales/reports/by-customer`) to a `ReportConfig`
 * that <ReportShell> consumes. The generator looks up a route here when emitting
 * pages with viewType=report; pages without an entry fall back to a generic
 * "list view of the source DocType" placeholder.
 *
 * Add new entries as you build out reports. The pattern is intentionally
 * static-import-friendly so Vite tree-shakes unused configs.
 */
import type { ReportConfig } from '../../components/erp/ReportShell';

/** Helper: format currency in the active locale. */
const currency = (v: number | string): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(v) || 0);

const RECEIVABLE_AGING_BUCKETS = [
  { label: '0–30', min: 0, max: 30 },
  { label: '31–60', min: 31, max: 60 },
  { label: '61–90', min: 61, max: 90 },
  { label: '90+', min: 91, max: Infinity },
] as const;

function daysSince(dateStr: unknown): number {
  if (!dateStr) return 0;
  const d = new Date(String(dateStr));
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export const REPORT_CONFIGS: Record<string, ReportConfig> = {
  // ---------- Sales ----------

  '/sales/reports/by-customer': {
    doctype: 'Sales Invoice',
    fields: ['name', 'customer', 'customer_name', 'posting_date', 'grand_total', 'outstanding_amount', 'status'],
    baseFilters: [['docstatus', '=', 1]],
    filters: [
      { fieldname: 'posting_date', label: 'Date', type: 'daterange' },
      { fieldname: 'status', label: 'Status', type: 'select', options: ['Paid', 'Unpaid', 'Overdue', 'Cancelled'] },
    ],
    orderBy: { field: 'grand_total', order: 'desc' },
    columns: [
      { id: 'customer_name', header: 'العميل' },
      { id: 'grand_total', header: 'الإجمالي', fieldtype: 'Currency', isMeasure: true },
      { id: 'outstanding_amount', header: 'المتبقي', fieldtype: 'Currency', isMeasure: true },
      { id: 'status', header: 'الحالة' },
    ],
    kpis: [
      {
        label: 'إجمالي المبيعات',
        compute: (rows) => rows.reduce((s, r) => s + (Number(r.grand_total) || 0), 0),
        format: currency,
        variant: 'emerald',
      },
      {
        label: 'العملاء',
        compute: (rows) => new Set(rows.map((r) => r.customer)).size,
        variant: 'violet',
      },
      {
        label: 'المتبقي',
        compute: (rows) => rows.reduce((s, r) => s + (Number(r.outstanding_amount) || 0), 0),
        format: currency,
        variant: 'orange',
      },
    ],
    chart: {
      title: 'أفضل 10 عملاء',
      build: (rows) => {
        const totals = new Map<string, number>();
        for (const r of rows) {
          const k = String(r.customer_name ?? r.customer ?? '—');
          totals.set(k, (totals.get(k) ?? 0) + (Number(r.grand_total) || 0));
        }
        const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (top.length === 0) return null;
        return {
          tooltip: { trigger: 'axis' },
          grid: { left: '5%', right: '5%', bottom: 30, top: 10, containLabel: true },
          xAxis: { type: 'value' },
          yAxis: { type: 'category', data: top.map((t) => t[0]).reverse() },
          series: [{ type: 'bar', data: top.map((t) => t[1]).reverse(), itemStyle: { color: '#10b981' } }],
        };
      },
    },
  },

  '/sales/reports/by-product': {
    doctype: 'Sales Invoice Item',
    fields: ['item_code', 'item_name', 'qty', 'amount', 'rate', 'parent'],
    orderBy: { field: 'amount', order: 'desc' },
    limit: 500,
    columns: [
      { id: 'item_name', header: 'الصنف' },
      { id: 'qty', header: 'الكمية', fieldtype: 'Float', isMeasure: true },
      { id: 'rate', header: 'السعر', fieldtype: 'Currency' },
      { id: 'amount', header: 'الإجمالي', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: [
      {
        label: 'إجمالي المبيعات',
        compute: (rows) => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
        format: currency,
        variant: 'emerald',
      },
      {
        label: 'الكمية',
        compute: (rows) => rows.reduce((s, r) => s + (Number(r.qty) || 0), 0),
        variant: 'teal',
      },
    ],
  },

  '/sales/reports/daily': {
    doctype: 'Sales Invoice',
    fields: ['name', 'posting_date', 'grand_total', 'customer_name'],
    baseFilters: [['docstatus', '=', 1]],
    filters: [{ fieldname: 'posting_date', label: 'Date', type: 'daterange' }],
    orderBy: { field: 'posting_date', order: 'desc' },
    columns: [
      { id: 'posting_date', header: 'التاريخ', fieldtype: 'Date' },
      { id: 'name', header: 'رقم الفاتورة' },
      { id: 'customer_name', header: 'العميل' },
      { id: 'grand_total', header: 'الإجمالي', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: [
      {
        label: 'إجمالي اليوم',
        compute: (rows) => rows.reduce((s, r) => s + (Number(r.grand_total) || 0), 0),
        format: currency,
        variant: 'emerald',
      },
      { label: 'عدد الفواتير', compute: (rows) => rows.length, variant: 'violet' },
    ],
    chart: {
      title: 'المبيعات اليومية',
      build: (rows) => {
        const byDay = new Map<string, number>();
        for (const r of rows) {
          const k = String(r.posting_date ?? '').slice(0, 10);
          if (!k) continue;
          byDay.set(k, (byDay.get(k) ?? 0) + (Number(r.grand_total) || 0));
        }
        const sorted = [...byDay.entries()].sort();
        if (sorted.length === 0) return null;
        return {
          tooltip: { trigger: 'axis' },
          grid: { left: 50, right: 20, bottom: 40, top: 20 },
          xAxis: { type: 'category', data: sorted.map((s) => s[0]) },
          yAxis: { type: 'value' },
          series: [{ type: 'line', smooth: true, areaStyle: {}, data: sorted.map((s) => s[1]), itemStyle: { color: '#10b981' } }],
        };
      },
    },
  },

  '/sales/reports/aging': {
    doctype: 'Sales Invoice',
    fields: ['name', 'customer_name', 'posting_date', 'due_date', 'outstanding_amount'],
    baseFilters: [['docstatus', '=', 1], ['outstanding_amount', '>', 0]],
    orderBy: { field: 'due_date', order: 'asc' },
    columns: [
      { id: 'name', header: 'رقم الفاتورة' },
      { id: 'customer_name', header: 'العميل' },
      { id: 'due_date', header: 'تاريخ الاستحقاق', fieldtype: 'Date' },
      {
        id: 'aging_days',
        header: 'الأيام',
        render: (r) => daysSince(r.due_date),
      },
      { id: 'outstanding_amount', header: 'المتبقي', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: RECEIVABLE_AGING_BUCKETS.map((b) => ({
      label: `${b.label} يوم`,
      compute: (rows) =>
        rows
          .filter((r) => {
            const d = daysSince(r.due_date);
            return d >= b.min && d <= b.max;
          })
          .reduce((s, r) => s + (Number(r.outstanding_amount) || 0), 0),
      format: currency,
      variant: (b.label === '90+' ? 'rose' : b.label === '61–90' ? 'orange' : b.label === '31–60' ? 'violet' : 'emerald') as
        'rose' | 'orange' | 'violet' | 'emerald',
    })),
  },

  '/sales/reports/summary': {
    doctype: 'Sales Invoice',
    fields: ['name', 'customer_name', 'posting_date', 'grand_total', 'outstanding_amount', 'status'],
    baseFilters: [['docstatus', '=', 1]],
    orderBy: { field: 'posting_date', order: 'desc' },
    columns: [
      { id: 'name', header: 'الفاتورة' },
      { id: 'posting_date', header: 'التاريخ', fieldtype: 'Date' },
      { id: 'customer_name', header: 'العميل' },
      { id: 'grand_total', header: 'الإجمالي', fieldtype: 'Currency', isMeasure: true },
      { id: 'outstanding_amount', header: 'المتبقي', fieldtype: 'Currency', isMeasure: true },
      { id: 'status', header: 'الحالة' },
    ],
    kpis: [
      { label: 'الإجمالي', compute: (r) => r.reduce((s, x) => s + (Number(x.grand_total) || 0), 0), format: currency, variant: 'emerald' },
      { label: 'المتبقي', compute: (r) => r.reduce((s, x) => s + (Number(x.outstanding_amount) || 0), 0), format: currency, variant: 'orange' },
      { label: 'عدد الفواتير', compute: (r) => r.length, variant: 'violet' },
    ],
  },

  // ---------- Purchases ----------

  '/purchases/reports/by-supplier': {
    doctype: 'Purchase Invoice',
    fields: ['name', 'supplier', 'supplier_name', 'posting_date', 'grand_total', 'outstanding_amount', 'status'],
    baseFilters: [['docstatus', '=', 1]],
    orderBy: { field: 'grand_total', order: 'desc' },
    columns: [
      { id: 'supplier_name', header: 'المورد' },
      { id: 'grand_total', header: 'الإجمالي', fieldtype: 'Currency', isMeasure: true },
      { id: 'outstanding_amount', header: 'المستحق', fieldtype: 'Currency', isMeasure: true },
      { id: 'status', header: 'الحالة' },
    ],
    kpis: [
      { label: 'إجمالي المشتريات', compute: (r) => r.reduce((s, x) => s + (Number(x.grand_total) || 0), 0), format: currency, variant: 'emerald' },
      { label: 'الموردين', compute: (r) => new Set(r.map((x) => x.supplier)).size, variant: 'teal' },
      { label: 'المستحق', compute: (r) => r.reduce((s, x) => s + (Number(x.outstanding_amount) || 0), 0), format: currency, variant: 'rose' },
    ],
  },

  '/purchases/reports/summary': {
    doctype: 'Purchase Invoice',
    fields: ['name', 'supplier_name', 'posting_date', 'grand_total', 'outstanding_amount', 'status'],
    baseFilters: [['docstatus', '=', 1]],
    orderBy: { field: 'posting_date', order: 'desc' },
    columns: [
      { id: 'name', header: 'الفاتورة' },
      { id: 'posting_date', header: 'التاريخ', fieldtype: 'Date' },
      { id: 'supplier_name', header: 'المورد' },
      { id: 'grand_total', header: 'الإجمالي', fieldtype: 'Currency', isMeasure: true },
      { id: 'outstanding_amount', header: 'المستحق', fieldtype: 'Currency', isMeasure: true },
      { id: 'status', header: 'الحالة' },
    ],
    kpis: [
      { label: 'الإجمالي', compute: (r) => r.reduce((s, x) => s + (Number(x.grand_total) || 0), 0), format: currency, variant: 'emerald' },
      { label: 'المستحق', compute: (r) => r.reduce((s, x) => s + (Number(x.outstanding_amount) || 0), 0), format: currency, variant: 'orange' },
      { label: 'عدد الفواتير', compute: (r) => r.length, variant: 'violet' },
    ],
  },

  // ---------- Inventory ----------

  '/inventory/reports/stock-status': {
    doctype: 'Bin',
    fields: ['item_code', 'warehouse', 'actual_qty', 'projected_qty', 'reserved_qty', 'valuation_rate', 'stock_value'],
    orderBy: { field: 'actual_qty', order: 'desc' },
    limit: 2000,
    columns: [
      { id: 'item_code', header: 'الصنف' },
      { id: 'warehouse', header: 'المخزن' },
      { id: 'actual_qty', header: 'الكمية الفعلية', fieldtype: 'Float', isMeasure: true },
      { id: 'reserved_qty', header: 'المحجوز', fieldtype: 'Float' },
      { id: 'projected_qty', header: 'المتوقع', fieldtype: 'Float' },
      { id: 'stock_value', header: 'القيمة', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: [
      { label: 'إجمالي القيمة', compute: (r) => r.reduce((s, x) => s + (Number(x.stock_value) || 0), 0), format: currency, variant: 'emerald' },
      { label: 'الأصناف', compute: (r) => new Set(r.map((x) => x.item_code)).size, variant: 'violet' },
    ],
  },

  '/inventory/reports/low-stock': {
    doctype: 'Bin',
    fields: ['item_code', 'warehouse', 'actual_qty', 'reorder_level'],
    orderBy: { field: 'actual_qty', order: 'asc' },
    columns: [
      { id: 'item_code', header: 'الصنف' },
      { id: 'warehouse', header: 'المخزن' },
      { id: 'actual_qty', header: 'الكمية', fieldtype: 'Float' },
    ],
    kpis: [{ label: 'أصناف منخفضة', compute: (r) => r.filter((x) => Number(x.actual_qty) < 10).length, variant: 'rose' }],
  },

  // ---------- HR ----------

  '/hr/reports/employees': {
    doctype: 'Employee',
    fields: ['name', 'employee_name', 'designation', 'department', 'status', 'date_of_joining'],
    orderBy: { field: 'date_of_joining', order: 'desc' },
    columns: [
      { id: 'name', header: 'الرقم' },
      { id: 'employee_name', header: 'الاسم' },
      { id: 'designation', header: 'المسمى الوظيفي' },
      { id: 'department', header: 'القسم' },
      { id: 'date_of_joining', header: 'تاريخ الانضمام', fieldtype: 'Date' },
      { id: 'status', header: 'الحالة' },
    ],
    kpis: [
      { label: 'إجمالي الموظفين', compute: (r) => r.length, variant: 'emerald' },
      { label: 'نشط', compute: (r) => r.filter((x) => x.status === 'Active').length, variant: 'teal' },
    ],
  },

  '/hr/reports/salary': {
    doctype: 'Salary Slip',
    fields: ['employee', 'employee_name', 'start_date', 'end_date', 'gross_pay', 'total_deduction', 'net_pay'],
    baseFilters: [['docstatus', '=', 1]],
    orderBy: { field: 'start_date', order: 'desc' },
    columns: [
      { id: 'employee_name', header: 'الموظف' },
      { id: 'start_date', header: 'البداية', fieldtype: 'Date' },
      { id: 'gross_pay', header: 'إجمالي الراتب', fieldtype: 'Currency', isMeasure: true },
      { id: 'total_deduction', header: 'الاستقطاعات', fieldtype: 'Currency', isMeasure: true },
      { id: 'net_pay', header: 'صافي الراتب', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: [
      { label: 'إجمالي الرواتب', compute: (r) => r.reduce((s, x) => s + (Number(x.net_pay) || 0), 0), format: currency, variant: 'emerald' },
    ],
  },
};

/**
 * Build a sensible default ReportConfig for a route we don't have an explicit entry
 * for. Used by the generator to keep unmapped report pages from showing a dead
 * placeholder. The fallback shows whatever in_list_view fields the DocType has,
 * plus a "Count" KPI.
 */
export function defaultReportConfig(doctype: string): ReportConfig {
  return {
    doctype,
    fields: ['name', 'creation', 'modified', 'owner'],
    orderBy: { field: 'modified', order: 'desc' },
    limit: 200,
    columns: [
      { id: 'name', header: 'الرقم' },
      { id: 'owner', header: 'بواسطة' },
      { id: 'creation', header: 'تاريخ الإنشاء', fieldtype: 'Datetime' },
    ],
    kpis: [{ label: 'العدد', compute: (r) => r.length, variant: 'emerald' }],
  };
}
