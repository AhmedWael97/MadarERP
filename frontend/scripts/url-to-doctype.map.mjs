/* URL path → Frappe DocType mapping.
 * Hand-curated. The page generator falls back to `null` for unmapped paths;
 * see _generated/report.json after running `pnpm gen:pages`.
 *
 * Each entry: [URL pathname, { doctype, viewType }]
 *   viewType: 'list' | 'tree' | 'form' | 'report' | 'dashboard' | 'detail'
 */
export const URL_TO_DOCTYPE = {
  // --- Dashboard ---
  '/dashboard': { doctype: null, viewType: 'dashboard' },

  // --- Accounting ---
  '/accounting/chart-of-accounts': { doctype: 'Account', viewType: 'tree' },
  '/accounting/cost-centers': { doctype: 'Cost Center', viewType: 'tree' },
  '/accounting/fiscal-years': { doctype: 'Fiscal Year', viewType: 'list' },
  '/accounting/journal-entries': { doctype: 'Journal Entry', viewType: 'list' },
  '/accounting/journal-entries/create': { doctype: 'Journal Entry', viewType: 'form' },
  '/accounting/general-ledger': { doctype: null, viewType: 'report' },
  '/accounting/trial-balance': { doctype: null, viewType: 'report' },
  '/accounting/balance-sheet': { doctype: null, viewType: 'report' },
  '/accounting/income-statement': { doctype: null, viewType: 'report' },
  '/accounting/cash-flow': { doctype: null, viewType: 'report' },
  '/accounting/account-statement': { doctype: null, viewType: 'report' },
  '/accounting/debt-ages': { doctype: null, viewType: 'report' },

  // --- Treasury / Banks ---
  '/treasury/treasuries': { doctype: 'Madaar Treasury', viewType: 'list' },
  '/treasury/bank-accounts': { doctype: 'Bank Account', viewType: 'list' },
  '/treasury/received-cheques': { doctype: 'Madaar Cheque', viewType: 'list' },
  '/treasury/issued-cheques': { doctype: 'Madaar Cheque', viewType: 'list' },
  '/treasury/credit-notes': { doctype: 'Sales Invoice', viewType: 'list' },
  '/treasury/debit-notes': { doctype: 'Purchase Invoice', viewType: 'list' },
  '/treasury/payment-vouchers': { doctype: 'Payment Entry', viewType: 'list' },
  '/treasury/payment-vouchers/create': { doctype: 'Payment Entry', viewType: 'form' },
  '/treasury/receipt-vouchers': { doctype: 'Payment Entry', viewType: 'list' },
  '/treasury/receipt-vouchers/create': { doctype: 'Payment Entry', viewType: 'form' },

  // --- Sales ---
  '/sales/invoices': { doctype: 'Sales Invoice', viewType: 'list' },
  '/sales/invoices/create': { doctype: 'Sales Invoice', viewType: 'form' },
  '/sales/orders': { doctype: 'Sales Order', viewType: 'list' },
  '/sales/orders/create': { doctype: 'Sales Order', viewType: 'form' },
  '/sales/quotations': { doctype: 'Quotation', viewType: 'list' },
  '/sales/quotations/create': { doctype: 'Quotation', viewType: 'form' },
  '/sales/returns': { doctype: 'Sales Invoice', viewType: 'list' },
  '/sales/representatives': { doctype: 'Sales Person', viewType: 'list' },

  // --- Purchases ---
  '/purchases/invoices': { doctype: 'Purchase Invoice', viewType: 'list' },
  '/purchases/invoices/create': { doctype: 'Purchase Invoice', viewType: 'form' },
  '/purchases/orders': { doctype: 'Purchase Order', viewType: 'list' },
  '/purchases/orders/create': { doctype: 'Purchase Order', viewType: 'form' },
  '/purchases/returns': { doctype: 'Purchase Invoice', viewType: 'list' },
  '/purchases/suppliers': { doctype: 'Supplier', viewType: 'list' },
  '/purchases/supplier-categories': { doctype: 'Supplier Group', viewType: 'tree' },

  // --- Inventory ---
  '/inventory/items': { doctype: 'Item', viewType: 'list' },
  '/inventory/items/create': { doctype: 'Item', viewType: 'form' },
  '/inventory/warehouses': { doctype: 'Warehouse', viewType: 'tree' },
  '/inventory/stock-movements': { doctype: 'Stock Entry', viewType: 'list' },
  '/inventory/stock-transfers': { doctype: 'Stock Entry', viewType: 'list' },

  // --- CRM ---
  '/crm/customers': { doctype: 'Customer', viewType: 'list' },
  '/crm/customers/create': { doctype: 'Customer', viewType: 'form' },
  '/crm/customer-categories': { doctype: 'Customer Group', viewType: 'tree' },
  '/crm/leads': { doctype: 'Lead', viewType: 'list' },
  '/crm/leads/create': { doctype: 'Lead', viewType: 'form' },
  '/crm/opportunities': { doctype: 'Opportunity', viewType: 'list' },
  '/crm/opportunities/create': { doctype: 'Opportunity', viewType: 'form' },

  // --- HR ---
  '/hr/employees': { doctype: 'Employee', viewType: 'list' },
  '/hr/employees/create': { doctype: 'Employee', viewType: 'form' },
  '/hr/departments': { doctype: 'Department', viewType: 'tree' },
  '/hr/attendance': { doctype: 'Attendance', viewType: 'list' },
  '/hr/leaves': { doctype: 'Leave Application', viewType: 'list' },
  '/hr/payroll': { doctype: 'Salary Slip', viewType: 'list' },

  // --- Fixed Assets ---
  '/assets/list': { doctype: 'Asset', viewType: 'list' },
  '/assets/categories': { doctype: 'Asset Category', viewType: 'list' },

  // --- Manufacturing ---
  '/manufacturing/bom': { doctype: 'BOM', viewType: 'list' },
  '/manufacturing/work-orders': { doctype: 'Work Order', viewType: 'list' },
  '/manufacturing/work-centers': { doctype: 'Workstation', viewType: 'list' },
  '/manufacturing/production-plans': { doctype: 'Production Plan', viewType: 'list' },

  // --- Custom modules (DocTypes provided by our madaar_* apps) ---
  // Paths below match the SCAN URLs verbatim — different from the v1 map (we used
  // pluralised English equivalents back then). The scan paths win because that's
  // what the screenshots show and what the user will actually navigate to.

  // Customers / Suppliers / Sales reps (live at the root, NOT under /crm/, /sales/)
  '/customers': { doctype: 'Customer', viewType: 'list' },
  '/customers/create': { doctype: 'Customer', viewType: 'form' },
  '/customer-categories': { doctype: 'Customer Group', viewType: 'tree' },
  '/suppliers': { doctype: 'Supplier', viewType: 'list' },
  '/suppliers/create': { doctype: 'Supplier', viewType: 'form' },
  '/supplier-categories': { doctype: 'Supplier Group', viewType: 'tree' },
  '/sales-reps': { doctype: 'Sales Person', viewType: 'list' },
  '/sales-reps/create': { doctype: 'Sales Person', viewType: 'form' },

  // Financial documents (live under /financial/, not /treasury/)
  '/financial/checks': { doctype: 'Madaar Cheque', viewType: 'list' },
  '/financial/credit-notes': { doctype: 'Sales Invoice', viewType: 'list' },
  '/financial/debit-notes': { doctype: 'Purchase Invoice', viewType: 'list' },
  '/financial/payment-vouchers': { doctype: 'Payment Entry', viewType: 'list' },
  '/financial/payment-vouchers/create': { doctype: 'Payment Entry', viewType: 'form' },
  '/financial/receipt-vouchers': { doctype: 'Payment Entry', viewType: 'list' },
  '/financial/receipt-vouchers/create': { doctype: 'Payment Entry', viewType: 'form' },

  // Treasury / Banks
  '/treasury/banks': { doctype: 'Bank Account', viewType: 'list' },

  // Fixed Assets (under /fixed-assets/, not /assets/)
  '/fixed-assets/assets': { doctype: 'Asset', viewType: 'list' },
  '/fixed-assets/categories': { doctype: 'Asset Category', viewType: 'list' },

  // Inventory — alternate paths under /inventory/products, /movements, /transfers
  '/inventory/products': { doctype: 'Item', viewType: 'list' },
  '/inventory/products/create': { doctype: 'Item', viewType: 'form' },
  '/inventory/movements': { doctype: 'Stock Entry', viewType: 'list' },
  '/inventory/transfers': { doctype: 'Stock Entry', viewType: 'list' },
  '/inventory/adjustments': { doctype: 'Stock Reconciliation', viewType: 'list' },

  // Manufacturing — paths under /mfg/ in the scan
  '/mfg/bom': { doctype: 'BOM', viewType: 'list' },
  '/mfg/work-orders': { doctype: 'Work Order', viewType: 'list' },
  '/mfg/work-centers': { doctype: 'Workstation', viewType: 'list' },
  '/mfg/production-plans': { doctype: 'Production Plan', viewType: 'list' },
  '/mfg/material-issues': { doctype: 'Stock Entry', viewType: 'list' },
  '/mfg/finished-goods': { doctype: 'Stock Entry', viewType: 'list' },
  '/mfg/scrap': { doctype: 'Stock Entry', viewType: 'list' },

  // HR — directories live at /hr/employees, /hr/departments
  // (Already mapped above under "HR".)

  // CRM additions
  '/crm/activities': { doctype: 'ToDo', viewType: 'list' },

  // Fleet
  '/fleet/vehicles': { doctype: 'Madaar Vehicle', viewType: 'list' },
  '/fleet/drivers': { doctype: 'Madaar Driver Profile', viewType: 'list' },
  '/fleet/trips': { doctype: 'Madaar Trip', viewType: 'list' },
  '/fleet/fuel': { doctype: 'Madaar Fuel Log', viewType: 'list' },
  '/fleet/maintenance/requests': { doctype: 'Madaar Vehicle Maintenance Request', viewType: 'list' },
  '/fleet/routes': { doctype: 'Madaar Route', viewType: 'list' },
  '/fleet/violations': { doctype: 'Madaar Vehicle Violation', viewType: 'list' },
  '/fleet/accidents': { doctype: 'Madaar Vehicle Accident', viewType: 'list' },
  '/fleet/contracts': { doctype: 'Contract', viewType: 'list' },

  // Workshop
  '/workshop/invoices': { doctype: 'Sales Invoice', viewType: 'list' },
  '/workshop/job-cards': { doctype: 'Madaar Vehicle Job Card', viewType: 'list' },
  '/workshop/vehicles': { doctype: 'Madaar Vehicle', viewType: 'list' },
  '/workshop/setup/service-types': { doctype: 'Madaar Service Type', viewType: 'list' },
  '/workshop/setup/service-packages': { doctype: 'Madaar Maintenance Package', viewType: 'list' },
  '/workshop/setup/technicians': { doctype: 'Employee', viewType: 'list' },
  '/workshop/setup/sections': { doctype: 'Department', viewType: 'list' },
  '/workshop/setup/labor-operations': { doctype: 'Operation', viewType: 'list' },

  // Restaurant
  '/restaurant/branches': { doctype: 'Branch', viewType: 'list' },
  '/restaurant/halls': { doctype: 'Madaar Hall', viewType: 'list' },
  '/restaurant/tables': { doctype: 'Madaar Table', viewType: 'list' },
  '/restaurant/menu-items': { doctype: 'Item', viewType: 'list' },
  '/restaurant/menu-categories': { doctype: 'Item Group', viewType: 'tree' },
  '/restaurant/modifiers': { doctype: 'Madaar Modifier Group', viewType: 'list' },
  '/restaurant/reservations': { doctype: 'Madaar Reservation', viewType: 'list' },
  '/restaurant/shifts': { doctype: 'Shift Type', viewType: 'list' },
  '/restaurant/pos': { doctype: 'POS Profile', viewType: 'list' },
  '/restaurant/orders': { doctype: 'Sales Order', viewType: 'list' },
  '/restaurant/production-centers': { doctype: 'Warehouse', viewType: 'list' },
  '/restaurant/recipes': { doctype: 'BOM', viewType: 'list' },
  '/restaurant/delivery': { doctype: 'Delivery Note', viewType: 'list' },

  // Construction
  '/construction/projects': { doctype: 'Project', viewType: 'list' },
  '/construction/boq': { doctype: 'Madaar BOQ', viewType: 'list' },
  '/construction/billings': { doctype: 'Madaar Progress Bill', viewType: 'list' },
  '/construction/variations': { doctype: 'Madaar Change Order', viewType: 'list' },
  '/construction/budgets': { doctype: 'Madaar Project Budget', viewType: 'list' },
  '/construction/subcontractors': { doctype: 'Supplier', viewType: 'list' },
  '/construction/equipment': { doctype: 'Asset', viewType: 'list' },
  '/construction/labor': { doctype: 'Madaar Labor Record', viewType: 'list' },
  '/construction/materials': { doctype: 'Material Request', viewType: 'list' },
  '/construction/contracts': { doctype: 'Contract', viewType: 'list' },
  '/construction/expenses': { doctype: 'Expense Claim', viewType: 'list' },

  // Logistics — under /logistics/
  '/logistics/shipments': { doctype: 'Shipment', viewType: 'list' },
  '/logistics/deliveries': { doctype: 'Delivery Note', viewType: 'list' },
  '/logistics/orders': { doctype: 'Sales Order', viewType: 'list' },
  '/logistics/cod': { doctype: 'Madaar COD Settlement', viewType: 'list' },
  '/logistics/setup': { doctype: 'Shipping Rule', viewType: 'list' },

  // Ecommerce
  '/ecommerce/products': { doctype: 'Item', viewType: 'list' },
  '/ecommerce/orders': { doctype: 'Sales Order', viewType: 'list' },
  '/ecommerce/customers': { doctype: 'Customer', viewType: 'list' },
  '/ecommerce/banners': { doctype: 'Madaar Banner', viewType: 'list' },
  '/ecommerce/categories': { doctype: 'Item Group', viewType: 'tree' },
  '/ecommerce/coupons': { doctype: 'Coupon Code', viewType: 'list' },
  '/ecommerce/pages': { doctype: 'Madaar CMS Page', viewType: 'list' },
  '/ecommerce/stores': { doctype: 'Madaar Store', viewType: 'list' },
  '/ecommerce/returns': { doctype: 'Sales Invoice', viewType: 'list' },
  '/ecommerce/shipping': { doctype: 'Shipping Rule', viewType: 'list' },

  // Tax — paths under /tax/
  '/tax/returns': { doctype: 'Madaar VAT Return', viewType: 'list' },
  '/tax/submissions': { doctype: 'Madaar EInvoice Submission', viewType: 'list' },
  '/tax/submissions/bulk': { doctype: 'Madaar EInvoice Bulk Batch', viewType: 'list' },
  '/tax/audit-log': { doctype: 'Version', viewType: 'list' },
  '/tax/setup': { doctype: 'Sales Taxes and Charges Template', viewType: 'list' },

  // Support / Settings
  '/support-tickets': { doctype: 'Issue', viewType: 'list' },
  '/support-tickets/create': { doctype: 'Issue', viewType: 'form' },
  '/settings/company': { doctype: 'Company', viewType: 'list' },
  '/settings/users': { doctype: 'User', viewType: 'list' },
  '/settings/roles': { doctype: 'Role', viewType: 'list' },
  '/settings/document-numbering': { doctype: 'Naming Series Options', viewType: 'list' },
  '/user-management/users': { doctype: 'User', viewType: 'list' },
  '/user-management/roles': { doctype: 'Role', viewType: 'list' },
};
