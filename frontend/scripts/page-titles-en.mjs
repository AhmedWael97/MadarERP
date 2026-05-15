/* English translations for scanned page titles.
 *
 * Most entries in scan_output/data/pages.json have Arabic `name` fields. The UI
 * supports both Arabic and English; this module gives us a best-effort English
 * title per page so the i18n aggregator can emit `locales/en/pages.json`.
 *
 * Strategy (first match wins):
 *   1. If the title is already English (no Arabic letters) → return as-is.
 *   2. Reverse-lookup against the Arabic dictionary in `page-titles-ar.mjs`.
 *   3. Hand-curated overrides for tricky cases.
 *   4. Heuristic: title-case the slug derived from the URL.
 */
import { arabicTitleFor } from './page-titles-ar.mjs';

// ------- helpers -------------------------------------------------------------

function strip(s) {
  return String(s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s*[—\-–]\s*مدار\s*ERP\s*/g, '')
    .replace(/\s*مدار\s*ERP\s*[—\-–]\s*/g, '')
    .replace(/\s*—\s*Madaar\s*ERP\s*/gi, '')
    .replace(/\s*Madaar\s*ERP\s*—\s*/gi, '')
    .trim();
}

function isArabic(s) {
  return /[؀-ۿ]/.test(String(s ?? ''));
}

function titleCase(s) {
  return String(s ?? '')
    .toLowerCase()
    .split(/[\s\-_/]+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

// ------- reverse Arabic → English dictionary --------------------------------
// Built by walking the Arabic DICT exported by page-titles-ar.mjs in reverse.
// We can't `import { DICT }` from there (it's not exported), so we reconstruct
// the inverse table from the most-common English source keys here. Add new
// entries directly to this file.

const EN_DICT = {
  // Dashboards
  'dashboard': 'Dashboard',
  'sales dashboard': 'Sales Dashboard',
  'purchases dashboard': 'Purchases Dashboard',
  'treasury banks dashboard': 'Treasury & Banks Dashboard',
  'logistics dashboard': 'Logistics Dashboard',
  'fleet dashboard': 'Fleet Dashboard',
  'workshop dashboard': 'Workshop Dashboard',
  'manufacturing dashboard': 'Manufacturing Dashboard',
  'restaurant dashboard': 'Restaurant Dashboard',
  'crm dashboard': 'CRM Dashboard',
  'hr dashboard': 'HR Dashboard',
  'tax compliance dashboard': 'Tax Compliance Dashboard',
  'construction dashboard': 'Construction Dashboard',
  'support dashboard': 'Support Dashboard',
  'ecommerce dashboard': 'E-commerce Dashboard',
  'inventory dashboard': 'Inventory Dashboard',

  // Accounting
  'chart of accounts': 'Chart of Accounts',
  'cost centers': 'Cost Centers',
  'cost center': 'Cost Center',
  'fiscal years': 'Fiscal Years',
  'fiscal year': 'Fiscal Year',
  'journal entries': 'Journal Entries',
  'journal entry': 'Journal Entry',
  'general ledger': 'General Ledger',
  'trial balance': 'Trial Balance',
  'balance sheet': 'Balance Sheet',
  'income statement': 'Income Statement',
  'cash flow': 'Cash Flow',
  'cash flows': 'Cash Flows',
  'account statement': 'Account Statement',
  'aging': 'Aging',
  'debt aging': 'Debt Aging',
  'reports': 'Reports',

  // Treasury / Banks
  'treasuries': 'Treasuries',
  'treasury': 'Treasury',
  'banks': 'Banks',
  'bank accounts': 'Bank Accounts',
  'received cheques': 'Received Cheques',
  'issued cheques': 'Issued Cheques',
  'cheques': 'Cheques',
  'payment vouchers': 'Payment Vouchers',
  'payment voucher': 'Payment Voucher',
  'receipt vouchers': 'Receipt Vouchers',
  'receipt voucher': 'Receipt Voucher',
  'credit notes': 'Credit Notes',
  'debit notes': 'Debit Notes',
  'bank statement': 'Bank Statement',

  // Fixed Assets
  'fixed assets': 'Fixed Assets',
  'asset categories': 'Asset Categories',
  'fixed asset categories': 'Fixed Asset Categories',
  'assets': 'Assets',
  'depreciation schedule': 'Depreciation Schedule',
  'asset log': 'Asset Log',
  'accident log': 'Accident Log',

  // Sales
  'sales invoices': 'Sales Invoices',
  'sales invoice': 'Sales Invoice',
  'sales orders': 'Sales Orders',
  'sales order': 'Sales Order',
  'quotations': 'Quotations',
  'quotation': 'Quotation',
  'sales returns': 'Sales Returns',
  'sales by customer': 'Sales by Customer',
  'sales by product': 'Sales by Product',
  'daily sales': 'Daily Sales',
  'sales summary': 'Sales Summary',
  'sales reports': 'Sales Reports',
  'sales representatives': 'Sales Representatives',
  'sales pipeline': 'Sales Pipeline',
  'sales returns report': 'Sales Returns Report',

  // Purchases
  'purchase invoices': 'Purchase Invoices',
  'purchase invoice': 'Purchase Invoice',
  'purchase orders': 'Purchase Orders',
  'purchase order': 'Purchase Order',
  'purchase returns': 'Purchase Returns',
  'purchases by supplier': 'Purchases by Supplier',
  'purchases by product': 'Purchases by Product',
  'purchases summary': 'Purchases Summary',
  'suppliers': 'Suppliers',
  'supplier categories': 'Supplier Categories',

  // Inventory
  'items': 'Items',
  'products': 'Products',
  'products and items': 'Products & Items',
  'warehouses': 'Warehouses',
  'warehouses storage': 'Warehouses & Storage',
  'stock movements': 'Stock Movements',
  'stock balance': 'Stock Balance',
  'stock balances': 'Stock Balances',
  'stock valuation': 'Stock Valuation',
  'low stock alert': 'Low-Stock Alert',
  'product performance': 'Product Performance',
  'adjustments': 'Adjustments',

  // CRM
  'customers': 'Customers',
  'customer': 'Customer',
  'customer categories': 'Customer Categories',
  'leads': 'Leads',
  'opportunities': 'Opportunities',
  'pipeline': 'Pipeline',
  'activities': 'Activities',
  'leads report': 'Leads Report',
  'opportunities report': 'Opportunities Report',
  'team performance': 'Team Performance',
  'crm definitions': 'CRM Definitions',

  // HR
  'employees': 'Employees',
  'employee': 'Employee',
  'departments': 'Departments',
  'attendance': 'Attendance',
  'attendance log': 'Attendance Log',
  'leaves': 'Leaves',
  'payroll': 'Payroll',
  'payroll report': 'Payroll Report',
  'employee directory': 'Employee Directory',
  'department summary': 'Department Summary',
  'turnover': 'Turnover',
  'hr settings': 'HR Settings',

  // Manufacturing
  'bill of materials': 'Bill of Materials',
  'bom': 'BOM',
  'work orders': 'Work Orders',
  'work order': 'Work Order',
  'work centers': 'Work Centers',
  'production plans': 'Production Plans',
  'production planning': 'Production Planning',
  'material issues': 'Material Issues',
  'finished goods': 'Finished Goods',
  'scrap': 'Scrap',
  'manufacturing setup': 'Manufacturing Setup',

  // Construction
  'projects': 'Projects',
  'contracts': 'Contracts',
  'progress bills': 'Progress Bills',
  'boq': 'BOQ',
  'project budgets': 'Project Budgets',
  'budgets': 'Budgets',
  'change orders': 'Change Orders',
  'variation orders': 'Variation Orders',
  'subcontractors': 'Subcontractors',
  'equipment': 'Equipment',
  'labor records': 'Labor Records',
  'material requests': 'Material Requests',
  'project expenses': 'Project Expenses',
  'expenses': 'Expenses',
  'construction reports': 'Construction Reports',

  // Fleet
  'vehicles': 'Vehicles',
  'drivers': 'Drivers',
  'trips': 'Trips',
  'fuel': 'Fuel',
  'fuel log': 'Fuel Log',
  'maintenance': 'Maintenance',
  'maintenance requests': 'Maintenance Requests',
  'routes': 'Routes',
  'route management': 'Route Management',
  'violations': 'Violations',
  'violations log': 'Violations Log',
  'accidents': 'Accidents',
  'fleet definitions': 'Fleet Definitions',
  'fleet contracts': 'Fleet Contracts',
  'gps live tracking': 'GPS Live Tracking',
  'live tracking': 'Live Tracking',

  // Workshop
  'workshop invoices': 'Workshop Invoices',
  'job cards': 'Job Cards',
  'work orders summary': 'Work Orders Summary',
  'revenue report': 'Revenue Report',
  'technician performance report': 'Technician Performance Report',
  'vehicle service history': 'Vehicle Service History',
  'workshop departments': 'Workshop Departments',
  'maintenance packages': 'Maintenance Packages',
  'service types': 'Service Types',
  'technicians': 'Technicians',
  'labor operations': 'Labor Operations',

  // Restaurant
  'branch management': 'Branch Management',
  'branches': 'Branches',
  'halls and tables': 'Halls & Tables',
  'kitchen display screen': 'Kitchen Display Screen (KDS)',
  'menu categories': 'Menu Categories',
  'menu items': 'Menu Items',
  'modifier groups': 'Modifier Groups',
  'order management': 'Order Management',
  'point of sale': 'Point of Sale (POS)',
  'pos': 'POS',
  'production centers': 'Production Centers',
  'recipes and cost': 'Recipes & Cost',
  'reservations': 'Reservations',
  'shifts': 'Shifts',

  // E-commerce
  'online store': 'Online Store',
  'banners': 'Banners',
  'categories': 'Categories',
  'coupons': 'Coupons',
  'orders': 'Orders',
  'cms pages': 'CMS Pages',
  'returns': 'Returns',
  'stores': 'Stores',
  'shipping': 'Shipping',
  'shipping settings': 'Shipping Settings',
  'store': 'Store',

  // Logistics
  'shipments': 'Shipments',
  'shipment': 'Shipment',
  'cod settlement': 'COD Settlement',
  'delivery': 'Delivery',
  'manage delivery': 'Manage Delivery',
  'manage shipments': 'Manage Shipments',
  'logistics reports': 'Logistics Reports',
  'logistics setup': 'Logistics Setup',
  'shipment tracking': 'Shipment Tracking',

  // Tax
  'tax audit log': 'Tax Audit Log',
  'tax compliance': 'Tax Compliance',
  'annual tax summary': 'Annual Tax Summary',
  'vat report': 'VAT Report',
  'tax returns': 'Tax Returns',
  'tax setup': 'Tax Setup',
  'submitted invoices': 'Submitted Invoices',
  'bulk submission': 'Bulk Submission',

  // Settings
  'company settings': 'Company Settings',
  'roles and permissions': 'Roles & Permissions',
  'users': 'Users',
  'profile': 'Profile',
  'settings': 'Settings',
  'setup': 'Setup',
  'notifications': 'Notifications',

  // Support
  'support': 'Support',
  'new support ticket': 'New Support Ticket',
  'support reports': 'Support Reports',
};

// Build an Arabic → English reverse table by translating each English key.
const AR_TO_EN = new Map();
for (const enKey of Object.keys(EN_DICT)) {
  const ar = arabicTitleFor(enKey);
  if (ar && !AR_TO_EN.has(ar)) AR_TO_EN.set(ar, EN_DICT[enKey]);
}

// Prefix patterns (English-side). "Edit X" / "Create X" / "New X" / "Add X" / "Manage X".
const EN_PREFIX_BUILDERS = [
  { ar: /^تعديل\s+(.+)$/, build: (m) => `Edit ${translateInner(m[1])}` },
  { ar: /^إنشاء\s+(.+)$/, build: (m) => `Create ${translateInner(m[1])}` },
  { ar: /^إضافة\s+(.+)$/, build: (m) => `Add ${translateInner(m[1])}` },
  { ar: /^إدارة\s+(.+)$/, build: (m) => `Manage ${translateInner(m[1])}` },
];

function translateInner(arText) {
  const trimmed = String(arText ?? '').trim();
  if (!isArabic(trimmed)) return trimmed; // already English
  return AR_TO_EN.get(trimmed) ?? trimmed;
}

/**
 * Resolve an English title for a scanned page name. The scanned name is usually Arabic
 * but may sometimes already be English — in either case we return English here.
 *
 * Falls back to title-casing the URL slug if no dictionary match is found.
 *
 * @param {string} raw — `page.name` from pages.json
 * @param {string} [slug] — optional fallback slug (e.g. "chart-of-accounts")
 */
export function englishTitleFor(raw, slug) {
  const stripped = strip(raw);
  if (!stripped) return slug ? titleCase(slug) : '';
  if (!isArabic(stripped)) return stripped; // already English

  // 1. Direct reverse-dictionary hit.
  const direct = AR_TO_EN.get(stripped);
  if (direct) return direct;

  // 2. Prefix builders ("تعديل X", "إنشاء X", "إضافة X", "إدارة X").
  for (const { ar, build } of EN_PREFIX_BUILDERS) {
    const m = stripped.match(ar);
    if (m) return build(m);
  }

  // 3. Composite (splits on "/" or em-dash).
  const parts = stripped.split(/\s*[/\\—–]\s*/).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((p) => AR_TO_EN.get(p.trim()) ?? p.trim()).join(' / ');
  }

  // 4. Heuristic from the URL slug.
  if (slug) return titleCase(slug.replace(/--/g, ' '));

  return stripped;
}
