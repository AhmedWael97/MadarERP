/* English → Arabic translations for scanned page titles.
 *
 * Many entries in scan_output/data/pages.json have English `name` fields because the
 * original site had bilingual pages. The user wants the UI Arabic-only, so the
 * generator runs the scanned title through this dictionary before writing the manifest.
 *
 * Add new entries here as you spot untranslated titles in the UI.
 */

function strip(s) {
  // Decode HTML entities, strip "Madar ERP" boilerplate suffix/prefix, collapse whitespace.
  return String(s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s*[—\-–]\s*مدار\s*ERP\s*/g, '')
    .replace(/\s*مدار\s*ERP\s*[—\-–]\s*/g, '')
    .trim();
}

const DICT = {
  // ---- Dashboards ----
  'dashboard': 'لوحة التحكم',
  'sales dashboard': 'لوحة المبيعات',
  'purchases dashboard': 'لوحة المشتريات',
  'treasury banks dashboard': 'لوحة الخزينة والبنوك',
  'logistics dashboard': 'لوحة الخدمات اللوجستية',
  'fleet dashboard': 'لوحة الأسطول',
  'workshop dashboard': 'لوحة الورشة',
  'manufacturing dashboard': 'لوحة التصنيع',
  'restaurant dashboard': 'لوحة المطعم',
  'crm dashboard': 'لوحة إدارة العملاء',
  'hr dashboard': 'لوحة الموارد البشرية',
  'tax compliance dashboard': 'لوحة الامتثال الضريبي',
  'construction dashboard': 'لوحة المقاولات',
  'support dashboard': 'لوحة الدعم الفني',
  'e-commerce dashboard': 'لوحة المتجر الإلكتروني',
  'ecommerce dashboard': 'لوحة المتجر الإلكتروني',
  'inventory dashboard': 'لوحة المخزون',

  // ---- Accounting ----
  'chart of accounts': 'دليل الحسابات',
  'cost centers': 'مراكز التكلفة',
  'cost center': 'مركز التكلفة',
  'fiscal years': 'السنوات المالية',
  'fiscal year': 'السنة المالية',
  'journal entries': 'القيود اليومية',
  'journal entry': 'قيد يومي',
  'general ledger': 'الأستاذ العام',
  'trial balance': 'ميزان المراجعة',
  'balance sheet': 'الميزانية العمومية',
  'income statement': 'قائمة الدخل',
  'cash flow': 'التدفق النقدي',
  'cash flows': 'التدفقات النقدية',
  'account statement': 'كشف حساب',
  'aging': 'تقادم المديونيات',
  'debt aging': 'تقادم المديونيات',
  'reports': 'التقارير',
  'aging report': 'تقرير تقادم المديونيات',

  // ---- Treasury / Banks ----
  'treasuries': 'الخزائن',
  'treasury': 'الخزينة',
  'banks': 'البنوك',
  'bank accounts': 'الحسابات البنكية',
  'received cheques': 'الشيكات المستلمة',
  'issued cheques': 'الشيكات الصادرة',
  'cheques': 'الشيكات',
  'payment vouchers': 'سندات الصرف',
  'payment voucher': 'سند صرف',
  'receipt vouchers': 'سندات القبض',
  'receipt voucher': 'سند قبض',
  'credit notes': 'الإشعارات الدائنة',
  'debit notes': 'الإشعارات المدينة',
  'bank statement': 'كشف حساب بنكي',

  // ---- Fixed Assets ----
  'fixed assets': 'الأصول الثابتة',
  'fixed asset categories': 'تصنيفات الأصول الثابتة',
  'asset categories': 'تصنيفات الأصول',
  'assets': 'الأصول',
  'depreciation schedule': 'جدول الإهلاك',
  'asset log': 'سجل الأصول',
  'accident log': 'سجل الحوادث',

  // ---- Sales ----
  'sales invoices': 'فواتير المبيعات',
  'sales invoice': 'فاتورة مبيعات',
  'sales orders': 'أوامر البيع',
  'sales order': 'أمر بيع',
  'quotations': 'عروض الأسعار',
  'quotation': 'عرض سعر',
  'sales returns': 'مرتجعات المبيعات',
  'sales by customer': 'المبيعات حسب العميل',
  'sales by product': 'المبيعات حسب المنتج',
  'sales by item': 'المبيعات حسب الصنف',
  'daily sales': 'المبيعات اليومية',
  'sales summary': 'ملخص المبيعات',
  'sales reports': 'تقارير المبيعات',
  'sales representatives': 'مندوبي المبيعات',
  'sales pipeline': 'خط مبيعات (Pipeline)',
  'sales returns report': 'تقرير مرتجعات المبيعات',
  'sales team performance': 'أداء فريق المبيعات',

  // ---- Purchases ----
  'purchase invoices': 'فواتير المشتريات',
  'purchase invoice': 'فاتورة مشتريات',
  'purchase orders': 'أوامر الشراء',
  'purchase order': 'أمر شراء',
  'purchase returns': 'مرتجعات المشتريات',
  'purchases by supplier': 'المشتريات حسب المورد',
  'purchases by product': 'المشتريات حسب المنتج',
  'purchases by item': 'المشتريات حسب الصنف',
  'purchases summary': 'ملخص المشتريات',
  'suppliers': 'الموردون',
  'supplier categories': 'تصنيفات الموردين',

  // ---- Inventory ----
  'items': 'الأصناف',
  'item': 'صنف',
  'products': 'المنتجات',
  'products and items': 'المنتجات والأصناف',
  'warehouses': 'المخازن',
  'warehouse transfers': 'التحويلات بين المخازن',
  'stock movements': 'حركات المخزون',
  'stock entries': 'قيود المخزون',
  'stock balance': 'أرصدة المخزون',
  'stock balances': 'أرصدة المخزون',
  'stock valuation': 'تقييم المخزون',
  'low stock alert': 'تنبيه نقص المخزون',
  'product performance': 'أداء المنتجات',
  'adjustments': 'التسويات',
  'adjustments and stock count': 'الجرد والتسويات',

  // ---- CRM ----
  'customers': 'العملاء',
  'customer': 'عميل',
  'customer categories': 'تصنيفات العملاء',
  'customer list': 'قائمة العملاء',
  'leads': 'العملاء المحتملون',
  'opportunities': 'الفرص البيعية',
  'pipeline': 'خط البيع',
  'activities': 'المتابعات',
  'follow-ups': 'المتابعات',
  'leads report': 'تقرير العملاء المحتملين',
  'opportunities report': 'تقرير الفرص',
  'team performance': 'أداء الفريق',
  'crm definitions': 'تعريفات إدارة العملاء',
  'add customer': 'إضافة عميل',
  'new customer': 'عميل جديد',

  // ---- HR ----
  'employees': 'الموظفون',
  'employee': 'موظف',
  'departments': 'الأقسام',
  'attendance': 'الحضور والانصراف',
  'attendance log': 'سجل الحضور والانصراف',
  'leaves': 'الإجازات',
  'payroll': 'الرواتب',
  'payroll report': 'تقرير الرواتب',
  'employee directory': 'دليل الموظفين',
  'department summary': 'ملخص الأقسام',
  'turnover': 'دوران العمالة',
  'hr settings': 'إعدادات الموارد البشرية',
  'add employee': 'إضافة موظف',
  'designation': 'المسمى الوظيفي',

  // ---- Manufacturing ----
  'bill of materials': 'قوائم المواد',
  'bom': 'قائمة المواد',
  'work orders': 'أوامر الإنتاج',
  'work order': 'أمر إنتاج',
  'work centers': 'مراكز العمل',
  'production plans': 'خطط الإنتاج',
  'production planning': 'تخطيط الإنتاج',
  'material issues': 'صرف المواد',
  'finished goods': 'المنتجات النهائية',
  'finished goods receipt': 'استلام المنتجات النهائية',
  'scrap': 'الهالك',
  'manufacturing setup': 'إعدادات التصنيع',

  // ---- Construction ----
  'projects': 'المشاريع',
  'project': 'مشروع',
  'contracts': 'العقود',
  'progress bills': 'المستخلصات',
  'boq': 'جدول الكميات',
  'boq items': 'بنود جدول الكميات',
  'project budgets': 'ميزانيات المشاريع',
  'budgets': 'الميزانيات',
  'change orders': 'أوامر التغيير',
  'variation orders': 'أوامر التغيير',
  'subcontractors': 'مقاولو الباطن',
  'equipment': 'المعدات',
  'labor records': 'سجلات العمالة',
  'labor': 'العمالة',
  'material requests': 'طلبات المواد',
  'project expenses': 'مصروفات المشاريع',
  'expenses': 'المصروفات',
  'construction reports': 'تقارير المقاولات',

  // ---- Fleet ----
  'vehicles': 'المركبات',
  'vehicle': 'مركبة',
  'drivers': 'السائقون',
  'driver': 'سائق',
  'trips': 'الرحلات',
  'trip': 'رحلة',
  'fuel': 'الوقود',
  'fuel log': 'سجل الوقود',
  'maintenance': 'الصيانة',
  'maintenance requests': 'طلبات الصيانة',
  'routes': 'المسارات',
  'route management': 'إدارة المسارات',
  'violations': 'المخالفات',
  'violations log': 'سجل المخالفات',
  'accidents': 'الحوادث',
  'fleet definitions': 'تعريفات الأسطول',
  'fleet contracts': 'عقود الأسطول',
  'gps live tracking': 'التتبع المباشر GPS',
  'live tracking': 'التتبع المباشر',

  // ---- Workshop ----
  'workshop invoices': 'فواتير الورشة',
  'job cards': 'بطاقات العمل',
  'work orders summary': 'ملخص أوامر الشغل',
  'revenue report': 'تقرير الإيرادات',
  'technician performance': 'أداء الفنيين',
  'technician performance report': 'تقرير أداء الفنيين',
  'vehicle service history': 'سجل خدمة المركبات',
  'workshop departments': 'أقسام الورشة',
  'maintenance packages': 'باقات الصيانة',
  'service types': 'أنواع الخدمات',
  'technicians': 'الفنيون',
  'labor operations': 'عمليات العمالة',

  // ---- Restaurant ----
  'branch management': 'إدارة الفروع',
  'branches': 'الفروع',
  'halls and tables': 'الصالات والطاولات',
  'halls & tables': 'الصالات والطاولات',
  'kitchen display screen': 'شاشة المطبخ (KDS)',
  'menu categories': 'تصنيفات القائمة',
  'menu items': 'أصناف القائمة',
  'modifier groups': 'مجموعات الإضافات',
  'modifiers': 'الإضافات',
  'order management': 'إدارة الطلبات',
  'point of sale': 'نقطة البيع',
  'pos': 'نقطة البيع',
  'pos terminal': 'محطة نقطة البيع',
  'production centers': 'مراكز الإنتاج',
  'recipes and cost': 'الوصفات والتكلفة',
  'recipes & cost': 'الوصفات والتكلفة',
  'reservations': 'الحجوزات',
  'shifts': 'الشيفتات',

  // ---- E-commerce ----
  'online store': 'المتجر الإلكتروني',
  'banners': 'البانرات',
  'categories': 'التصنيفات',
  'coupons': 'الكوبونات',
  'store customers': 'عملاء المتجر',
  'orders': 'الطلبات',
  'cms pages': 'صفحات المحتوى',
  'pages': 'الصفحات',
  'returns': 'المرتجعات',
  'stores': 'المتاجر',
  'shipping': 'الشحن',
  'shipping settings': 'إعدادات الشحن',
  'store': 'المتجر',

  // ---- Logistics ----
  'shipments': 'الشحنات',
  'shipment': 'الشحنة',
  'cod settlement': 'تسوية الدفع عند الاستلام',
  'delivery': 'التوصيل',
  'manage delivery': 'إدارة التوصيل',
  'manage shipments': 'إدارة الشحنات',
  'logistics reports': 'تقارير الخدمات اللوجستية',
  'logistics setup': 'إعدادات الخدمات اللوجستية',
  'e-commerce integration': 'تكامل المتجر الإلكتروني',
  'fleet and logistics integration': 'تكامل الأسطول والخدمات اللوجستية',
  'fleet & logistics integration': 'تكامل الأسطول والخدمات اللوجستية',
  'fleet logistics integration': 'تكامل الأسطول والخدمات اللوجستية',
  'shipment tracking': 'تتبع الشحنة',
  'track': 'تتبع',

  // ---- Tax ----
  'tax audit log': 'سجل تدقيق الضرائب',
  'tax compliance': 'الامتثال الضريبي',
  'annual tax summary': 'ملخص الضرائب السنوي',
  'vat report': 'تقرير ضريبة القيمة المضافة',
  'tax returns': 'الإقرارات الضريبية',
  'tax setup': 'إعدادات الضرائب',
  'tax settings': 'إعدادات الضرائب',
  'submitted invoices': 'الفواتير المُرسلة',
  'bulk submission': 'إرسال مجمع',
  'track submitted invoices': 'تتبع الفواتير المُرسلة',
  'bulk invoice submission': 'إرسال مجمع للفواتير',
  'e-invoicing': 'الفوترة الإلكترونية',
  'e-invoice': 'فاتورة إلكترونية',

  // ---- Settings ----
  'company settings': 'إعدادات الشركة',
  'company profile': 'ملف الشركة',
  'brand identity': 'الهوية البصرية',
  'document numbering': 'ترقيم المستندات',
  'api keys': 'مفاتيح API',
  'webhooks': 'Webhooks',
  'audit log': 'سجل التدقيق',
  'activity log': 'سجل النشاط',
  'approval workflow': 'سير الموافقات',
  'integrations': 'التكاملات',
  'module settings': 'إعدادات الوحدات',
  'notifications': 'الإشعارات',
  'roles and permissions': 'الأدوار والصلاحيات',
  'roles & permissions': 'الأدوار والصلاحيات',
  'users': 'المستخدمون',
  'profile': 'الملف الشخصي',
  'settings': 'الإعدادات',
  'setup': 'الإعدادات',
  'setup and pricing': 'الإعدادات والتسعير',
  'setup & pricing': 'الإعدادات والتسعير',
  'definitions': 'التعريفات',
  'main': 'الرئيسية',
  'operational settings': 'الإعدادات التشغيلية',
  'print and reports': 'الطباعة والتقارير',
  'print & reports': 'الطباعة والتقارير',
  'fiscal and accounting': 'المالية والمحاسبة',
  'fiscal & accounting': 'المالية والمحاسبة',
  'import / export': 'الاستيراد / التصدير',
  'import export': 'الاستيراد / التصدير',

  // ---- Support ----
  'support': 'الدعم الفني',
  'new ticket': 'تذكرة جديدة',
  'new support ticket': 'تذكرة دعم جديدة',
  'support reports': 'تقارير الدعم',

  // ---- Generic actions ----
  'create': 'إضافة',
  'new': 'جديد',
  'add new': 'إضافة جديد',
  'edit': 'تعديل',
  'view': 'عرض',
  'manage': 'إدارة',
  'logistics': 'الخدمات اللوجستية',
  'cart': 'السلة',
  'next page': 'الصفحة التالية',
  'next »': 'التالي »',

  // ---- One-off / composite titles surfaced after the first translation pass ----
  'warehouses storage': 'المخازن والتخزين',
  'storage': 'التخزين',
  'e commerce integration': 'تكامل المتجر الإلكتروني',
  'ecommerce integration': 'تكامل المتجر الإلكتروني',
  'management manufacturing': 'إدارة التصنيع',
  'management restaurant management': 'إدارة المطعم',
  'management maintenance workshop management': 'إدارة الورشة',
  'manufacturing': 'التصنيع',
  'workshop management': 'إدارة الورشة',
  'restaurant management': 'إدارة المطعم',
  'maintenance management': 'إدارة الصيانة',
  'select': 'اختر',
  'create purchase invoice': 'إنشاء فاتورة مشتريات',
  'create sales invoice': 'إنشاء فاتورة مبيعات',
  'create purchase order': 'إنشاء أمر شراء',
  'create sales order': 'إنشاء أمر بيع',
  'create quotation': 'إنشاء عرض سعر',
  'new purchase order': 'أمر شراء جديد',
  'new sales order': 'أمر بيع جديد',
  'new quotation': 'عرض سعر جديد',
  'new invoice': 'فاتورة جديدة',
  'new product': 'منتج جديد',
  'new supplier': 'مورد جديد',
  'halls tables': 'الصالات والطاولات',
  'kitchen display screen kds': 'شاشة المطبخ (KDS)',
  'recipes cost': 'الوصفات والتكلفة',
  'manage reservations': 'إدارة الحجوزات',
  'manage shifts': 'إدارة الشيفتات',
  'add from new': 'إضافة جديد',
  'role management': 'إدارة الأدوار',
  'representatives list': 'قائمة المندوبين',
  'add representative': 'إضافة مندوب',
  'add product': 'إضافة منتج',
  'add new account': 'إضافة حساب جديد',
  'manual entry': 'قيد يدوي',
  'manual journal entry': 'قيد يدوي',
  'submission tracking': 'متابعة الإرسال',
  'bulk submit': 'إرسال مجمع',
  'in': 'في',
  'in store': 'في المتجر',
  'in store madaar': 'في متجر مدار',
  'or production work orders': 'أوامر الإنتاج',
  'production production plans': 'خطط الإنتاج',
  'production': 'الإنتاج',
  'issue materials material issues': 'صرف المواد',
  'receipt production finished goods': 'استلام المنتجات النهائية',
  'production finished goods': 'المنتجات النهائية',
  'and components bill of materials': 'قوائم المواد',
  'components': 'المكونات',
  'integration': 'التكامل',
  'tracking': 'التتبع',
};

// Generic prefix patterns — applied AFTER the dictionary lookup fails.
// Each entry: [matcher regex (against normalized form), Arabic replacement function]
const PREFIX_PATTERNS = [
  // "Edit: X"  → "تعديل X"
  [/^edit\s*:\s*(.+)$/i, (m) => `تعديل ${DICT[normalize(m[1])] ?? m[1]}`],
  // "Edit X"   → "تعديل X"
  [/^edit\s+(.+)$/i, (m) => `تعديل ${DICT[normalize(m[1])] ?? m[1]}`],
  // "Create X" → "إنشاء X"
  [/^create\s+(.+)$/i, (m) => `إنشاء ${DICT[normalize(m[1])] ?? m[1]}`],
  // "New X"    → "X جديد"
  [/^new\s+(.+)$/i, (m) => `${DICT[normalize(m[1])] ?? m[1]} جديد`],
  // "Add X"    → "إضافة X"
  [/^add\s+(.+)$/i, (m) => `إضافة ${DICT[normalize(m[1])] ?? m[1]}`],
  // "Manage X" → "إدارة X"
  [/^manage\s+(.+)$/i, (m) => `إدارة ${DICT[normalize(m[1])] ?? m[1]}`],
];

// Add Arabic translations for the most common per-account "Edit: X" labels.
// These are the standard ERPNext / Egyptian chart-of-accounts roots.
const ACCOUNT_NAME_DICT = {
  'assets': 'الأصول',
  'notes receivable': 'أوراق القبض',
  'prepaid expenses': 'مصروفات مدفوعة مقدماً',
  'fixed assets': 'الأصول الثابتة',
  'land': 'الأراضي',
  'buildings': 'المباني',
  'vehicles': 'المركبات',
  'equipment': 'المعدات',
  'furniture': 'الأثاث',
  'accumulated depreciation': 'مجمع الإهلاك',
  'liabilities': 'الالتزامات',
  'current assets': 'الأصول المتداولة',
  'current liabilities': 'الالتزامات المتداولة',
  'accounts payable': 'حسابات الموردين',
  'accounts receivable': 'حسابات العملاء',
  'general suppliers': 'موردون عموميون',
  'general customers': 'عملاء عموميون',
  'notes payable': 'أوراق الدفع',
  'accrued expenses': 'مصروفات مستحقة',
  'tax payable': 'ضرائب مستحقة',
  'vat output': 'ضريبة القيمة المضافة (مخرجات)',
  'vat input': 'ضريبة القيمة المضافة (مدخلات)',
  'vat payable': 'ضريبة قيمة مضافة مستحقة',
  'vat payable logistics': 'ضريبة قيمة مضافة - لوجستيات',
  'salaries payable': 'رواتب مستحقة',
  'long term liabilities': 'الالتزامات طويلة الأجل',
  'long-term liabilities': 'الالتزامات طويلة الأجل',
  'cash': 'النقدية',
  'bank loans': 'قروض بنكية',
  'banks': 'البنوك',
  'equity': 'حقوق الملكية',
  'capital': 'رأس المال',
  'retained earnings': 'الأرباح المحتجزة',
  'reserves': 'الاحتياطيات',
  'drawings': 'المسحوبات',
  'revenue': 'الإيرادات',
  'sales revenue': 'إيرادات المبيعات',
  'service revenue': 'إيرادات الخدمات',
  'other income': 'إيرادات أخرى',
  'main treasury': 'الخزينة الرئيسية',
  'sales returns': 'مرتجعات المبيعات',
  'expenses': 'المصروفات',
  'cost of goods sold': 'تكلفة البضاعة المباعة',
  'operating expenses': 'المصروفات التشغيلية',
  'rent': 'الإيجار',
  'utilities': 'المرافق',
  'salaries wages': 'الرواتب والأجور',
  'salaries and wages': 'الرواتب والأجور',
  'employee allowances': 'بدلات الموظفين',
  'transportation': 'النقل',
  'administrative expenses': 'مصروفات إدارية',
  'marketing expenses': 'مصروفات تسويق',
  'financial expenses': 'مصروفات مالية',
  'employee advances': 'سلف الموظفين',
  'raw material inventory': 'مخزون المواد الخام',
  'work in progress wip': 'إنتاج تحت التشغيل',
  'work in progress': 'إنتاج تحت التشغيل',
  'finished goods inventory': 'مخزون المنتجات النهائية',
  'manufacturing overhead': 'تكاليف صناعية غير مباشرة',
  'construction revenue': 'إيرادات المقاولات',
  'work in progress construction': 'مشاريع تحت التنفيذ',
  'retention receivable': 'محتجزات لدى الغير',
  'project costs': 'تكاليف المشاريع',
  'subcontractor payable': 'مستحقات مقاولي الباطن',
  'fleet fixed assets': 'الأصول الثابتة للأسطول',
  'accumulated depreciation fleet': 'مجمع إهلاك الأسطول',
  'gps devices fleet': 'أجهزة GPS - الأسطول',
  'fuel expense': 'مصروف الوقود',
  'maintenance expense': 'مصروف الصيانة',
  'tire expense': 'مصروف الإطارات',
  'licensing registration expense': 'رسوم الترخيص والتسجيل',
  'licensing & registration expense': 'رسوم الترخيص والتسجيل',
  'insurance expense fleet': 'مصروف التأمين - الأسطول',
  'toll expense': 'مصروف الطرق',
  'toll expense logistics': 'مصروف الطرق - لوجستيات',
  'driver salaries allowances': 'رواتب وبدلات السائقين',
  'driver salaries & allowances': 'رواتب وبدلات السائقين',
  'driver expense logistics': 'مصروف السائقين - لوجستيات',
  'fleet overhead': 'تكاليف غير مباشرة للأسطول',
  'traffic violations expense': 'مصروف المخالفات المرورية',
  'fuel vendors payable': 'مستحقات موردي الوقود',
  'workshop payable': 'مستحقات الورشة',
  'traffic fines payable': 'مخالفات مرورية مستحقة',
  'transportation revenue': 'إيرادات النقل',
  'contract revenue': 'إيرادات العقود',
  'accounts receivable logistics': 'حسابات العملاء - لوجستيات',
  'inventory': 'المخزون',
  'maintenance logistics': 'صيانة - لوجستيات',
  'other expenses': 'مصروفات أخرى',
  'inventory adjustment loss': 'خسارة تسوية المخزون',
  'shortage loss': 'خسارة عجز',
  'inventory adjustment gain': 'ربح تسوية المخزون',
  'surplus gain': 'ربح فائض',
  'merchandise inventory': 'مخزون البضاعة',
  'pos cash': 'نقدية نقطة البيع',
  'depreciation expense': 'مصروف الإهلاك',
};

// Merge into main DICT so dictionary lookups also find these.
for (const [k, v] of Object.entries(ACCOUNT_NAME_DICT)) {
  if (!DICT[k]) DICT[k] = v;
}

function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    // Treat "&" as "and" before stripping punctuation so dict keys like "treasury banks dashboard" match.
    .replace(/&/g, ' ')
    .replace(/\band\b/g, ' ')
    .replace(/[._\-:/()،,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isArabic(s) {
  return /[؀-ۿ]/.test(String(s ?? ''));
}

/**
 * Translate a scanned page name to Arabic.
 *
 *  - If it's already Arabic (contains Arabic letters), return as-is (stripped).
 *  - If we have a direct dictionary entry, use it.
 *  - For composite paths like "Reports / Aging" or "Journal Entries / Create",
 *    translate each segment then join with "/".
 *  - Otherwise return the original (so we can spot untranslated entries).
 */
export function arabicTitleFor(rawTitle) {
  const stripped = strip(rawTitle);
  if (!stripped) return '';
  if (isArabic(stripped)) return stripped;

  // Direct hit on the whole title.
  const direct = DICT[normalize(stripped)];
  if (direct) return direct;

  // Prefix patterns ("Edit: X", "Create X", "New X", "Add X", "Manage X").
  for (const [re, fn] of PREFIX_PATTERNS) {
    const m = stripped.match(re);
    if (m) return fn(m);
  }

  // Try splitting by "/" or "—" and translating each segment.
  const parts = stripped.split(/\s*[/\\—–]\s*/).filter(Boolean);
  if (parts.length > 1) {
    const translated = parts.map((p) => {
      const k = normalize(p);
      return DICT[k] ?? p;
    });
    return translated.join(' / ');
  }

  return stripped;
}
