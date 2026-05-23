import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Factory,
  FileText,
  GraduationCap,
  Globe,
  HardHat,
  CalendarRange,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Utensils,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Reference parity:
// Mirrors `resources/views/layouts/partials/sidebar.blade.php` from the Laravel
// reference 1:1 — same section order, same Arabic labels, same sub-section
// accent groupings. Paths are translated from Laravel route names to the
// React-Router equivalents (e.g. `accounting.dashboard` → `/accounting`).
// ─────────────────────────────────────────────────────────────────────────────

type AccentColor = 'brand' | 'emerald' | 'teal' | 'amber' | 'cyan' | 'orange' | 'violet' | 'blue' | 'pink' | 'rose' | 'slate';

interface Leaf {
  to: string;
  labelAr: string;
}

interface Group {
  /** Coloured sub-section title (e.g. "📊 التقارير") rendered above its links. */
  headerAr?: string;
  leaves: Leaf[];
}

interface Item {
  to: string;        // landing route for the collapsible group itself
  labelAr: string;
  icon: LucideIcon;
  accent: AccentColor;
  /** When present, item is a collapsible group; sub-section headers can split children. */
  groups?: Group[];
}

interface Section {
  headerAr: string;
  items: Item[];
}

const SECTIONS: Section[] = [
  // ── 1. Main menu ─────────────────────────────────────────────────────────
  {
    headerAr: 'القائمة الرئيسية',
    items: [
      { to: '/dashboard', labelAr: 'لوحة التحكم', icon: LayoutDashboard, accent: 'brand' },
    ],
  },

  // ── 2. Financial management ──────────────────────────────────────────────
  {
    headerAr: 'الإدارة المالية',
    items: [
      {
        to: '/accounting',
        labelAr: 'الحسابات العامة',
        icon: BookOpen,
        accent: 'emerald',
        groups: [
          {
            leaves: [
              { to: '/accounting',                       labelAr: 'لوحة المعلومات' },
              { to: '/accounting/chart-of-accounts',     labelAr: 'شجرة الحسابات' },
              { to: '/accounting/journal-entries',       labelAr: 'القيود اليومية' },
              { to: '/accounting/cost-centers',          labelAr: 'مراكز التكلفة' },
              { to: '/accounting/fiscal-years',          labelAr: 'السنوات المالية' },
            ],
          },
          {
            headerAr: '📋 التقارير المحاسبية',
            leaves: [
              { to: '/accounting/reports/trial-balance',     labelAr: 'ميزان المراجعة' },
              { to: '/accounting/reports/balance-sheet',     labelAr: 'الميزانية العمومية' },
              { to: '/accounting/reports/income-statement',  labelAr: 'قائمة الدخل' },
              { to: '/accounting/reports/general-ledger',    labelAr: 'الأستاذ العام' },
              { to: '/accounting/reports/account-statement', labelAr: 'كشف حساب' },
              { to: '/accounting/reports/cash-flow',         labelAr: 'التدفقات النقدية' },
            ],
          },
        ],
      },
      // ── Task 1: merged Treasuries + Receipt/Payment vouchers under one collapsible tab.
      {
        to: '/treasury',
        labelAr: 'الخزائن والسندات',
        icon: Wallet,
        accent: 'violet',
        groups: [
          {
            headerAr: 'الخزائن والبنوك',
            leaves: [
              { to: '/treasury',                   labelAr: 'لوحة المعلومات' },
              { to: '/treasury/treasuries',        labelAr: 'الخزائن' },
              { to: '/treasury/bank-institutions', labelAr: 'البنوك' },
              { to: '/treasury/banks',             labelAr: 'الحسابات البنكية' },
              { to: '/treasury/currencies',        labelAr: 'العملات' },
              { to: '/treasury/exchange-rates',    labelAr: 'أسعار الصرف' },
            ],
          },
          {
            headerAr: 'سندات القبض والصرف',
            leaves: [
              { to: '/financial/receipt-vouchers', labelAr: 'سندات القبض' },
              { to: '/financial/payment-vouchers', labelAr: 'سندات الصرف' },
            ],
          },
          {
            headerAr: 'الشيكات',
            leaves: [
              { to: '/financial/checks',                  labelAr: 'جميع الشيكات' },
              { to: '/financial/checks?type=received',    labelAr: 'شيكات مستلمة' },
              { to: '/financial/checks?type=issued',      labelAr: 'شيكات صادرة' },
            ],
          },
          {
            headerAr: '📊 تقارير مالية',
            leaves: [
              { to: '/financial/reports/vouchers',       labelAr: 'تقرير السندات' },
              { to: '/financial/reports/checks',         labelAr: 'تقرير الشيكات' },
              { to: '/financial/reports/bank-statement', labelAr: 'كشف حساب بنكي' },
              { to: '/financial/reports/cash-flow',      labelAr: 'التدفق النقدي' },
            ],
          },
        ],
      },
      // ── Task 2: credit / debit notes as a standalone sidebar item.
      {
        to: '/financial/credit-notes',
        labelAr: 'الإشعارات المدينة والدائنة',
        icon: FileText,
        accent: 'amber',
        groups: [
          {
            leaves: [
              { to: '/financial/credit-notes', labelAr: 'إشعارات دائنة' },
              { to: '/financial/debit-notes',  labelAr: 'إشعارات مدينة' },
            ],
          },
        ],
      },
      {
        to: '/customers',
        labelAr: 'العملاء',
        icon: Users,
        accent: 'blue',
        groups: [
          {
            leaves: [
              { to: '/customers',            labelAr: 'قائمة العملاء' },
              { to: '/customers/create',     labelAr: 'عميل جديد' },
              { to: '/customer-categories',  labelAr: 'تصنيفات العملاء' },
              { to: '/customer-groups',      labelAr: 'مجموعات العملاء' },
            ],
          },
          // ── Task 3: debt aging moved under Customers.
          {
            headerAr: '📊 التقارير',
            leaves: [
              { to: '/customers/reports/aging', labelAr: 'أعمار الديون' },
            ],
          },
        ],
      },
      {
        to: '/suppliers',
        labelAr: 'الموردين',
        icon: Truck,
        accent: 'teal',
        groups: [
          {
            leaves: [
              { to: '/suppliers',            labelAr: 'قائمة الموردين' },
              { to: '/suppliers/create',     labelAr: 'مورد جديد' },
              { to: '/supplier-categories',  labelAr: 'تصنيفات الموردين' },
              { to: '/supplier-groups',      labelAr: 'مجموعات الموردين' },
            ],
          },
        ],
      },
      {
        to: '/fixed-assets/dashboard',
        labelAr: 'الأصول الثابتة',
        icon: Building2,
        accent: 'amber',
        groups: [
          {
            leaves: [
              { to: '/fixed-assets/dashboard',  labelAr: 'لوحة المعلومات' },
              { to: '/fixed-assets/assets',     labelAr: 'الأصول' },
              { to: '/fixed-assets/categories', labelAr: 'التصنيفات' },
            ],
          },
          {
            headerAr: '📊 التقارير',
            leaves: [
              { to: '/fixed-assets/reports/register',     labelAr: 'سجل الأصول الثابتة' },
              { to: '/fixed-assets/reports/depreciation', labelAr: 'جدول الإهلاك' },
            ],
          },
        ],
      },
    ],
  },

  // ── 3. Business operations ───────────────────────────────────────────────
  {
    headerAr: 'العمليات التجارية',
    items: [
      {
        to: '/sales',
        labelAr: 'المبيعات',
        icon: Receipt,
        accent: 'brand',
        groups: [
          {
            leaves: [
              { to: '/sales/dashboard',         labelAr: 'لوحة المعلومات' },
              { to: '/retail/pos',              labelAr: 'نقطة البيع (كاشير)' },
              { to: '/sales/invoices',          labelAr: 'فواتير المبيعات' },
              { to: '/sales/invoices/create',   labelAr: 'فاتورة جديدة' },
              { to: '/sales/quotations',        labelAr: 'عروض الأسعار' },
              { to: '/sales/orders',            labelAr: 'أوامر البيع' },
              { to: '/sales/returns',           labelAr: 'مردودات المبيعات' },
              { to: '/sales/price-lists',       labelAr: 'قوائم الأسعار' },
            ],
          },
          {
            headerAr: '📊 التقارير',
            leaves: [
              { to: '/sales/reports/summary',      labelAr: 'ملخص المبيعات' },
              { to: '/sales/reports/by-customer',  labelAr: 'المبيعات بالعميل' },
              { to: '/sales/reports/by-product',   labelAr: 'المبيعات بالمنتج' },
              { to: '/sales/reports/aging',        labelAr: 'تقادم المديونيات' },
              { to: '/sales/reports/daily',        labelAr: 'المبيعات اليومية' },
              { to: '/sales/reports/returns',      labelAr: 'تقرير المرتجعات' },
            ],
          },
        ],
      },
      {
        to: '/purchases',
        labelAr: 'المشتريات',
        icon: ShoppingCart,
        accent: 'blue',
        groups: [
          {
            leaves: [
              { to: '/purchases/dashboard',         labelAr: 'لوحة المعلومات' },
              { to: '/purchases/invoices',          labelAr: 'فواتير المشتريات' },
              { to: '/purchases/invoices/create',   labelAr: 'فاتورة جديدة' },
              { to: '/purchases/orders',            labelAr: 'طلبات الشراء' },
              { to: '/purchases/returns',           labelAr: 'مردودات المشتريات' },
            ],
          },
          {
            headerAr: '📊 التقارير',
            leaves: [
              { to: '/purchases/reports/summary',     labelAr: 'ملخص المشتريات' },
              { to: '/purchases/reports/by-supplier', labelAr: 'المشتريات بالمورد' },
              { to: '/purchases/reports/by-product',  labelAr: 'المشتريات بالمنتج' },
              { to: '/purchases/reports/aging',       labelAr: 'تقادم المستحقات' },
              { to: '/purchases/reports/returns',     labelAr: 'تقرير مرتجعات الشراء' },
            ],
          },
        ],
      },
      {
        to: '/inventory',
        labelAr: 'المخزون',
        icon: Package,
        accent: 'teal',
        groups: [
          {
            leaves: [
              { to: '/inventory/dashboard',        labelAr: 'لوحة المعلومات' },
              { to: '/inventory/products',         labelAr: 'المنتجات' },
              { to: '/inventory/products/create',  labelAr: 'منتج جديد' },
              { to: '/inventory/product-categories', labelAr: 'تصنيفات المنتجات' },
              { to: '/inventory/product-groups',   labelAr: 'مجموعات المنتجات' },
              { to: '/inventory/warehouses',       labelAr: 'المخازن' },
              { to: '/inventory/movements',        labelAr: 'حركات المخزون' },
              { to: '/inventory/adjustments',      labelAr: 'الجرد والتسويات' },
              { to: '/inventory/transfers',        labelAr: 'التحويلات بين المخازن' },
            ],
          },
          {
            headerAr: '📊 التقارير',
            leaves: [
              { to: '/inventory/reports/stock-status',        labelAr: 'أرصدة المخزون' },
              { to: '/inventory/reports/stock-movements',     labelAr: 'حركات المخزون' },
              { to: '/inventory/reports/low-stock',           labelAr: 'تنبيه نقص المخزون' },
              { to: '/inventory/reports/valuation',           labelAr: 'تقييم المخزون' },
              { to: '/inventory/reports/product-performance', labelAr: 'أداء المنتجات' },
            ],
          },
        ],
      },
      {
        to: '/sales-reps',
        labelAr: 'مندوبين المبيعات',
        icon: UserCog,
        accent: 'pink',
        groups: [
          {
            leaves: [
              { to: '/sales-reps',         labelAr: 'قائمة المندوبين' },
              { to: '/sales-reps/create',  labelAr: 'إضافة مندوب' },
            ],
          },
        ],
      },
      {
        to: '/hr',
        labelAr: 'إدارة الموارد البشرية',
        icon: Briefcase,
        accent: 'teal',
        groups: [
          { leaves: [{ to: '/hr', labelAr: 'لوحة المعلومات' }] },
          {
            headerAr: 'شؤون الموظفين',
            leaves: [
              { to: '/hr/employees',         labelAr: 'الموظفين' },
              { to: '/hr/departments',       labelAr: 'الأقسام' },
              { to: '/hr/employees/create',  labelAr: 'إضافة موظف' },
              { to: '/hr/setup',             labelAr: 'التعريفات' },
            ],
          },
          {
            headerAr: 'الحضور والرواتب',
            leaves: [
              { to: '/hr/attendance', labelAr: 'سجل الحضور' },
              { to: '/hr/leaves',     labelAr: 'الإجازات' },
              { to: '/hr/payroll',    labelAr: 'الرواتب' },
            ],
          },
          // ── Task 6: Employee Custody (ERPNext Employee Advance + Expense Claim).
          {
            headerAr: 'العهد والمصروفات',
            leaves: [
              { to: '/hr/employee-custody',          labelAr: 'العهد' },
              { to: '/hr/employee-custody/create',   labelAr: 'فتح عهدة جديدة' },
              { to: '/hr/employee-custody/expenses', labelAr: 'مصروفات العهدة' },
              { to: '/hr/employee-custody/return',   labelAr: 'إرجاع باقي العهدة' },
              { to: '/hr/employee-custody/expense-tree', labelAr: 'شجرة أنواع المصروفات' },
            ],
          },
          {
            headerAr: '📊 التقارير',
            leaves: [
              { to: '/hr/reports/employees',   labelAr: 'دليل الموظفين' },
              { to: '/hr/reports/departments', labelAr: 'ملخص الأقسام' },
              { to: '/hr/reports/salary',      labelAr: 'تقرير الرواتب' },
              { to: '/hr/reports/turnover',    labelAr: 'دوران العمالة' },
            ],
          },
        ],
      },
      {
        to: '/crm',
        labelAr: 'إدارة علاقات العملاء',
        icon: Users,
        accent: 'violet',
        groups: [
          {
            leaves: [
              { to: '/crm',                labelAr: 'لوحة المعلومات' },
              { to: '/crm/leads',          labelAr: 'العملاء المحتملين' },
              { to: '/crm/opportunities',  labelAr: 'الفرص البيعية' },
              { to: '/crm/pipeline',       labelAr: 'Pipeline' },
              { to: '/crm/activities',     labelAr: 'المتابعات' },
              { to: '/crm/setup',          labelAr: 'التعريفات' },
            ],
          },
          {
            headerAr: '📊 التقارير',
            leaves: [
              { to: '/crm/reports/leads',            labelAr: 'تقرير العملاء المحتملين' },
              { to: '/crm/reports/opportunities',    labelAr: 'تقرير الفرص' },
              { to: '/crm/reports/team-performance', labelAr: 'أداء فريق المبيعات' },
            ],
          },
        ],
      },
      {
        to: '/mfg',
        labelAr: 'إدارة التصنيع',
        icon: Factory,
        accent: 'teal',
        groups: [
          {
            leaves: [
              { to: '/mfg',                  labelAr: 'لوحة المعلومات' },
              { to: '/mfg/bom',              labelAr: 'قائمة المكونات (BOM)' },
              { to: '/mfg/work-centers',     labelAr: 'مراكز العمل' },
              { to: '/mfg/work-orders',      labelAr: 'أوامر الإنتاج' },
              { to: '/mfg/material-issues',  labelAr: 'صرف المواد' },
              { to: '/mfg/finished-goods',   labelAr: 'استلام الإنتاج' },
              { to: '/mfg/scrap',            labelAr: 'الهالك' },
              { to: '/mfg/production-plans', labelAr: 'تخطيط الإنتاج' },
              { to: '/mfg/setup',            labelAr: 'التعريفات' },
            ],
          },
        ],
      },
    ],
  },

  // ── 4. Construction ──────────────────────────────────────────────────────
  {
    headerAr: 'إدارة المقاولات',
    items: [
      {
        to: '/construction',
        labelAr: 'المقاولات',
        icon: HardHat,
        accent: 'orange',
        groups: [
          {
            leaves: [
              { to: '/construction',           labelAr: 'لوحة التحكم' },
              { to: '/construction/projects',  labelAr: 'المشاريع' },
              { to: '/construction/contracts', labelAr: 'العقود' },
              { to: '/construction/boq',       labelAr: 'بنود الكميات BOQ' },
            ],
          },
          {
            headerAr: 'التكاليف والموارد',
            leaves: [
              { to: '/construction/budgets',        labelAr: 'الميزانيات' },
              { to: '/construction/subcontractors', labelAr: 'مقاولين الباطن' },
              { to: '/construction/materials',      labelAr: 'طلبات المواد' },
              { to: '/construction/expenses',       labelAr: 'المصروفات' },
              { to: '/construction/labor',          labelAr: 'العمالة' },
              { to: '/construction/equipment',      labelAr: 'المعدات' },
            ],
          },
          {
            headerAr: 'المستخلصات',
            leaves: [
              { to: '/construction/billings',   labelAr: 'المستخلصات' },
              { to: '/construction/variations', labelAr: 'أوامر التغيير' },
            ],
          },
          {
            headerAr: 'التقارير',
            leaves: [
              { to: '/construction/reports', labelAr: 'تقارير المقاولات' },
            ],
          },
        ],
      },
    ],
  },

  // ── 5. Fleet ─────────────────────────────────────────────────────────────
  {
    headerAr: 'إدارة الأسطول',
    items: [
      {
        to: '/fleet',
        labelAr: 'إدارة الأسطول',
        icon: Truck,
        accent: 'cyan',
        groups: [
          {
            headerAr: 'لوحة التحكم والتعريفات',
            leaves: [
              { to: '/fleet/dashboard', labelAr: 'لوحة التحكم' },
              { to: '/fleet/setup',     labelAr: 'التعريفات' },
            ],
          },
          {
            headerAr: 'الأسطول والعمليات',
            leaves: [
              { to: '/fleet/vehicles', labelAr: 'المركبات' },
              { to: '/fleet/drivers',  labelAr: 'السائقين' },
              { to: '/fleet/routes',   labelAr: 'المسارات' },
              { to: '/fleet/trips',    labelAr: 'الرحلات' },
              { to: '/fleet/fuel',     labelAr: 'الوقود' },
            ],
          },
          {
            headerAr: 'الصيانة والسلامة',
            leaves: [
              { to: '/fleet/maintenance/requests', labelAr: 'الصيانة' },
              { to: '/fleet/accidents',            labelAr: 'الحوادث' },
              { to: '/fleet/violations',           labelAr: 'المخالفات' },
            ],
          },
          {
            headerAr: 'العقود والمالية',
            leaves: [
              { to: '/fleet/contracts', labelAr: 'العقود' },
              { to: '/fleet/billing',   labelAr: 'المستخلصات' },
            ],
          },
        ],
      },
    ],
  },

  // ── 6. Tax compliance ────────────────────────────────────────────────────
  {
    headerAr: 'الامتثال الضريبي',
    items: [
      {
        to: '/tax',
        labelAr: 'الامتثال الضريبي',
        icon: Calculator,
        accent: 'rose',
        groups: [
          {
            headerAr: 'لوحة التحكم والتعريفات',
            leaves: [
              { to: '/tax/dashboard', labelAr: 'لوحة التحكم' },
              { to: '/tax/setup',     labelAr: 'التعريفات الضريبية' },
            ],
          },
          {
            headerAr: 'الفاتورة الإلكترونية',
            leaves: [
              { to: '/tax/submissions',      labelAr: 'متابعة الإرسال' },
              { to: '/tax/submissions/bulk', labelAr: 'إرسال مجمع' },
            ],
          },
          {
            headerAr: 'الإقرارات والتقارير',
            leaves: [
              { to: '/tax/returns',   labelAr: 'الإقرارات الضريبية' },
              { to: '/tax/audit-log', labelAr: 'سجل التدقيق' },
            ],
          },
          {
            headerAr: '📊 تقارير ضريبية',
            leaves: [
              { to: '/tax/reports/vat',     labelAr: 'تقرير ضريبة القيمة المضافة' },
              { to: '/tax/reports/summary', labelAr: 'ملخص الضرائب السنوي' },
            ],
          },
        ],
      },
    ],
  },

  // ── 7. Logistics ─────────────────────────────────────────────────────────
  {
    headerAr: 'اللوجستيك',
    items: [
      {
        to: '/logistics',
        labelAr: 'إدارة اللوجستيك',
        icon: Package,
        accent: 'cyan',
        groups: [
          {
            headerAr: 'لوحة التحكم والتعريفات',
            leaves: [
              { to: '/logistics/dashboard', labelAr: 'لوحة التحكم' },
              { to: '/logistics/setup',     labelAr: 'التعريفات والتسعير' },
            ],
          },
          {
            headerAr: 'إدارة الطلبات',
            leaves: [
              { to: '/logistics/orders', labelAr: 'الطلبات' },
            ],
          },
          {
            headerAr: 'الشحن والتوصيل',
            leaves: [
              { to: '/logistics/shipments',  labelAr: 'الشحنات' },
              { to: '/logistics/deliveries', labelAr: 'التوصيل' },
            ],
          },
          {
            headerAr: 'التتبع والمراقبة',
            leaves: [
              { to: '/logistics/tracking/map',    labelAr: 'التتبع المباشر GPS' },
              { to: '/logistics/tracking/search', labelAr: 'تتبع شحنة / سيارة' },
            ],
          },
          {
            headerAr: 'المالية والتقارير',
            leaves: [
              { to: '/logistics/billing', labelAr: 'الفوترة' },
              { to: '/logistics/cod',     labelAr: 'تسوية COD' },
              { to: '/logistics/reports', labelAr: 'التقارير' },
            ],
          },
          {
            headerAr: 'التكامل',
            leaves: [
              { to: '/logistics/ecommerce', labelAr: 'التجارة الإلكترونية' },
              { to: '/logistics/fleet',     labelAr: 'تكامل الأسطول' },
            ],
          },
        ],
      },
    ],
  },

  // ── 8. E-commerce ────────────────────────────────────────────────────────
  {
    headerAr: 'المتجر الإلكتروني',
    items: [
      {
        to: '/ecommerce',
        labelAr: 'المتجر الإلكتروني',
        icon: Globe,
        accent: 'violet',
        groups: [
          {
            leaves: [
              { to: '/ecommerce',            labelAr: 'لوحة التحكم' },
              { to: '/ecommerce/stores',     labelAr: 'المتاجر' },
              { to: '/ecommerce/categories', labelAr: 'التصنيفات' },
              { to: '/ecommerce/products',   labelAr: 'المنتجات' },
              { to: '/ecommerce/orders',     labelAr: 'الطلبات' },
              { to: '/ecommerce/customers',  labelAr: 'عملاء المتجر' },
              { to: '/ecommerce/coupons',    labelAr: 'الكوبونات' },
              { to: '/ecommerce/pages',      labelAr: 'الصفحات' },
              { to: '/ecommerce/banners',    labelAr: 'البنرات' },
              { to: '/ecommerce/shipping',   labelAr: 'الشحن' },
              { to: '/ecommerce/returns',    labelAr: 'المرتجعات' },
            ],
          },
        ],
      },
    ],
  },

  // ── 8b. LMS (Madaar LMS — 16 sections backed by Madaar LMS * doctypes) ───
  {
    headerAr: 'التعليم والتدريب',
    items: [
      {
        to: '/lms',
        labelAr: 'منصة التعليم LMS',
        icon: GraduationCap,
        accent: 'cyan',
        groups: [
          { leaves: [{ to: '/lms', labelAr: 'لوحة التحكم' }] },
          {
            headerAr: 'المحتوى الدراسي',
            leaves: [
              { to: '/lms/programs',    labelAr: 'البرامج التعليمية' },
              { to: '/lms/courses',     labelAr: 'الدورات' },
              { to: '/lms/chapters',    labelAr: 'الفصول' },
              { to: '/lms/lessons',     labelAr: 'الدروس' },
              { to: '/lms/quizzes',     labelAr: 'الاختبارات' },
              { to: '/lms/assignments', labelAr: 'المهام والواجبات' },
            ],
          },
          {
            headerAr: 'المستخدمون',
            leaves: [
              { to: '/lms/students',    labelAr: 'الطلاب' },
              { to: '/lms/instructors', labelAr: 'المدرسين' },
              { to: '/lms/enrollments', labelAr: 'التسجيلات' },
              { to: '/lms/batches',     labelAr: 'الدفعات' },
            ],
          },
          {
            headerAr: 'التقييم والتقدم',
            leaves: [
              { to: '/lms/grades',       labelAr: 'الدرجات' },
              { to: '/lms/certificates', labelAr: 'الشهادات' },
              { to: '/lms/progress',     labelAr: 'متابعة التقدم' },
            ],
          },
          {
            headerAr: 'التشغيل',
            leaves: [
              { to: '/lms/schedule',   labelAr: 'الجدول الزمني' },
              { to: '/lms/attendance', labelAr: 'الحضور' },
              { to: '/lms/payments',   labelAr: 'الرسوم والمدفوعات' },
            ],
          },
        ],
      },
    ],
  },

  // ── 8c. Events (Culture Wheel) ───────────────────────────────────────────
  // Twelve stages + master data, all backed by madaar_events doctypes and
  // rendered through the generic Events / EventsList / EventsForm pages.
  {
    headerAr: 'إدارة الفعاليات',
    items: [
      {
        to: '/events',
        labelAr: 'عجلة الثقافة',
        icon: CalendarRange,
        accent: 'pink',
        groups: [
          { leaves: [{ to: '/events', labelAr: 'لوحة التحكم' }] },
          {
            headerAr: 'الاستقبال والتعاقد',
            leaves: [
              { to: '/events/requests',       labelAr: 'طلبات الفعاليات' },
              { to: '/events/schedules',      labelAr: 'الجدولة والقاعات' },
              { to: '/events/resource-plans', labelAr: 'خطط الموارد' },
              { to: '/events/contracts',      labelAr: 'العقود' },
              { to: '/events/finance-cases',  labelAr: 'الملفات المالية' },
              { to: '/events/publications',   labelAr: 'النشر على الموقع' },
              { to: '/events/marketing',      labelAr: 'الحملات التسويقية' },
            ],
          },
          {
            headerAr: 'التنفيذ والإغلاق',
            leaves: [
              { to: '/events/operations',     labelAr: 'إشعارات التشغيل' },
              { to: '/events/day-checklist',  labelAr: 'تشيك ليست اليوم' },
              { to: '/events/closures',       labelAr: 'الإغلاق وما بعد الفعالية' },
            ],
          },
          {
            headerAr: 'البيانات الأساسية',
            leaves: [
              { to: '/events/venues', labelAr: 'القاعات والمواقع' },
              { to: '/events/types',  labelAr: 'أنواع الفعاليات' },
            ],
          },
        ],
      },
    ],
  },

  // ── 9. Support ───────────────────────────────────────────────────────────
  {
    headerAr: 'الدعم الفني',
    items: [
      {
        to: '/support',
        labelAr: 'تذاكر الدعم',
        icon: LifeBuoy,
        accent: 'amber',
        groups: [
          {
            leaves: [
              { to: '/support',          labelAr: 'تذاكر الدعم' },
              { to: '/support/create',   labelAr: 'تذكرة جديدة' },
              { to: '/support/reports',  labelAr: 'تقارير الدعم' },
            ],
          },
        ],
      },
    ],
  },

  // ── 10. Company settings ─────────────────────────────────────────────────
  {
    headerAr: 'إعدادات الشركة',
    items: [
      { to: '/settings', labelAr: 'إعدادات الشركة', icon: Settings, accent: 'slate' },
    ],
  },

  // ── 12. Restaurant ───────────────────────────────────────────────────────
  {
    headerAr: 'إدارة المطاعم',
    items: [
      {
        to: '/restaurant',
        labelAr: 'إدارة المطاعم',
        icon: Utensils,
        accent: 'orange',
        groups: [
          { leaves: [{ to: '/restaurant', labelAr: 'لوحة التحكم' }] },
          {
            headerAr: 'الإعدادات',
            leaves: [
              { to: '/restaurant/branches',           labelAr: 'الفروع' },
              { to: '/restaurant/halls',              labelAr: 'الصالات والطاولات' },
              { to: '/restaurant/production-centers', labelAr: 'مراكز الإنتاج' },
            ],
          },
          {
            headerAr: 'قائمة الطعام',
            leaves: [
              { to: '/restaurant/menu-categories', labelAr: 'التصنيفات' },
              { to: '/restaurant/menu-items',      labelAr: 'الأصناف' },
              { to: '/restaurant/modifiers',       labelAr: 'الإضافات' },
              { to: '/restaurant/recipes',         labelAr: 'الوصفات والتكلفة' },
            ],
          },
          {
            headerAr: 'التشغيل',
            leaves: [
              { to: '/restaurant/cashier',          labelAr: 'نقطة البيع (كاشير)' },
              { to: '/restaurant/pos',              labelAr: 'ملفات نقطة البيع' },
              { to: '/restaurant/kitchen/display',  labelAr: 'شاشة المطبخ' },
              { to: '/restaurant/orders',           labelAr: 'الطلبات' },
              { to: '/restaurant/delivery',         labelAr: 'التوصيل' },
              { to: '/restaurant/reservations',     labelAr: 'الحجوزات' },
              { to: '/restaurant/shifts',           labelAr: 'الشيفتات' },
            ],
          },
          {
            headerAr: 'التقارير',
            leaves: [
              { to: '/restaurant/reports/sales', labelAr: 'التقارير' },
            ],
          },
        ],
      },
    ],
  },

  // ── 13. Workshop / Service centers ───────────────────────────────────────
  {
    headerAr: 'إدارة مراكز الصيانة',
    items: [
      {
        to: '/workshop',
        labelAr: 'إدارة مراكز الصيانة',
        icon: Wrench,
        accent: 'amber',
        groups: [
          { leaves: [{ to: '/workshop', labelAr: 'لوحة التحكم' }] },
          {
            headerAr: 'العمليات',
            leaves: [
              { to: '/workshop/vehicles',   labelAr: 'السيارات' },
              { to: '/workshop/job-cards',  labelAr: 'أوامر الشغل' },
              { to: '/workshop/invoices',   labelAr: 'الفواتير' },
            ],
          },
          {
            headerAr: 'التقارير',
            leaves: [
              { to: '/workshop/reports/revenue',           labelAr: 'الإيرادات' },
              { to: '/workshop/reports/technicians',       labelAr: 'أداء الفنيين' },
              { to: '/workshop/reports/vehicle-history',   labelAr: 'سجل السيارات' },
              { to: '/workshop/reports/job-card-summary',  labelAr: 'ملخص أوامر الشغل' },
            ],
          },
          {
            headerAr: 'الإعدادات',
            leaves: [
              { to: '/workshop/setup/service-types',     labelAr: 'أنواع الخدمات' },
              { to: '/workshop/setup/sections',          labelAr: 'أقسام الورشة' },
              { to: '/workshop/setup/technicians',       labelAr: 'الفنيين' },
              { to: '/workshop/setup/labor-operations',  labelAr: 'عمليات العمالة' },
              { to: '/workshop/setup/service-packages',  labelAr: 'باقات الصيانة' },
            ],
          },
        ],
      },
    ],
  },

  // ── 14. User management ──────────────────────────────────────────────────
  {
    headerAr: 'إدارة المستخدمين',
    items: [
      {
        to: '/user-management',
        labelAr: 'المستخدمين والصلاحيات',
        icon: UserCog,
        accent: 'brand',
        groups: [
          {
            leaves: [
              { to: '/user-management/users',        labelAr: 'المستخدمين' },
              { to: '/user-management/roles',        labelAr: 'الأدوار والصلاحيات' },
              { to: '/user-management/activity-log', labelAr: 'سجل النشاطات' },
            ],
          },
        ],
      },
    ],
  },
];

// ─── Accent colour → Tailwind colour-token used for the colored sub-section
// header text + active-leaf state, mirroring the reference's per-module hue.
const ACCENT_TEXT: Record<AccentColor, string> = {
  brand:   'text-[color:var(--color-brand-400)]',
  emerald: 'text-emerald-400',
  teal:    'text-teal-400',
  amber:   'text-amber-400',
  cyan:    'text-cyan-400',
  orange:  'text-orange-400',
  violet:  'text-violet-400',
  blue:    'text-blue-400',
  pink:    'text-pink-400',
  rose:    'text-rose-400',
  slate:   'text-slate-400',
};
const ACCENT_BG_TINT: Record<AccentColor, string> = {
  brand:   'bg-[color:var(--color-brand-500)]/10',
  emerald: 'bg-emerald-500/10',
  teal:    'bg-teal-500/10',
  amber:   'bg-amber-500/10',
  cyan:    'bg-cyan-500/10',
  orange:  'bg-orange-500/10',
  violet:  'bg-violet-500/10',
  blue:    'bg-blue-500/10',
  pink:    'bg-pink-500/10',
  rose:    'bg-rose-500/10',
  slate:   'bg-slate-500/10',
};

function isPathActive(currentPath: string, target: string): boolean {
  const cleanTarget = target.split('?')[0];
  if (cleanTarget === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
  return currentPath === cleanTarget || currentPath.startsWith(cleanTarget + '/');
}

function NavLeaf({ to, label, accent }: { to: string; label: string; accent: AccentColor }) {
  const { pathname } = useLocation();
  const active = isPathActive(pathname, to);
  const activeCls = [ACCENT_TEXT[accent], ACCENT_BG_TINT[accent], 'font-bold'].join(' ');
  return (
    <NavLink
      to={to}
      className={[
        'flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition-all',
        active ? activeCls : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
      ].join(' ')}
    >
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function NavItem({ item }: { item: Item }) {
  const { pathname } = useLocation();
  const hasGroups = !!item.groups && item.groups.length > 0;
  const activeAncestor =
    isPathActive(pathname, item.to) ||
    (hasGroups &&
      item.groups!.some((g) => g.leaves.some((l) => isPathActive(pathname, l.to))));
  const [open, setOpen] = useState(activeAncestor);

  useEffect(() => {
    if (activeAncestor) setOpen(true);
  }, [activeAncestor]);

  const Icon = item.icon;

  if (!hasGroups) {
    return (
      <NavLink
        to={item.to}
        end={item.to === '/dashboard'}
        className={({ isActive }) =>
          [
            'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? `${ACCENT_TEXT[item.accent]} ${ACCENT_BG_TINT[item.accent]} font-bold`
              : 'text-slate-300 hover:text-white hover:bg-white/5',
          ].join(' ')
        }
      >
        <Icon size={18} className="shrink-0 opacity-90" />
        <span className="truncate">{item.labelAr}</span>
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={[
          'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
          activeAncestor
            ? `${ACCENT_TEXT[item.accent]} ${ACCENT_BG_TINT[item.accent]} font-bold`
            : 'text-slate-300 hover:text-white hover:bg-white/5',
        ].join(' ')}
      >
        <Icon size={18} className="shrink-0 opacity-90" />
        <span className="flex-1 text-start truncate">{item.labelAr}</span>
        {open ? (
          <ChevronUp size={14} className="opacity-70" />
        ) : (
          <ChevronDown size={14} className="opacity-70" />
        )}
      </button>
      {open && (
        <div className="mt-1 ps-3 space-y-0.5 border-s border-white/5">
          {item.groups!.map((group, gi) => (
            <div key={gi} className="space-y-0.5">
              {group.headerAr && (
                <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                  <span className={['text-[11px] font-black tracking-wide', ACCENT_TEXT[item.accent]].join(' ')}>
                    {group.headerAr}
                  </span>
                </div>
              )}
              {group.leaves.map((leaf) => (
                <NavLeaf key={leaf.to} to={leaf.to} label={leaf.labelAr} accent={item.accent} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const sections = useMemo(() => SECTIONS, []);

  return (
    <aside className="h-dvh w-[17rem] bg-slate-900 text-slate-100 flex flex-col overflow-y-auto">
      {/* Brand block — gradient logo tile + wordmark, mirrors the reference. */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <div
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[color:var(--color-brand-400)] via-[color:var(--color-brand-500)] to-[color:var(--color-brand-700)] text-white shadow-[var(--shadow-elev)]"
        >
          <img src="/images/madaar-logo.png" alt="Madaar" className="w-7 h-7 object-contain brightness-0 invert" />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] font-semibold tracking-widest text-slate-400">Madaar</div>
          <div className="text-lg font-extrabold text-white">
            <span className="text-[color:var(--color-brand-400)]">{isAr ? 'مدار' : 'Madaar'}</span>
            <span className="ms-1">ERP</span>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-white/5" />

      <nav className="flex-1 space-y-4 px-3 py-4">
        {sections.map((section, i) => (
          <div key={i}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-1">
              {section.headerAr}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 px-4 py-3 text-[10px] text-slate-500">
        <div className="flex items-center gap-2">
          <CreditCard size={12} className="opacity-70" />
          <span>{isAr ? 'الإصدار 1.85 • مدار ERP' : 'v1.85 • Madaar ERP'}</span>
        </div>
      </div>
    </aside>
  );
}
