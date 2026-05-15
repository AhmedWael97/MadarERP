/* Runtime mapping from scanned table column headers → real Frappe fields.
 *
 * The scan captured table column headers as plain strings (English or Arabic).
 * Frappe's DocType meta lists real fieldnames + labels. This module bridges
 * the two so <DataTable> can fetch the right column without per-page codegen.
 *
 * Strategy (first match wins):
 *   1. Synonyms dictionary (covers the ~80% of cases we know up front).
 *   2. Exact fieldname match against meta.fields[].fieldname.
 *   3. Case/diacritic-insensitive label match against meta.fields[].label.
 *   4. Substring match.
 *   5. Mark as synthetic ("—") so the column renders as a placeholder.
 */

export interface MetaField {
  fieldname: string;
  label?: string;
  fieldtype?: string;
  in_list_view?: 0 | 1;
}

/** Pre-baked header → fieldname dictionary. Synonyms grouped by likely fields. */
const SYNONYMS: Array<{ field: string; aliases: string[] }> = [
  // ---- Identity / numbers ----
  { field: '__row_index', aliases: ['#', '№', 'ر.م', 'م'] },
  { field: 'name', aliases: ['id', 'code', 'الكود', 'الرقم', 'invoice number', 'invoice no', 'رقم الفاتورة', 'رقم', 'no', 'reference'] },

  // ---- Dates ----
  { field: 'posting_date', aliases: ['date', 'التاريخ', 'تاريخ', 'invoice date', 'تاريخ الفاتورة', 'posting date', 'تاريخ الترحيل'] },
  { field: 'transaction_date', aliases: ['order date', 'تاريخ الطلب', 'transaction date'] },
  { field: 'due_date', aliases: ['due date', 'تاريخ الاستحقاق'] },
  { field: 'creation', aliases: ['created', 'تاريخ الإنشاء'] },

  // ---- Parties ----
  { field: 'customer_name', aliases: ['customer', 'العميل', 'customer name', 'اسم العميل'] },
  { field: 'supplier_name', aliases: ['supplier', 'المورد', 'supplier name', 'اسم المورد'] },
  { field: 'employee_name', aliases: ['employee', 'الموظف', 'employee name', 'اسم الموظف'] },
  { field: 'sales_partner', aliases: ['representative', 'rep', 'مندوب', 'المندوب', 'sales rep', 'salesperson', 'البائع'] },

  // ---- Money ----
  { field: 'grand_total', aliases: ['total', 'الإجمالي', 'amount', 'القيمة', 'المبلغ', 'grand total', 'الإجمالي الكلي'] },
  { field: 'paid_amount', aliases: ['paid', 'المدفوع', 'paid amount', 'المسدد'] },
  { field: 'outstanding_amount', aliases: ['due', 'المتبقي', 'outstanding', 'المستحق', 'balance', 'الرصيد', 'المتبقى'] },
  { field: 'rate', aliases: ['rate', 'السعر', 'price', 'سعر'] },
  { field: 'qty', aliases: ['qty', 'quantity', 'الكمية', 'كمية'] },

  // ---- Status / classification ----
  { field: 'status', aliases: ['status', 'الحالة', 'state'] },
  { field: 'docstatus', aliases: ['doc status', 'حالة المستند'] },
  { field: 'company', aliases: ['company', 'الشركة'] },
  { field: 'branch', aliases: ['branch', 'الفرع', 'فرع'] },
  { field: 'currency', aliases: ['currency', 'العملة'] },

  // ---- Account-specific ----
  { field: 'account_name', aliases: ['account name', 'اسم الحساب'] },
  { field: 'account_number', aliases: ['account number', 'رقم الحساب', 'account code'] },
  { field: 'root_type', aliases: ['type', 'النوع', 'root type'] },
  { field: 'account_type', aliases: ['nature', 'الطبيعة', 'account type', 'تصنيف'] },
  { field: 'is_group', aliases: ['group', 'مجموعة', 'is group'] },

  // ---- Inventory ----
  { field: 'item_code', aliases: ['item code', 'كود الصنف', 'sku'] },
  { field: 'item_name', aliases: ['item name', 'اسم الصنف', 'الصنف', 'product', 'المنتج'] },
  { field: 'stock_uom', aliases: ['uom', 'الوحدة', 'وحدة القياس'] },
  { field: 'warehouse', aliases: ['warehouse', 'المخزن', 'المستودع', 'store'] },
  { field: 'actual_qty', aliases: ['stock', 'الرصيد', 'available qty', 'الكمية المتاحة'] },

  // ---- HR ----
  { field: 'department', aliases: ['department', 'القسم', 'الإدارة'] },
  { field: 'designation', aliases: ['designation', 'المسمى الوظيفي', 'job title'] },

  // ---- Synthetic / not a field ----
  { field: '__actions', aliases: ['actions', 'الإجراءات', 'إجراءات', 'options', 'الخيارات'] },
  { field: '__level', aliases: ['level', 'المستوى', 'الترتيب'] },
];

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    // strip Arabic diacritics
    .replace(/[ً-ْ]/g, '')
    // collapse whitespace + punctuation
    .replace(/[._\-:/()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SYNONYM_INDEX: Map<string, string> = new Map();
for (const { field, aliases } of SYNONYMS) {
  for (const a of aliases) {
    SYNONYM_INDEX.set(normalize(a), field);
  }
}

/**
 * Resolve a single scanned column header to its real Frappe fieldname,
 * given the DocType's meta fields. Returns null if no plausible match.
 * Synthetic IDs (rows starting with `__`) signal the table to render '—'.
 */
export function resolveColumnField(header: string, metaFields: MetaField[]): string | null {
  const norm = normalize(header);
  if (!norm) return null;

  // 1. Synonym dictionary.
  const fromSyn = SYNONYM_INDEX.get(norm);
  if (fromSyn) {
    if (fromSyn.startsWith('__')) return fromSyn;
    if (metaFields.some((f) => f.fieldname === fromSyn)) return fromSyn;
    // Synonym suggested a fieldname this DocType doesn't have — fall through.
  }

  // 2. Exact fieldname match.
  const exactField = metaFields.find((f) => f.fieldname === norm.replace(/\s+/g, '_'));
  if (exactField) return exactField.fieldname;

  // 3. Case/diacritic-insensitive label match.
  const exactLabel = metaFields.find((f) => normalize(f.label || '') === norm);
  if (exactLabel) return exactLabel.fieldname;

  // 4. Substring match against labels (longest first to favour specificity).
  const subs = metaFields
    .filter((f) => f.label && normalize(f.label).includes(norm))
    .sort((a, b) => (a.label!.length - b.label!.length));
  if (subs.length > 0) return subs[0].fieldname;

  return null;
}

/** Resolve every scanned column to a fieldname (or synthetic marker). */
export function resolveColumns(
  scanned: Array<{ header: string }>,
  metaFields: MetaField[],
): Array<{ header: string; field: string | null }> {
  return scanned.map((c) => ({
    header: c.header,
    field: resolveColumnField(c.header, metaFields),
  }));
}

/** English → Arabic header translation for scanned column labels. Falls back to the input. */
const EN_TO_AR_HEADER: Record<string, string> = {
  '#': '#',
  id: 'المعرف',
  code: 'الكود',
  name: 'الاسم',
  'invoice number': 'رقم الفاتورة',
  'invoice no': 'رقم الفاتورة',
  'order number': 'رقم الطلب',
  reference: 'المرجع',
  date: 'التاريخ',
  'posting date': 'تاريخ الترحيل',
  'invoice date': 'تاريخ الفاتورة',
  'order date': 'تاريخ الطلب',
  'transaction date': 'تاريخ المعاملة',
  'due date': 'تاريخ الاستحقاق',
  created: 'تاريخ الإنشاء',
  customer: 'العميل',
  'customer name': 'اسم العميل',
  supplier: 'المورد',
  'supplier name': 'اسم المورد',
  employee: 'الموظف',
  'employee name': 'اسم الموظف',
  representative: 'المندوب',
  rep: 'المندوب',
  'sales rep': 'مندوب المبيعات',
  salesperson: 'مندوب المبيعات',
  total: 'الإجمالي',
  'grand total': 'الإجمالي الكلي',
  amount: 'المبلغ',
  paid: 'المسدد',
  'paid amount': 'المبلغ المسدد',
  due: 'المتبقي',
  outstanding: 'المتبقي',
  balance: 'الرصيد',
  rate: 'السعر',
  price: 'السعر',
  qty: 'الكمية',
  quantity: 'الكمية',
  status: 'الحالة',
  state: 'الحالة',
  'doc status': 'حالة المستند',
  company: 'الشركة',
  branch: 'الفرع',
  currency: 'العملة',
  'account name': 'اسم الحساب',
  'account number': 'رقم الحساب',
  'account code': 'كود الحساب',
  type: 'النوع',
  'root type': 'النوع الأساسي',
  nature: 'الطبيعة',
  'account type': 'نوع الحساب',
  group: 'مجموعة',
  'is group': 'مجموعة',
  'item code': 'كود الصنف',
  'item name': 'اسم الصنف',
  item: 'الصنف',
  product: 'المنتج',
  uom: 'الوحدة',
  warehouse: 'المخزن',
  store: 'المتجر',
  stock: 'الرصيد',
  'available qty': 'الكمية المتاحة',
  department: 'القسم',
  designation: 'المسمى الوظيفي',
  'job title': 'المسمى الوظيفي',
  actions: 'الإجراءات',
  options: 'الخيارات',
  level: 'المستوى',
};

/** Translate a scanned header into the active locale. */
export function translateHeader(header: string, locale: string): string {
  if (locale === 'ar') {
    return EN_TO_AR_HEADER[normalize(header)] ?? header;
  }
  return header;
}
