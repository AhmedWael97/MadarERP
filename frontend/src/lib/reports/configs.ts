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

  '/hr/reports/turnover': {
    doctype: 'Employee',
    fields: ['name', 'employee_name', 'department', 'date_of_joining', 'relieving_date', 'status'],
    orderBy: { field: 'relieving_date', order: 'desc' },
    filters: [
      { fieldname: 'department', label: 'Department', type: 'link', options: 'Department' },
    ],
    columns: [
      { id: 'employee_name', header: 'الموظف' },
      { id: 'department', header: 'القسم' },
      { id: 'date_of_joining', header: 'تاريخ الانضمام', fieldtype: 'Date' },
      { id: 'relieving_date', header: 'تاريخ الانفصال', fieldtype: 'Date' },
      { id: 'status', header: 'الحالة' },
    ],
    kpis: [
      { label: 'إجمالي الموظفين', compute: (r) => r.length, variant: 'emerald' },
      { label: 'تركوا العمل', compute: (r) => r.filter((x) => !!x.relieving_date).length, variant: 'rose' },
      {
        label: 'نسبة الدوران',
        compute: (r) => {
          if (r.length === 0) return '0%';
          const left = r.filter((x) => !!x.relieving_date).length;
          return `${((left / r.length) * 100).toFixed(1)}%`;
        },
        variant: 'orange',
      },
    ],
  },

  // ---------- Accounting ----------

  '/accounting/reports/general-ledger': {
    doctype: 'GL Entry',
    fields: ['posting_date', 'account', 'party', 'voucher_type', 'voucher_no', 'debit', 'credit', 'cost_center'],
    baseFilters: [['is_cancelled', '=', 0]],
    filters: [
      { fieldname: 'posting_date', label: 'Date', type: 'daterange' },
      { fieldname: 'account', label: 'Account', type: 'link', options: 'Account' },
    ],
    orderBy: { field: 'posting_date', order: 'desc' },
    limit: 2000,
    columns: [
      { id: 'posting_date', header: 'التاريخ', fieldtype: 'Date' },
      { id: 'account', header: 'الحساب' },
      { id: 'voucher_type', header: 'النوع' },
      { id: 'voucher_no', header: 'رقم السند' },
      { id: 'debit', header: 'مدين', fieldtype: 'Currency', isMeasure: true },
      { id: 'credit', header: 'دائن', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: [
      { label: 'إجمالي المدين', compute: (r) => r.reduce((s, x) => s + (Number(x.debit) || 0), 0), format: currency, variant: 'emerald' },
      { label: 'إجمالي الدائن', compute: (r) => r.reduce((s, x) => s + (Number(x.credit) || 0), 0), format: currency, variant: 'rose' },
      {
        label: 'الرصيد',
        compute: (r) => r.reduce((s, x) => s + (Number(x.debit) || 0) - (Number(x.credit) || 0), 0),
        format: currency,
        variant: 'violet',
      },
    ],
  },

  '/accounting/reports/account-statement': {
    doctype: 'GL Entry',
    fields: ['posting_date', 'account', 'voucher_type', 'voucher_no', 'debit', 'credit', 'against'],
    baseFilters: [['is_cancelled', '=', 0]],
    filters: [
      { fieldname: 'account', label: 'Account', type: 'link', options: 'Account' },
      { fieldname: 'posting_date', label: 'Date', type: 'daterange' },
    ],
    orderBy: { field: 'posting_date', order: 'asc' },
    limit: 2000,
    columns: [
      { id: 'posting_date', header: 'التاريخ', fieldtype: 'Date' },
      { id: 'voucher_type', header: 'النوع' },
      { id: 'voucher_no', header: 'المرجع' },
      { id: 'against', header: 'مقابل' },
      { id: 'debit', header: 'مدين', fieldtype: 'Currency', isMeasure: true },
      { id: 'credit', header: 'دائن', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: [
      { label: 'مدين', compute: (r) => r.reduce((s, x) => s + (Number(x.debit) || 0), 0), format: currency, variant: 'emerald' },
      { label: 'دائن', compute: (r) => r.reduce((s, x) => s + (Number(x.credit) || 0), 0), format: currency, variant: 'rose' },
      {
        label: 'صافي الرصيد',
        compute: (r) => r.reduce((s, x) => s + (Number(x.debit) || 0) - (Number(x.credit) || 0), 0),
        format: currency,
        variant: 'violet',
      },
    ],
  },

  '/accounting/reports/aging': {
    doctype: 'Sales Invoice',
    fields: ['name', 'customer_name', 'posting_date', 'due_date', 'outstanding_amount'],
    baseFilters: [['docstatus', '=', 1], ['outstanding_amount', '>', 0]],
    orderBy: { field: 'due_date', order: 'asc' },
    columns: [
      { id: 'name', header: 'الفاتورة' },
      { id: 'customer_name', header: 'العميل' },
      { id: 'due_date', header: 'تاريخ الاستحقاق', fieldtype: 'Date' },
      { id: 'aging_days', header: 'الأيام', render: (r) => daysSince(r.due_date) },
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

  '/accounting/reports/cash-flow': {
    doctype: 'Payment Entry',
    fields: ['name', 'posting_date', 'payment_type', 'party_name', 'paid_amount', 'mode_of_payment'],
    baseFilters: [['docstatus', '=', 1]],
    filters: [
      { fieldname: 'posting_date', label: 'Date', type: 'daterange' },
      { fieldname: 'payment_type', label: 'Type', type: 'select', options: ['Receive', 'Pay', 'Internal Transfer'] },
    ],
    orderBy: { field: 'posting_date', order: 'desc' },
    columns: [
      { id: 'posting_date', header: 'التاريخ', fieldtype: 'Date' },
      { id: 'name', header: 'رقم السند' },
      { id: 'payment_type', header: 'النوع' },
      { id: 'party_name', header: 'الطرف' },
      { id: 'mode_of_payment', header: 'طريقة الدفع' },
      { id: 'paid_amount', header: 'المبلغ', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: [
      {
        label: 'التدفقات الداخلة',
        compute: (r) =>
          r.filter((x) => x.payment_type === 'Receive').reduce((s, x) => s + (Number(x.paid_amount) || 0), 0),
        format: currency,
        variant: 'emerald',
      },
      {
        label: 'التدفقات الخارجة',
        compute: (r) =>
          r.filter((x) => x.payment_type === 'Pay').reduce((s, x) => s + (Number(x.paid_amount) || 0), 0),
        format: currency,
        variant: 'rose',
      },
      {
        label: 'الصافي',
        compute: (r) =>
          r.reduce(
            (s, x) =>
              s +
              (x.payment_type === 'Receive' ? Number(x.paid_amount) || 0 : -(Number(x.paid_amount) || 0)),
            0,
          ),
        format: currency,
        variant: 'violet',
      },
    ],
  },

  // ---------- CRM ----------

  '/crm/reports/leads': {
    doctype: 'Lead',
    fields: ['name', 'lead_name', 'company_name', 'status', 'source', 'lead_owner', 'creation'],
    filters: [
      { fieldname: 'status', label: 'Status', type: 'select', options: ['Open', 'Replied', 'Opportunity', 'Quotation', 'Lost Quotation', 'Interested', 'Converted', 'Do Not Contact'] },
      { fieldname: 'source', label: 'Source', type: 'link', options: 'Lead Source' },
    ],
    orderBy: { field: 'creation', order: 'desc' },
    columns: [
      { id: 'lead_name', header: 'الاسم' },
      { id: 'company_name', header: 'الشركة' },
      { id: 'status', header: 'الحالة' },
      { id: 'source', header: 'المصدر' },
      { id: 'lead_owner', header: 'المسؤول' },
      { id: 'creation', header: 'تاريخ الإنشاء', fieldtype: 'Datetime' },
    ],
    kpis: [
      { label: 'إجمالي العملاء المحتملين', compute: (r) => r.length, variant: 'emerald' },
      { label: 'مفتوحة', compute: (r) => r.filter((x) => x.status === 'Open').length, variant: 'teal' },
      { label: 'محولة', compute: (r) => r.filter((x) => x.status === 'Converted').length, variant: 'violet' },
    ],
    chart: {
      title: 'العملاء المحتملين حسب المصدر',
      build: (rows) => {
        const bySource = new Map<string, number>();
        for (const r of rows) {
          const k = String(r.source ?? 'غير محدد');
          bySource.set(k, (bySource.get(k) ?? 0) + 1);
        }
        const data = [...bySource.entries()].map(([name, value]) => ({ name, value }));
        if (data.length === 0) return null;
        return {
          tooltip: { trigger: 'item' },
          series: [{ type: 'pie', radius: ['40%', '70%'], data }],
        };
      },
    },
  },

  // ---------- Financial ----------

  '/financial/reports/checks': {
    doctype: 'Madaar Cheque',
    fields: ['name', 'cheque_number', 'cheque_date', 'due_date', 'direction', 'status', 'party', 'bank_name', 'amount'],
    filters: [
      { fieldname: 'direction', label: 'Direction', type: 'select', options: ['Incoming', 'Outgoing'] },
      { fieldname: 'status', label: 'Status', type: 'select', options: ['Draft', 'Pending', 'Cleared', 'Bounced', 'Cancelled'] },
      { fieldname: 'cheque_date', label: 'Date', type: 'daterange' },
    ],
    orderBy: { field: 'cheque_date', order: 'desc' },
    columns: [
      { id: 'cheque_number', header: 'رقم الشيك' },
      { id: 'cheque_date', header: 'تاريخ الإصدار', fieldtype: 'Date' },
      { id: 'due_date', header: 'الاستحقاق', fieldtype: 'Date' },
      { id: 'direction', header: 'النوع' },
      { id: 'party', header: 'الطرف' },
      { id: 'bank_name', header: 'البنك' },
      { id: 'amount', header: 'المبلغ', fieldtype: 'Currency', isMeasure: true },
      { id: 'status', header: 'الحالة' },
    ],
    kpis: [
      { label: 'إجمالي الشيكات', compute: (r) => r.length, variant: 'emerald' },
      {
        label: 'إجمالي المبالغ',
        compute: (r) => r.reduce((s, x) => s + (Number(x.amount) || 0), 0),
        format: currency,
        variant: 'violet',
      },
      { label: 'مرتدة', compute: (r) => r.filter((x) => x.status === 'Bounced').length, variant: 'rose' },
    ],
  },

  '/financial/reports/vouchers': {
    doctype: 'Payment Entry',
    fields: ['name', 'posting_date', 'payment_type', 'party_name', 'mode_of_payment', 'paid_amount', 'docstatus'],
    baseFilters: [['docstatus', '!=', 2]],
    filters: [
      { fieldname: 'payment_type', label: 'Type', type: 'select', options: ['Receive', 'Pay', 'Internal Transfer'] },
      { fieldname: 'posting_date', label: 'Date', type: 'daterange' },
    ],
    orderBy: { field: 'posting_date', order: 'desc' },
    columns: [
      { id: 'name', header: 'رقم السند' },
      { id: 'posting_date', header: 'التاريخ', fieldtype: 'Date' },
      { id: 'payment_type', header: 'النوع' },
      { id: 'party_name', header: 'الطرف' },
      { id: 'mode_of_payment', header: 'طريقة الدفع' },
      { id: 'paid_amount', header: 'المبلغ', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: [
      { label: 'عدد السندات', compute: (r) => r.length, variant: 'emerald' },
      {
        label: 'الإجمالي',
        compute: (r) => r.reduce((s, x) => s + (Number(x.paid_amount) || 0), 0),
        format: currency,
        variant: 'violet',
      },
    ],
  },

  // ---------- Workshop ----------

  '/workshop/reports/job-card-summary': {
    doctype: 'Madaar Vehicle Job Card',
    fields: ['name', 'customer', 'license_plate', 'vehicle_make', 'vehicle_model', 'assigned_technician', 'status', 'total_cost', 'creation'],
    filters: [
      { fieldname: 'status', label: 'Status', type: 'select', options: ['Draft', 'Open', 'In Progress', 'Completed', 'Invoiced', 'Cancelled'] },
      { fieldname: 'assigned_technician', label: 'Technician', type: 'link', options: 'Employee' },
    ],
    orderBy: { field: 'creation', order: 'desc' },
    columns: [
      { id: 'name', header: 'رقم البطاقة' },
      { id: 'customer', header: 'العميل' },
      { id: 'license_plate', header: 'لوحة المركبة' },
      { id: 'assigned_technician', header: 'الفني' },
      { id: 'status', header: 'الحالة' },
      { id: 'total_cost', header: 'التكلفة', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: [
      { label: 'إجمالي البطاقات', compute: (r) => r.length, variant: 'emerald' },
      { label: 'قيد التنفيذ', compute: (r) => r.filter((x) => x.status === 'In Progress').length, variant: 'orange' },
      { label: 'مكتملة', compute: (r) => r.filter((x) => x.status === 'Completed' || x.status === 'Invoiced').length, variant: 'teal' },
      {
        label: 'الإيرادات',
        compute: (r) => r.reduce((s, x) => s + (Number(x.total_cost) || 0), 0),
        format: currency,
        variant: 'violet',
      },
    ],
  },

  '/workshop/reports/vehicle-history': {
    doctype: 'Madaar Vehicle Job Card',
    fields: ['name', 'license_plate', 'vehicle_make', 'vehicle_model', 'customer', 'status', 'total_cost', 'complaint', 'creation'],
    filters: [
      { fieldname: 'license_plate', label: 'License Plate', type: 'text' },
      { fieldname: 'customer', label: 'Customer', type: 'link', options: 'Customer' },
    ],
    orderBy: { field: 'creation', order: 'desc' },
    columns: [
      { id: 'creation', header: 'التاريخ', fieldtype: 'Datetime' },
      { id: 'license_plate', header: 'اللوحة' },
      { id: 'vehicle_make', header: 'الماركة' },
      { id: 'name', header: 'بطاقة العمل' },
      { id: 'complaint', header: 'الشكوى' },
      { id: 'status', header: 'الحالة' },
      { id: 'total_cost', header: 'التكلفة', fieldtype: 'Currency', isMeasure: true },
    ],
    kpis: [
      { label: 'إجمالي الزيارات', compute: (r) => r.length, variant: 'emerald' },
      {
        label: 'إجمالي التكاليف',
        compute: (r) => r.reduce((s, x) => s + (Number(x.total_cost) || 0), 0),
        format: currency,
        variant: 'violet',
      },
      { label: 'مركبات مميزة', compute: (r) => new Set(r.map((x) => x.license_plate)).size, variant: 'teal' },
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
