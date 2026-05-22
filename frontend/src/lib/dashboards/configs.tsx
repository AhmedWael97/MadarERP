/**
 * Per-module dashboard configurations consumed by <ModuleDashboard>.
 *
 * Each config picks a small batch of doctype queries, derives KPIs from
 * the rows and renders ECharts options. Configs stay declarative — heavy
 * shaping happens in helper functions so the configs read top-to-bottom.
 */
import {
  Activity,
  AlertCircle,
  Award,
  BookOpen,
  Boxes,
  Briefcase,
  Building,
  Calendar,
  ClipboardCheck,
  Coins,
  CreditCard,
  Factory,
  FileText,
  Fuel,
  GraduationCap,
  Hammer,
  Landmark,
  PackageCheck,
  PiggyBank,
  Receipt,
  ShoppingBag,
  Store,
  Truck,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import {
  barChart,
  countWhere,
  currency,
  daysAgo,
  donutChart,
  groupCount,
  groupSum,
  sumField,
  trendChart,
  type DashboardCfg,
} from '@/components/erp/ModuleDashboard';

const last30 = daysAgo(30);
const last90 = daysAgo(90);
const last365 = daysAgo(365);

// ───────────────────────────────────────────────────────────────────────────
// 1. Accounting
// ───────────────────────────────────────────────────────────────────────────
export const accountingCfg: DashboardCfg = {
  title: 'لوحة الحسابات العامة',
  subtitle: 'مؤشرات مالية ودفتر الأستاذ',
  permDoctype: 'GL Entry',
  queries: {
    gl: {
      doctype: 'GL Entry',
      fields: ['posting_date', 'account', 'debit', 'credit', 'voucher_type'],
      filters: [['is_cancelled', '=', 0], ['posting_date', '>=', last90]],
      limit: 5000,
    },
    journals: {
      doctype: 'Journal Entry',
      fields: ['name', 'posting_date', 'total_debit', 'docstatus'],
      limit: 200,
      orderBy: { field: 'posting_date', order: 'desc' },
    },
    accounts: {
      doctype: 'Account',
      fields: ['name', 'root_type', 'is_group'],
      filters: [['disabled', '=', 0]],
      limit: 500,
    },
  },
  kpis: [
    { label: 'إجمالي المدين (90 يوم)', tone: 'emerald', icon: <TrendingUp size={18} />, derive: (r) => sumField(r.gl, 'debit'), format: currency },
    { label: 'إجمالي الدائن (90 يوم)', tone: 'rose',    icon: <TrendingDown size={18} />, derive: (r) => sumField(r.gl, 'credit'), format: currency },
    { label: 'صافي الحركة',           tone: 'violet',   icon: <Activity size={18} />,    derive: (r) => sumField(r.gl, 'debit') - sumField(r.gl, 'credit'), format: currency },
    { label: 'قيود اليومية',          tone: 'amber',    icon: <FileText size={18} />,    derive: (r) => r.journals.length, hint: 'آخر 200' },
    { label: 'حسابات نشطة',           tone: 'sky',      icon: <Landmark size={18} />,    derive: (r) => countWhere(r.accounts, (a) => !a.is_group) },
  ],
  charts: [
    {
      title: 'الحركة اليومية (مدين)',
      subtitle: 'آخر 90 يوم',
      build: (r) => trendChart(r.gl, 'posting_date', 'debit', '#10b981'),
    },
    {
      title: 'الحركة حسب نوع السند',
      subtitle: 'إجمالي المدين',
      build: (r) => barChart(groupSum(r.gl, 'voucher_type', 'debit'), '#8b5cf6'),
    },
  ],
  links: [
    { to: '/accounting/journal-entries', label: 'قيود اليومية', icon: <FileText size={14} /> },
    { to: '/accounting/chart-of-accounts', label: 'دليل الحسابات', icon: <Landmark size={14} /> },
    { to: '/accounting/reports/general-ledger', label: 'الأستاذ العام', icon: <Activity size={14} /> },
    { to: '/accounting/reports/trial-balance', label: 'ميزان المراجعة', icon: <ClipboardCheck size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 2. Treasury
// ───────────────────────────────────────────────────────────────────────────
export const treasuryCfg: DashboardCfg = {
  title: 'الخزينة والبنوك',
  subtitle: 'الحسابات النقدية والبنكية',
  permDoctype: 'Account',
  queries: {
    payments: {
      doctype: 'Payment Entry',
      fields: ['name', 'posting_date', 'payment_type', 'paid_amount', 'mode_of_payment', 'docstatus'],
      filters: [['posting_date', '>=', last90]],
      limit: 1000,
    },
    cashAccts: {
      doctype: 'Account',
      fields: ['name', 'account_name', 'account_type'],
      filters: [['account_type', '=', 'Cash'], ['disabled', '=', 0]],
      limit: 100,
    },
    bankAccts: {
      doctype: 'Account',
      fields: ['name', 'account_name', 'account_type'],
      filters: [['account_type', '=', 'Bank'], ['disabled', '=', 0]],
      limit: 100,
    },
  },
  kpis: [
    { label: 'مقبوضات (90 يوم)', tone: 'emerald', icon: <TrendingUp size={18} />, derive: (r) => sumField(r.payments.filter((p) => p.payment_type === 'Receive'), 'paid_amount'), format: currency },
    { label: 'مدفوعات (90 يوم)', tone: 'rose',    icon: <TrendingDown size={18} />, derive: (r) => sumField(r.payments.filter((p) => p.payment_type === 'Pay'), 'paid_amount'), format: currency },
    {
      label: 'الصافي',
      tone: 'violet',
      icon: <Wallet size={18} />,
      derive: (r) => sumField(r.payments.filter((p) => p.payment_type === 'Receive'), 'paid_amount') - sumField(r.payments.filter((p) => p.payment_type === 'Pay'), 'paid_amount'),
      format: currency,
    },
    { label: 'الخزائن', tone: 'amber', icon: <PiggyBank size={18} />, derive: (r) => r.cashAccts.length },
    { label: 'البنوك',  tone: 'sky',   icon: <Landmark size={18} />,  derive: (r) => r.bankAccts.length },
  ],
  charts: [
    {
      title: 'حركة النقدية اليومية',
      subtitle: 'صافي المقبوض - المدفوع',
      build: (r) => {
        const byDay = new Map<string, number>();
        for (const p of r.payments) {
          const d = String(p.posting_date ?? '').slice(0, 10);
          if (!d) continue;
          const sign = p.payment_type === 'Receive' ? 1 : -1;
          byDay.set(d, (byDay.get(d) ?? 0) + sign * (Number(p.paid_amount) || 0));
        }
        const sorted = [...byDay.entries()].sort();
        if (sorted.length === 0) return null;
        return {
          tooltip: { trigger: 'axis' },
          grid: { left: 60, right: 20, bottom: 30, top: 10 },
          xAxis: { type: 'category', data: sorted.map((s) => s[0]) },
          yAxis: { type: 'value' },
          series: [{ type: 'line', smooth: true, areaStyle: { opacity: 0.2 }, data: sorted.map((s) => s[1]), itemStyle: { color: '#8b5cf6' } }],
        };
      },
    },
    {
      title: 'حسب طريقة الدفع',
      build: (r) => donutChart(groupSum(r.payments, 'mode_of_payment', 'paid_amount')),
    },
  ],
  links: [
    { to: '/treasury/treasuries',  label: 'الخزائن', icon: <PiggyBank size={14} /> },
    { to: '/treasury/banks',       label: 'البنوك', icon: <Landmark size={14} /> },
    { to: '/treasury/currencies',  label: 'العملات', icon: <Coins size={14} /> },
    { to: '/financial/receipt-vouchers', label: 'سندات القبض', icon: <TrendingUp size={14} /> },
    { to: '/financial/payment-vouchers', label: 'سندات الصرف', icon: <TrendingDown size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 3. Sales
// ───────────────────────────────────────────────────────────────────────────
export const salesCfg: DashboardCfg = {
  title: 'لوحة المبيعات',
  subtitle: 'أداء المبيعات والعملاء',
  permDoctype: 'Sales Invoice',
  queries: {
    invoices: {
      doctype: 'Sales Invoice',
      fields: ['name', 'customer', 'customer_name', 'posting_date', 'grand_total', 'outstanding_amount', 'status', 'docstatus'],
      filters: [['posting_date', '>=', last90]],
      limit: 2000,
      orderBy: { field: 'posting_date', order: 'desc' },
    },
    orders: {
      doctype: 'Sales Order',
      fields: ['name', 'customer', 'posting_date', 'grand_total', 'status', 'docstatus'],
      filters: [['posting_date', '>=', last90]],
      limit: 500,
    },
    quotations: {
      doctype: 'Quotation',
      fields: ['name', 'status', 'docstatus'],
      filters: [['transaction_date', '>=', last90]],
      limit: 500,
    },
  },
  kpis: [
    { label: 'المبيعات (90 يوم)', tone: 'emerald', icon: <ShoppingBag size={18} />, derive: (r) => sumField(r.invoices.filter((i) => i.docstatus === 1), 'grand_total'), format: currency },
    { label: 'المتبقي',           tone: 'orange',  icon: <Wallet size={18} />,      derive: (r) => sumField(r.invoices, 'outstanding_amount'), format: currency },
    { label: 'عدد الفواتير',      tone: 'sky',     icon: <FileText size={18} />,    derive: (r) => countWhere(r.invoices, (i) => i.docstatus === 1) },
    { label: 'العملاء',           tone: 'violet',  icon: <Users size={18} />,       derive: (r) => new Set(r.invoices.map((i) => i.customer)).size },
    { label: 'طلبات المبيعات',    tone: 'teal',    icon: <Receipt size={18} />,     derive: (r) => r.orders.length },
    { label: 'عروض الأسعار',      tone: 'amber',   icon: <Briefcase size={18} />,   derive: (r) => r.quotations.length },
  ],
  charts: [
    { title: 'المبيعات اليومية', subtitle: 'إجمالي مرحّل', build: (r) => trendChart(r.invoices.filter((i) => i.docstatus === 1), 'posting_date', 'grand_total', '#10b981') },
    { title: 'أفضل 10 عملاء',                              build: (r) => barChart(groupSum(r.invoices, 'customer_name', 'grand_total'), '#3b82f6') },
    { title: 'حسب الحالة',                                 build: (r) => donutChart(groupCount(r.invoices, 'status')) },
    { title: 'الطلبات حسب الحالة',                          build: (r) => donutChart(groupCount(r.orders, 'status'), ['#10b981', '#f59e0b', '#f43f5e']) },
  ],
  links: [
    { to: '/sales/invoices',          label: 'فواتير المبيعات', icon: <FileText size={14} />, badge: (r) => r.invoices.length },
    { to: '/sales/orders',            label: 'طلبات المبيعات', icon: <Receipt size={14} />,  badge: (r) => r.orders.length },
    { to: '/sales/quotations',        label: 'عروض الأسعار',  icon: <Briefcase size={14} />, badge: (r) => r.quotations.length },
    { to: '/sales/reports/by-customer', label: 'تقرير العملاء', icon: <Users size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 4. Purchases
// ───────────────────────────────────────────────────────────────────────────
export const purchasesCfg: DashboardCfg = {
  title: 'لوحة المشتريات',
  subtitle: 'أداء المشتريات والموردين',
  permDoctype: 'Purchase Invoice',
  queries: {
    invoices: {
      doctype: 'Purchase Invoice',
      fields: ['name', 'supplier', 'supplier_name', 'posting_date', 'grand_total', 'outstanding_amount', 'status', 'docstatus'],
      filters: [['posting_date', '>=', last90]],
      limit: 2000,
    },
    orders: {
      doctype: 'Purchase Order',
      fields: ['name', 'supplier', 'transaction_date', 'grand_total', 'status', 'docstatus'],
      filters: [['transaction_date', '>=', last90]],
      limit: 500,
    },
    receipts: {
      doctype: 'Purchase Receipt',
      fields: ['name', 'supplier', 'posting_date', 'grand_total', 'docstatus'],
      filters: [['posting_date', '>=', last90]],
      limit: 500,
    },
  },
  kpis: [
    { label: 'المشتريات (90 يوم)', tone: 'emerald', icon: <ShoppingBag size={18} />, derive: (r) => sumField(r.invoices.filter((i) => i.docstatus === 1), 'grand_total'), format: currency },
    { label: 'المستحق',            tone: 'rose',    icon: <Wallet size={18} />,      derive: (r) => sumField(r.invoices, 'outstanding_amount'), format: currency },
    { label: 'عدد الفواتير',       tone: 'sky',     icon: <FileText size={18} />,    derive: (r) => countWhere(r.invoices, (i) => i.docstatus === 1) },
    { label: 'الموردين',           tone: 'violet',  icon: <Truck size={18} />,       derive: (r) => new Set(r.invoices.map((i) => i.supplier)).size },
    { label: 'طلبات شراء',         tone: 'teal',    icon: <Receipt size={18} />,     derive: (r) => r.orders.length },
    { label: 'إيصالات استلام',     tone: 'amber',   icon: <PackageCheck size={18} />, derive: (r) => r.receipts.length },
  ],
  charts: [
    { title: 'المشتريات اليومية',  build: (r) => trendChart(r.invoices.filter((i) => i.docstatus === 1), 'posting_date', 'grand_total', '#3b82f6') },
    { title: 'أفضل 10 موردين',     build: (r) => barChart(groupSum(r.invoices, 'supplier_name', 'grand_total'), '#8b5cf6') },
    { title: 'حسب حالة الفاتورة',  build: (r) => donutChart(groupCount(r.invoices, 'status')) },
    { title: 'الطلبات حسب الحالة', build: (r) => donutChart(groupCount(r.orders, 'status'), ['#10b981', '#f59e0b', '#f43f5e']) },
  ],
  links: [
    { to: '/purchases/invoices', label: 'فواتير المشتريات', icon: <FileText size={14} />, badge: (r) => r.invoices.length },
    { to: '/purchases/orders',   label: 'طلبات الشراء', icon: <Receipt size={14} />,  badge: (r) => r.orders.length },
    { to: '/purchases/receipts', label: 'إيصالات الاستلام', icon: <PackageCheck size={14} />, badge: (r) => r.receipts.length },
    { to: '/purchases/reports/by-supplier', label: 'تقرير الموردين', icon: <Truck size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 5. Inventory
// ───────────────────────────────────────────────────────────────────────────
export const inventoryCfg: DashboardCfg = {
  title: 'لوحة المخزون',
  subtitle: 'حالة المخازن والأصناف',
  permDoctype: 'Item',
  queries: {
    bin: {
      doctype: 'Bin',
      fields: ['item_code', 'warehouse', 'actual_qty', 'stock_value', 'reserved_qty'],
      limit: 5000,
    },
    items: {
      doctype: 'Item',
      fields: ['name', 'item_group', 'disabled'],
      limit: 2000,
    },
    warehouses: {
      doctype: 'Warehouse',
      fields: ['name', 'disabled', 'is_group'],
      filters: [['disabled', '=', 0]],
      limit: 200,
    },
    moves: {
      doctype: 'Stock Entry',
      fields: ['name', 'posting_date', 'stock_entry_type', 'docstatus'],
      filters: [['posting_date', '>=', last30]],
      limit: 500,
    },
  },
  kpis: [
    { label: 'قيمة المخزون',  tone: 'emerald', icon: <Boxes size={18} />,        derive: (r) => sumField(r.bin, 'stock_value'), format: currency },
    { label: 'الأصناف',        tone: 'sky',     icon: <PackageCheck size={18} />, derive: (r) => countWhere(r.items, (i) => !i.disabled) },
    { label: 'المخازن النشطة', tone: 'violet',  icon: <Building size={18} />,     derive: (r) => countWhere(r.warehouses, (w) => !w.is_group) },
    { label: 'تحركات (30 يوم)', tone: 'amber',  icon: <Activity size={18} />,     derive: (r) => r.moves.length },
    { label: 'محجوز',          tone: 'orange',  icon: <AlertCircle size={18} />,  derive: (r) => sumField(r.bin, 'reserved_qty') },
    { label: 'منخفض (<10)',   tone: 'rose',    icon: <TrendingDown size={18} />, derive: (r) => countWhere(r.bin, (b) => Number(b.actual_qty) > 0 && Number(b.actual_qty) < 10) },
  ],
  charts: [
    { title: 'أعلى 10 مخازن بالقيمة', build: (r) => barChart(groupSum(r.bin, 'warehouse', 'stock_value'), '#10b981') },
    { title: 'تحركات المخزون حسب النوع', build: (r) => donutChart(groupCount(r.moves, 'stock_entry_type')) },
    { title: 'الأصناف حسب المجموعة',     build: (r) => barChart(groupCount(r.items, 'item_group'), '#3b82f6') },
  ],
  links: [
    { to: '/inventory/items',      label: 'الأصناف', icon: <Boxes size={14} />, badge: (r) => r.items.length },
    { to: '/inventory/warehouses', label: 'المخازن', icon: <Building size={14} />, badge: (r) => r.warehouses.length },
    { to: '/inventory/transfers',  label: 'تحويلات المخزون', icon: <Truck size={14} /> },
    { to: '/inventory/reports/stock-status', label: 'تقرير حالة المخزون', icon: <FileText size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 6. Fixed Assets
// ───────────────────────────────────────────────────────────────────────────
export const fixedAssetsCfg: DashboardCfg = {
  title: 'الأصول الثابتة',
  subtitle: 'محفظة الأصول والإهلاك',
  permDoctype: 'Asset',
  queries: {
    assets: {
      doctype: 'Asset',
      fields: ['name', 'asset_name', 'asset_category', 'gross_purchase_amount', 'value_after_depreciation', 'status', 'purchase_date'],
      limit: 2000,
    },
    categories: {
      doctype: 'Asset Category',
      fields: ['name'],
      limit: 100,
    },
  },
  kpis: [
    { label: 'إجمالي الأصول',     tone: 'emerald', icon: <Building size={18} />, derive: (r) => sumField(r.assets, 'gross_purchase_amount'), format: currency },
    { label: 'القيمة الدفترية',   tone: 'sky',     icon: <Coins size={18} />,    derive: (r) => sumField(r.assets, 'value_after_depreciation'), format: currency },
    { label: 'إجمالي الإهلاك',    tone: 'rose',    icon: <TrendingDown size={18} />, derive: (r) => sumField(r.assets, 'gross_purchase_amount') - sumField(r.assets, 'value_after_depreciation'), format: currency },
    { label: 'عدد الأصول',        tone: 'violet',  icon: <PackageCheck size={18} />, derive: (r) => r.assets.length },
    { label: 'التصنيفات',         tone: 'amber',   icon: <Briefcase size={18} />,    derive: (r) => r.categories.length },
  ],
  charts: [
    { title: 'الأصول حسب التصنيف',      build: (r) => barChart(groupSum(r.assets, 'asset_category', 'gross_purchase_amount'), '#10b981') },
    { title: 'الأصول حسب الحالة',       build: (r) => donutChart(groupCount(r.assets, 'status')) },
  ],
  links: [
    { to: '/fixed-assets/assets',     label: 'قائمة الأصول', icon: <Building size={14} />, badge: (r) => r.assets.length },
    { to: '/fixed-assets/categories', label: 'التصنيفات', icon: <Briefcase size={14} /> },
    { to: '/fixed-assets/reports/register',     label: 'سجل الأصول الثابتة', icon: <FileText size={14} /> },
    { to: '/fixed-assets/reports/depreciation', label: 'جدول الإهلاك', icon: <TrendingDown size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 7. HR
// ───────────────────────────────────────────────────────────────────────────
export const hrCfg: DashboardCfg = {
  title: 'الموارد البشرية',
  subtitle: 'الموظفين والرواتب والإجازات',
  permDoctype: 'Employee',
  queries: {
    employees: {
      doctype: 'Employee',
      fields: ['name', 'employee_name', 'department', 'designation', 'status', 'date_of_joining'],
      limit: 2000,
    },
    salaries: {
      doctype: 'Salary Slip',
      fields: ['name', 'employee', 'start_date', 'net_pay', 'docstatus'],
      filters: [['start_date', '>=', last90]],
      limit: 1000,
    },
    leaves: {
      doctype: 'Leave Application',
      fields: ['name', 'employee', 'leave_type', 'from_date', 'status'],
      filters: [['from_date', '>=', last90]],
      limit: 500,
    },
  },
  kpis: [
    { label: 'إجمالي الموظفين',  tone: 'emerald', icon: <Users size={18} />,      derive: (r) => r.employees.length },
    { label: 'نشط',              tone: 'sky',     icon: <UserPlus size={18} />,   derive: (r) => countWhere(r.employees, (e) => e.status === 'Active') },
    { label: 'إجمالي الرواتب',   tone: 'violet',  icon: <Wallet size={18} />,     derive: (r) => sumField(r.salaries.filter((s) => s.docstatus === 1), 'net_pay'), format: currency },
    { label: 'كشوف رواتب',       tone: 'amber',   icon: <FileText size={18} />,   derive: (r) => r.salaries.length },
    { label: 'طلبات إجازة',      tone: 'orange',  icon: <Calendar size={18} />,   derive: (r) => r.leaves.length },
    { label: 'الأقسام',          tone: 'teal',    icon: <Briefcase size={18} />,  derive: (r) => new Set(r.employees.map((e) => e.department)).size },
  ],
  charts: [
    { title: 'الموظفين حسب القسم',     build: (r) => barChart(groupCount(r.employees, 'department'), '#10b981') },
    { title: 'الموظفين حسب الحالة',    build: (r) => donutChart(groupCount(r.employees, 'status')) },
    { title: 'طلبات الإجازة حسب النوع', build: (r) => donutChart(groupCount(r.leaves, 'leave_type'), ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e']) },
  ],
  links: [
    { to: '/hr/employees',  label: 'الموظفين', icon: <Users size={14} />, badge: (r) => r.employees.length },
    { to: '/hr/attendance', label: 'الحضور والانصراف', icon: <ClipboardCheck size={14} /> },
    { to: '/hr/leaves',     label: 'الإجازات', icon: <Calendar size={14} />, badge: (r) => r.leaves.length },
    { to: '/hr/payroll',    label: 'الرواتب', icon: <Wallet size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 8. CRM
// ───────────────────────────────────────────────────────────────────────────
export const crmCfg: DashboardCfg = {
  title: 'إدارة علاقات العملاء (CRM)',
  subtitle: 'العملاء المحتملين والفرص',
  permDoctype: 'Lead',
  queries: {
    leads: {
      doctype: 'Lead',
      fields: ['name', 'lead_name', 'status', 'source', 'lead_owner', 'creation'],
      limit: 2000,
    },
    opportunities: {
      doctype: 'Opportunity',
      fields: ['name', 'party_name', 'status', 'opportunity_amount', 'transaction_date'],
      limit: 1000,
    },
    customers: {
      doctype: 'Customer',
      fields: ['name', 'customer_name', 'customer_group', 'territory', 'creation'],
      limit: 2000,
    },
  },
  kpis: [
    { label: 'العملاء المحتملين', tone: 'sky',     icon: <UserPlus size={18} />, derive: (r) => r.leads.length },
    { label: 'مفتوحة',            tone: 'amber',   icon: <Activity size={18} />, derive: (r) => countWhere(r.leads, (l) => l.status === 'Open') },
    { label: 'محولة',             tone: 'emerald', icon: <Award size={18} />,    derive: (r) => countWhere(r.leads, (l) => l.status === 'Converted') },
    { label: 'الفرص',             tone: 'violet',  icon: <Briefcase size={18} />, derive: (r) => r.opportunities.length },
    { label: 'قيمة الفرص',        tone: 'teal',    icon: <Wallet size={18} />,   derive: (r) => sumField(r.opportunities, 'opportunity_amount'), format: currency },
    { label: 'العملاء',           tone: 'rose',    icon: <Users size={18} />,    derive: (r) => r.customers.length },
  ],
  charts: [
    { title: 'العملاء المحتملين حسب الحالة', build: (r) => donutChart(groupCount(r.leads, 'status')) },
    { title: 'حسب المصدر',                    build: (r) => barChart(groupCount(r.leads, 'source'), '#3b82f6') },
    { title: 'الفرص حسب الحالة',              build: (r) => donutChart(groupCount(r.opportunities, 'status'), ['#10b981', '#f59e0b', '#f43f5e', '#8b5cf6']) },
    { title: 'العملاء حسب المجموعة',          build: (r) => barChart(groupCount(r.customers, 'customer_group'), '#10b981') },
  ],
  links: [
    { to: '/crm/leads',         label: 'العملاء المحتملين', icon: <UserPlus size={14} />, badge: (r) => r.leads.length },
    { to: '/crm/opportunities', label: 'الفرص', icon: <Briefcase size={14} />, badge: (r) => r.opportunities.length },
    { to: '/customers',         label: 'العملاء', icon: <Users size={14} />, badge: (r) => r.customers.length },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 9. Manufacturing
// ───────────────────────────────────────────────────────────────────────────
export const mfgCfg: DashboardCfg = {
  title: 'التصنيع',
  subtitle: 'أوامر الإنتاج والتجميع',
  permDoctype: 'Work Order',
  queries: {
    workOrders: {
      doctype: 'Work Order',
      fields: ['name', 'production_item', 'qty', 'produced_qty', 'status', 'planned_start_date'],
      limit: 1000,
    },
    boms: {
      doctype: 'BOM',
      fields: ['name', 'item', 'is_active', 'is_default'],
      limit: 1000,
    },
    jobCards: {
      doctype: 'Job Card',
      fields: ['name', 'work_order', 'status'],
      limit: 1000,
    },
  },
  kpis: [
    { label: 'أوامر الإنتاج',  tone: 'emerald', icon: <Factory size={18} />, derive: (r) => r.workOrders.length },
    { label: 'قيد التنفيذ',    tone: 'amber',   icon: <Activity size={18} />, derive: (r) => countWhere(r.workOrders, (w) => w.status === 'In Process') },
    { label: 'مكتملة',         tone: 'sky',     icon: <PackageCheck size={18} />, derive: (r) => countWhere(r.workOrders, (w) => w.status === 'Completed') },
    { label: 'الكميات المنتجة', tone: 'violet', icon: <Boxes size={18} />,    derive: (r) => sumField(r.workOrders, 'produced_qty') },
    { label: 'قوائم المواد',   tone: 'teal',    icon: <FileText size={18} />, derive: (r) => r.boms.length },
    { label: 'بطاقات العمل',   tone: 'rose',    icon: <Hammer size={18} />,   derive: (r) => r.jobCards.length },
  ],
  charts: [
    { title: 'أوامر الإنتاج حسب الحالة', build: (r) => donutChart(groupCount(r.workOrders, 'status')) },
    { title: 'بطاقات العمل حسب الحالة',  build: (r) => donutChart(groupCount(r.jobCards, 'status'), ['#3b82f6', '#10b981', '#f59e0b']) },
  ],
  links: [
    { to: '/mfg/work-orders', label: 'أوامر الإنتاج', icon: <Factory size={14} />, badge: (r) => r.workOrders.length },
    { to: '/mfg/boms',         label: 'قوائم المواد (BOM)', icon: <FileText size={14} />, badge: (r) => r.boms.length },
    { to: '/mfg/job-cards',    label: 'بطاقات العمل', icon: <Hammer size={14} />, badge: (r) => r.jobCards.length },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 10. Construction
// ───────────────────────────────────────────────────────────────────────────
export const constructionCfg: DashboardCfg = {
  title: 'المقاولات',
  subtitle: 'المشاريع والمستخلصات والعقود',
  permDoctype: 'Madaar Construction Contract',
  queries: {
    projects: {
      doctype: 'Project',
      fields: ['name', 'project_name', 'status', 'percent_complete', 'estimated_costing', 'expected_start_date'],
      limit: 500,
    },
    contracts: {
      doctype: 'Madaar Construction Contract',
      fields: ['name', 'contract_number', 'project', 'client', 'contract_value', 'status'],
      limit: 500,
    },
    bills: {
      doctype: 'Madaar Progress Bill',
      fields: ['name', 'project', 'status', 'total_billed'],
      limit: 500,
    },
  },
  kpis: [
    { label: 'المشاريع',          tone: 'emerald', icon: <Hammer size={18} />,      derive: (r) => r.projects.length },
    { label: 'نشطة',              tone: 'sky',     icon: <Activity size={18} />,    derive: (r) => countWhere(r.projects, (p) => p.status === 'Open') },
    { label: 'متوسط التقدم %',   tone: 'violet',  icon: <TrendingUp size={18} />,  derive: (r) => {
        const arr = r.projects.map((p) => Number(p.percent_complete) || 0);
        if (arr.length === 0) return 0;
        return (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) + '%';
      } },
    { label: 'العقود',           tone: 'teal',    icon: <FileText size={18} />,    derive: (r) => r.contracts.length },
    { label: 'المستخلصات',       tone: 'amber',   icon: <Receipt size={18} />,     derive: (r) => r.bills.length },
    { label: 'إجمالي مفوتر',     tone: 'rose',    icon: <Wallet size={18} />,      derive: (r) => sumField(r.bills, 'total_billed'), format: currency },
  ],
  charts: [
    { title: 'المشاريع حسب الحالة',  build: (r) => donutChart(groupCount(r.projects, 'status')) },
    { title: 'العقود حسب الحالة',     build: (r) => donutChart(groupCount(r.contracts, 'status'), ['#10b981', '#f59e0b', '#f43f5e']) },
    { title: 'المستخلصات حسب المشروع', build: (r) => barChart(groupSum(r.bills, 'project', 'total_billed'), '#3b82f6') },
  ],
  links: [
    { to: '/construction/boq',       label: 'جدول الكميات (BOQ)', icon: <FileText size={14} /> },
    { to: '/construction/contracts', label: 'العقود', icon: <FileText size={14} />, badge: (r) => r.contracts.length },
    { to: '/construction/billings',  label: 'المستخلصات', icon: <Receipt size={14} />, badge: (r) => r.bills.length },
    { to: '/construction/budgets',   label: 'ميزانيات المشاريع', icon: <Coins size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 11. Fleet
// ───────────────────────────────────────────────────────────────────────────
export const fleetCfg: DashboardCfg = {
  title: 'إدارة الأسطول',
  subtitle: 'المركبات والسائقين والصيانة',
  permDoctype: 'Madaar Vehicle',
  queries: {
    vehicles: {
      doctype: 'Madaar Vehicle',
      fields: ['name', 'name_ar', 'status'],
      limit: 1000,
    },
    drivers: {
      doctype: 'Madaar Driver',
      fields: ['name', 'name_ar', 'status'],
      limit: 500,
    },
    trips: {
      doctype: 'Madaar Trip',
      fields: ['name', 'status'],
      limit: 1000,
    },
    fuel: {
      doctype: 'Madaar Fuel Log',
      fields: ['name', 'total_cost', 'fuel_date'],
      filters: [['fuel_date', '>=', last90]],
      limit: 1000,
    },
    maintenance: {
      doctype: 'Madaar Maintenance Request',
      fields: ['name', 'status'],
      limit: 500,
    },
  },
  kpis: [
    { label: 'المركبات',         tone: 'emerald', icon: <Truck size={18} />,       derive: (r) => r.vehicles.length },
    { label: 'السائقين',         tone: 'sky',     icon: <Users size={18} />,       derive: (r) => r.drivers.length },
    { label: 'الرحلات',          tone: 'violet',  icon: <Activity size={18} />,    derive: (r) => r.trips.length },
    { label: 'تكلفة الوقود (90 يوم)', tone: 'orange', icon: <Fuel size={18} />,   derive: (r) => sumField(r.fuel, 'total_cost'), format: currency },
    { label: 'طلبات صيانة',      tone: 'rose',    icon: <Wrench size={18} />,      derive: (r) => r.maintenance.length },
  ],
  charts: [
    { title: 'المركبات حسب الحالة', build: (r) => donutChart(groupCount(r.vehicles, 'status')) },
    { title: 'الرحلات حسب الحالة',  build: (r) => donutChart(groupCount(r.trips, 'status'), ['#3b82f6', '#10b981', '#f59e0b']) },
    { title: 'الصيانة حسب الحالة',  build: (r) => donutChart(groupCount(r.maintenance, 'status')) },
  ],
  links: [
    { to: '/fleet/vehicles',    label: 'المركبات', icon: <Truck size={14} />, badge: (r) => r.vehicles.length },
    { to: '/fleet/drivers',     label: 'السائقين', icon: <Users size={14} />, badge: (r) => r.drivers.length },
    { to: '/fleet/trips',       label: 'الرحلات', icon: <Activity size={14} /> },
    { to: '/fleet/fuel-logs',   label: 'سجل الوقود', icon: <Fuel size={14} /> },
    { to: '/fleet/maintenance-requests', label: 'طلبات الصيانة', icon: <Wrench size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 12. Tax
// ───────────────────────────────────────────────────────────────────────────
export const taxCfg: DashboardCfg = {
  title: 'لوحة الامتثال الضريبي',
  subtitle: 'الإقرارات والمعاملات الضريبية',
  permDoctype: 'Sales Taxes and Charges Template',
  queries: {
    salesInv: {
      doctype: 'Sales Invoice',
      fields: ['name', 'posting_date', 'grand_total', 'total_taxes_and_charges', 'docstatus'],
      filters: [['posting_date', '>=', last90]],
      limit: 2000,
    },
    purchaseInv: {
      doctype: 'Purchase Invoice',
      fields: ['name', 'posting_date', 'grand_total', 'total_taxes_and_charges', 'docstatus'],
      filters: [['posting_date', '>=', last90]],
      limit: 2000,
    },
  },
  kpis: [
    { label: 'ضرائب المبيعات (90 يوم)',  tone: 'emerald', icon: <TrendingUp size={18} />, derive: (r) => sumField(r.salesInv.filter((i) => i.docstatus === 1), 'total_taxes_and_charges'), format: currency },
    { label: 'ضرائب المشتريات (90 يوم)', tone: 'rose',    icon: <TrendingDown size={18} />, derive: (r) => sumField(r.purchaseInv.filter((i) => i.docstatus === 1), 'total_taxes_and_charges'), format: currency },
    {
      label: 'صافي الضريبة',
      tone: 'violet',
      icon: <Activity size={18} />,
      derive: (r) => sumField(r.salesInv.filter((i) => i.docstatus === 1), 'total_taxes_and_charges') - sumField(r.purchaseInv.filter((i) => i.docstatus === 1), 'total_taxes_and_charges'),
      format: currency,
    },
    { label: 'إجمالي المبيعات',  tone: 'sky',   icon: <ShoppingBag size={18} />, derive: (r) => sumField(r.salesInv.filter((i) => i.docstatus === 1), 'grand_total'), format: currency },
    { label: 'إجمالي المشتريات', tone: 'amber', icon: <Receipt size={18} />,    derive: (r) => sumField(r.purchaseInv.filter((i) => i.docstatus === 1), 'grand_total'), format: currency },
  ],
  charts: [
    { title: 'ضرائب المبيعات اليومية',   build: (r) => trendChart(r.salesInv.filter((i) => i.docstatus === 1), 'posting_date', 'total_taxes_and_charges', '#10b981') },
    { title: 'ضرائب المشتريات اليومية', build: (r) => trendChart(r.purchaseInv.filter((i) => i.docstatus === 1), 'posting_date', 'total_taxes_and_charges', '#f43f5e') },
  ],
  links: [
    { to: '/tax/submissions', label: 'الإقرارات الضريبية', icon: <FileText size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 13. Logistics
// ───────────────────────────────────────────────────────────────────────────
export const logisticsCfg: DashboardCfg = {
  title: 'الخدمات اللوجستية',
  subtitle: 'الشحنات والتوصيل',
  permDoctype: 'Delivery Note',
  queries: {
    deliveries: {
      doctype: 'Delivery Note',
      fields: ['name', 'posting_date', 'customer', 'grand_total', 'status', 'docstatus'],
      filters: [['posting_date', '>=', last90]],
      limit: 1000,
    },
    pickLists: {
      doctype: 'Pick List',
      fields: ['name', 'status'],
      limit: 500,
    },
  },
  kpis: [
    { label: 'إذونات التسليم',  tone: 'emerald', icon: <Truck size={18} />,    derive: (r) => r.deliveries.length },
    { label: 'مرحّلة',          tone: 'sky',     icon: <PackageCheck size={18} />, derive: (r) => countWhere(r.deliveries, (d) => d.docstatus === 1) },
    { label: 'قيمة التسليم',    tone: 'violet',  icon: <Wallet size={18} />,   derive: (r) => sumField(r.deliveries.filter((d) => d.docstatus === 1), 'grand_total'), format: currency },
    { label: 'قوائم تجهيز',     tone: 'amber',   icon: <ClipboardCheck size={18} />, derive: (r) => r.pickLists.length },
    { label: 'العملاء',         tone: 'teal',    icon: <Users size={18} />,    derive: (r) => new Set(r.deliveries.map((d) => d.customer)).size },
  ],
  charts: [
    { title: 'التسليمات اليومية',     build: (r) => trendChart(r.deliveries, 'posting_date', 'grand_total', '#3b82f6') },
    { title: 'التسليمات حسب الحالة',   build: (r) => donutChart(groupCount(r.deliveries, 'status')) },
    { title: 'قوائم التجهيز حسب الحالة', build: (r) => donutChart(groupCount(r.pickLists, 'status'), ['#10b981', '#f59e0b', '#f43f5e']) },
  ],
  links: [
    { to: '/logistics/delivery-notes', label: 'إذونات التسليم', icon: <Truck size={14} />, badge: (r) => r.deliveries.length },
    { to: '/logistics/pick-lists',     label: 'قوائم التجهيز', icon: <ClipboardCheck size={14} />, badge: (r) => r.pickLists.length },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 14. E-commerce
// ───────────────────────────────────────────────────────────────────────────
export const ecommerceCfg: DashboardCfg = {
  title: 'المتجر الإلكتروني',
  subtitle: 'الطلبات والمنتجات والعملاء',
  permDoctype: 'Sales Order',
  queries: {
    orders: {
      doctype: 'Sales Order',
      fields: ['name', 'transaction_date', 'customer', 'grand_total', 'status', 'docstatus'],
      filters: [['transaction_date', '>=', last90]],
      limit: 2000,
    },
    items: {
      doctype: 'Item',
      fields: ['name', 'item_group', 'standard_rate', 'disabled'],
      filters: [['show_in_website', '=', 1]],
      limit: 2000,
    },
  },
  kpis: [
    { label: 'الطلبات (90 يوم)', tone: 'emerald', icon: <ShoppingBag size={18} />, derive: (r) => r.orders.length },
    { label: 'مبيعات أونلاين',   tone: 'sky',     icon: <Wallet size={18} />,      derive: (r) => sumField(r.orders.filter((o) => o.docstatus === 1), 'grand_total'), format: currency },
    { label: 'متوسط الطلب',      tone: 'violet',  icon: <TrendingUp size={18} />,  derive: (r) => {
        const subs = r.orders.filter((o) => o.docstatus === 1);
        if (subs.length === 0) return 0;
        return sumField(subs, 'grand_total') / subs.length;
      }, format: currency },
    { label: 'المنتجات بالمتجر', tone: 'amber',   icon: <Store size={18} />,       derive: (r) => r.items.length },
    { label: 'عملاء فريدين',     tone: 'teal',    icon: <Users size={18} />,       derive: (r) => new Set(r.orders.map((o) => o.customer)).size },
  ],
  charts: [
    { title: 'الطلبات اليومية',    build: (r) => trendChart(r.orders, 'transaction_date', 'grand_total', '#ec4899') },
    { title: 'الطلبات حسب الحالة', build: (r) => donutChart(groupCount(r.orders, 'status')) },
    { title: 'المنتجات حسب المجموعة', build: (r) => barChart(groupCount(r.items, 'item_group'), '#10b981') },
  ],
  links: [
    { to: '/ecommerce/orders',     label: 'الطلبات', icon: <ShoppingBag size={14} />, badge: (r) => r.orders.length },
    { to: '/ecommerce/products',   label: 'المنتجات', icon: <Store size={14} />,       badge: (r) => r.items.length },
    { to: '/ecommerce/categories', label: 'تصنيفات المتجر', icon: <Briefcase size={14} /> },
    { to: '/ecommerce/customers',  label: 'عملاء المتجر', icon: <Users size={14} /> },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 15. LMS (Learning)
// ───────────────────────────────────────────────────────────────────────────
export const lmsCfg: DashboardCfg = {
  title: 'منصة التعلم الإلكتروني',
  subtitle: 'الدورات والطلاب والمدربين',
  permDoctype: 'LMS Course',
  queries: {
    courses: {
      doctype: 'LMS Course',
      fields: ['name', 'title', 'published', 'category'],
      limit: 500,
    },
    enrollments: {
      doctype: 'LMS Enrollment',
      fields: ['name', 'member', 'course', 'progress'],
      limit: 2000,
    },
  },
  kpis: [
    { label: 'الدورات',          tone: 'emerald', icon: <BookOpen size={18} />,    derive: (r) => r.courses.length },
    { label: 'منشورة',           tone: 'sky',     icon: <Award size={18} />,       derive: (r) => countWhere(r.courses, (c) => !!c.published) },
    { label: 'إجمالي التسجيلات', tone: 'violet',  icon: <GraduationCap size={18} />, derive: (r) => r.enrollments.length },
    { label: 'الطلاب',           tone: 'amber',   icon: <Users size={18} />,       derive: (r) => new Set(r.enrollments.map((e) => e.member)).size },
    { label: 'متوسط التقدم',     tone: 'teal',    icon: <TrendingUp size={18} />,  derive: (r) => {
        const arr = r.enrollments.map((e) => Number(e.progress) || 0);
        if (arr.length === 0) return '0%';
        return (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) + '%';
      } },
  ],
  charts: [
    { title: 'الدورات حسب التصنيف', build: (r) => barChart(groupCount(r.courses, 'category'), '#10b981') },
    { title: 'التسجيلات حسب الدورة (أعلى 10)', build: (r) => barChart(groupCount(r.enrollments, 'course'), '#3b82f6') },
  ],
  links: [
    { to: '/lms/courses', label: 'الدورات', icon: <BookOpen size={14} />, badge: (r) => r.courses.length },
    { to: '/lms/enrollments', label: 'التسجيلات', icon: <GraduationCap size={14} />, badge: (r) => r.enrollments.length },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// 16. Events
// ───────────────────────────────────────────────────────────────────────────
export const eventsCfg: DashboardCfg = {
  title: 'إدارة الفعاليات',
  subtitle: 'الفعاليات والحجوزات والتذاكر',
  permDoctype: 'Madaar Event',
  queries: {
    events: {
      doctype: 'Madaar Event',
      fields: ['name', 'event_name', 'status', 'start_date'],
      limit: 500,
    },
    bookings: {
      doctype: 'Madaar Event Booking',
      fields: ['name', 'event', 'status', 'total_amount'],
      limit: 1000,
    },
  },
  kpis: [
    { label: 'الفعاليات',        tone: 'emerald', icon: <Calendar size={18} />,    derive: (r) => r.events.length },
    { label: 'قادمة',            tone: 'sky',     icon: <Activity size={18} />,    derive: (r) => countWhere(r.events, (e) => e.status === 'Published' || e.status === 'Open') },
    { label: 'الحجوزات',         tone: 'violet',  icon: <ClipboardCheck size={18} />, derive: (r) => r.bookings.length },
    { label: 'إيرادات',          tone: 'teal',    icon: <Wallet size={18} />,      derive: (r) => sumField(r.bookings, 'total_amount'), format: currency },
    { label: 'مؤكدة',            tone: 'amber',   icon: <Award size={18} />,       derive: (r) => countWhere(r.bookings, (b) => b.status === 'Confirmed') },
  ],
  charts: [
    { title: 'الفعاليات حسب الحالة',  build: (r) => donutChart(groupCount(r.events, 'status')) },
    { title: 'الحجوزات حسب الفعالية', build: (r) => barChart(groupCount(r.bookings, 'event'), '#8b5cf6') },
    { title: 'الحجوزات حسب الحالة',    build: (r) => donutChart(groupCount(r.bookings, 'status'), ['#10b981', '#f59e0b', '#f43f5e']) },
  ],
  links: [
    { to: '/events/events',   label: 'الفعاليات', icon: <Calendar size={14} />, badge: (r) => r.events.length },
    { to: '/events/bookings', label: 'الحجوزات', icon: <ClipboardCheck size={14} />, badge: (r) => r.bookings.length },
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// Map route → config (consumed by the per-route override pages).
// ───────────────────────────────────────────────────────────────────────────
export const DASHBOARD_CONFIGS: Record<string, DashboardCfg> = {
  '/accounting/dashboard':  accountingCfg,
  '/treasury/dashboard':    treasuryCfg,
  '/sales/dashboard':       salesCfg,
  '/purchases/dashboard':   purchasesCfg,
  '/inventory/dashboard':   inventoryCfg,
  '/fixed-assets/dashboard': fixedAssetsCfg,
  '/hr':                    hrCfg,
  '/crm':                   crmCfg,
  '/mfg':                   mfgCfg,
  '/construction':          constructionCfg,
  '/fleet/dashboard':       fleetCfg,
  '/tax/dashboard':         taxCfg,
  '/logistics/dashboard':   logisticsCfg,
  '/ecommerce':             ecommerceCfg,
  '/lms':                   lmsCfg,
  '/events':                eventsCfg,
};
