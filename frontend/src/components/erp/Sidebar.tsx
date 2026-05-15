import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Receipt,
  Boxes,
  Users,
  Truck,
  Wrench,
  Utensils,
  HardHat,
  Globe,
  Calculator,
  Settings,
  Briefcase,
  Banknote,
  Building2,
  Package,
  LifeBuoy,
  Factory,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
  FileText,
  UserCog,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  to: string;
  labelAr: string;
  labelKey?: string;
  icon: LucideIcon;
  /** When the item has children it becomes a collapsible group header. */
  children?: { to: string; labelAr: string }[];
}

interface NavSection {
  /** Small uppercase-style label drawn above the items. */
  headerAr: string;
  items: NavItem[];
}

// Curated 2-level menu structure that mirrors the reference (screenshots 002 / 028).
// Children are the most frequently-used sub-pages per module; the full set is still
// reachable via the in-page navigation on the module landing.
const SECTIONS: NavSection[] = [
  {
    headerAr: 'القائمة الرئيسية',
    items: [{ to: '/dashboard', labelAr: 'لوحة التحكم', labelKey: 'nav.dashboard', icon: LayoutDashboard }],
  },
  {
    headerAr: 'الإدارة المالية',
    items: [
      {
        to: '/accounting',
        labelAr: 'الحسابات العامة',
        labelKey: 'nav.accounting',
        icon: BookOpen,
        children: [
          { to: '/accounting', labelAr: 'لوحة المعلومات' },
          { to: '/accounting/chart-of-accounts', labelAr: 'شجرة الحسابات' },
          { to: '/accounting/journal-entries', labelAr: 'القيود اليومية' },
          { to: '/accounting/cost-centers', labelAr: 'مراكز التكلفة' },
          { to: '/accounting/fiscal-years', labelAr: 'السنوات المالية' },
        ],
      },
      {
        to: '/treasury',
        labelAr: 'الخزائن والبنوك',
        labelKey: 'nav.treasury',
        icon: Wallet,
        children: [
          { to: '/treasury', labelAr: 'لوحة المعلومات' },
          { to: '/treasury/treasuries', labelAr: 'الخزائن' },
          { to: '/treasury/banks', labelAr: 'الحسابات البنكية' },
          { to: '/financial/checks', labelAr: 'الشيكات' },
        ],
      },
      {
        to: '/financial/receipt-vouchers',
        labelAr: 'المستندات المالية',
        icon: FileText,
        children: [
          { to: '/financial/receipt-vouchers', labelAr: 'سندات القبض' },
          { to: '/financial/payment-vouchers', labelAr: 'سندات الصرف' },
          { to: '/financial/credit-notes', labelAr: 'إشعارات دائنة' },
          { to: '/financial/debit-notes', labelAr: 'إشعارات مدينة' },
        ],
      },
      { to: '/customers', labelAr: 'العملاء', icon: Users },
      { to: '/suppliers', labelAr: 'الموردين', icon: Truck },
      { to: '/assets', labelAr: 'الأصول الثابتة', labelKey: 'nav.assets', icon: Building2 },
    ],
  },
  {
    headerAr: 'العمليات التجارية',
    items: [
      {
        to: '/sales',
        labelAr: 'المبيعات',
        labelKey: 'nav.sales',
        icon: Receipt,
        children: [
          { to: '/sales/dashboard', labelAr: 'لوحة المبيعات' },
          { to: '/sales/invoices', labelAr: 'فواتير المبيعات' },
          { to: '/sales/orders', labelAr: 'طلبات المبيعات' },
          { to: '/sales/quotations', labelAr: 'عروض الأسعار' },
          { to: '/sales/returns', labelAr: 'مرتجعات المبيعات' },
        ],
      },
      {
        to: '/purchases',
        labelAr: 'المشتريات',
        labelKey: 'nav.purchases',
        icon: ShoppingCart,
        children: [
          { to: '/purchases/dashboard', labelAr: 'لوحة المشتريات' },
          { to: '/purchases/invoices', labelAr: 'فواتير المشتريات' },
          { to: '/purchases/orders', labelAr: 'طلبات الشراء' },
          { to: '/purchases/returns', labelAr: 'مرتجعات المشتريات' },
        ],
      },
      {
        to: '/inventory',
        labelAr: 'المخزون',
        labelKey: 'nav.inventory',
        icon: Boxes,
        children: [
          { to: '/inventory/dashboard', labelAr: 'لوحة المخزون' },
          { to: '/inventory/products', labelAr: 'المنتجات والأصناف' },
          { to: '/inventory/movements', labelAr: 'حركات المخزون' },
          { to: '/inventory/warehouses', labelAr: 'المخازن والمستودعات' },
        ],
      },
      { to: '/sales-reps', labelAr: 'مندوبين المبيعات', icon: UserCog },
    ],
  },
  {
    headerAr: 'الموارد والعلاقات',
    items: [
      {
        to: '/hr',
        labelAr: 'إدارة الموارد البشرية',
        labelKey: 'nav.hr',
        icon: Briefcase,
        children: [
          { to: '/hr', labelAr: 'لوحة الموارد' },
          { to: '/hr/employees', labelAr: 'الموظفين' },
          { to: '/hr/departments', labelAr: 'الأقسام' },
          { to: '/hr/attendance', labelAr: 'الحضور والانصراف' },
          { to: '/hr/leaves', labelAr: 'الإجازات' },
          { to: '/hr/payroll', labelAr: 'مسيرات الرواتب' },
        ],
      },
      {
        to: '/crm',
        labelAr: 'إدارة علاقات العملاء',
        labelKey: 'nav.crm',
        icon: Users,
        children: [
          { to: '/crm', labelAr: 'لوحة CRM' },
          { to: '/crm/leads', labelAr: 'العملاء المحتملين' },
          { to: '/crm/opportunities', labelAr: 'الفرص البيعية' },
          { to: '/crm/pipeline', labelAr: 'Sales Pipeline' },
          { to: '/crm/activities', labelAr: 'المتابعات' },
        ],
      },
    ],
  },
  {
    headerAr: 'العمليات التشغيلية',
    items: [
      {
        to: '/construction',
        labelAr: 'المقاولات',
        labelKey: 'nav.construction',
        icon: HardHat,
        children: [
          { to: '/construction', labelAr: 'لوحة المقاولات' },
          { to: '/construction/projects', labelAr: 'المشاريع' },
          { to: '/construction/boq', labelAr: 'جدول الكميات (BOQ)' },
          { to: '/construction/billings', labelAr: 'المستخلصات' },
          { to: '/construction/contracts', labelAr: 'العقود' },
          { to: '/construction/variations', labelAr: 'أوامر التغيير' },
        ],
      },
      {
        to: '/fleet',
        labelAr: 'الأسطول',
        labelKey: 'nav.fleet',
        icon: Truck,
        children: [
          { to: '/fleet/dashboard', labelAr: 'لوحة الأسطول' },
          { to: '/fleet/vehicles', labelAr: 'المركبات' },
          { to: '/fleet/drivers', labelAr: 'السائقين' },
          { to: '/fleet/trips', labelAr: 'الرحلات' },
          { to: '/fleet/fuel', labelAr: 'سجل الوقود' },
          { to: '/fleet/maintenance/requests', labelAr: 'طلبات الصيانة' },
        ],
      },
      {
        to: '/logistics',
        labelAr: 'الخدمات اللوجستية',
        labelKey: 'nav.logistics',
        icon: Package,
        children: [
          { to: '/logistics/dashboard', labelAr: 'لوحة اللوجستيات' },
          { to: '/logistics/shipments', labelAr: 'الشحنات' },
          { to: '/logistics/deliveries', labelAr: 'التوصيلات' },
          { to: '/logistics/cod', labelAr: 'تسوية الـ COD' },
        ],
      },
      {
        to: '/workshop',
        labelAr: 'الورشة',
        labelKey: 'nav.workshop',
        icon: Wrench,
        children: [
          { to: '/workshop', labelAr: 'لوحة الورشة' },
          { to: '/workshop/invoices', labelAr: 'فواتير الورشة' },
          { to: '/workshop/job-cards', labelAr: 'بطاقات العمل' },
          { to: '/workshop/vehicles', labelAr: 'المركبات' },
        ],
      },
      {
        to: '/restaurant',
        labelAr: 'المطعم',
        labelKey: 'nav.restaurant',
        icon: Utensils,
        children: [
          { to: '/restaurant', labelAr: 'لوحة المطعم' },
          { to: '/restaurant/branches', labelAr: 'الفروع' },
          { to: '/restaurant/menu-items', labelAr: 'الأصناف' },
          { to: '/restaurant/orders', labelAr: 'الطلبات' },
          { to: '/restaurant/pos', labelAr: 'نقاط البيع' },
        ],
      },
      {
        to: '/mfg',
        labelAr: 'التصنيع',
        labelKey: 'nav.manufacturing',
        icon: Factory,
        children: [
          { to: '/mfg', labelAr: 'لوحة التصنيع' },
          { to: '/mfg/work-orders', labelAr: 'أوامر التصنيع' },
          { to: '/mfg/bom', labelAr: 'قوائم المكونات' },
          { to: '/mfg/work-centers', labelAr: 'مراكز العمل' },
        ],
      },
    ],
  },
  {
    headerAr: 'الإعدادات والامتثال',
    items: [
      {
        to: '/ecommerce',
        labelAr: 'المتجر الإلكتروني',
        labelKey: 'nav.ecommerce',
        icon: Globe,
        children: [
          { to: '/ecommerce', labelAr: 'لوحة المتجر' },
          { to: '/ecommerce/products', labelAr: 'المنتجات' },
          { to: '/ecommerce/orders', labelAr: 'الطلبات' },
          { to: '/ecommerce/customers', labelAr: 'العملاء' },
          { to: '/ecommerce/coupons', labelAr: 'الكوبونات' },
        ],
      },
      {
        to: '/tax',
        labelAr: 'الضرائب',
        labelKey: 'nav.tax',
        icon: Calculator,
        children: [
          { to: '/tax/dashboard', labelAr: 'لوحة الضرائب' },
          { to: '/tax/returns', labelAr: 'إقرارات ضريبية' },
          { to: '/tax/submissions', labelAr: 'الفواتير المرسلة' },
          { to: '/tax/audit-log', labelAr: 'سجل التدقيق' },
        ],
      },
      { to: '/support', labelAr: 'الدعم الفني', labelKey: 'nav.support', icon: LifeBuoy },
      {
        to: '/settings',
        labelAr: 'الإعدادات',
        labelKey: 'nav.settings',
        icon: Settings,
        children: [
          { to: '/settings', labelAr: 'إعدادات الشركة' },
          { to: '/user-management/users', labelAr: 'المستخدمين' },
          { to: '/user-management/roles', labelAr: 'الأدوار والصلاحيات' },
        ],
      },
    ],
  },
];

function isPathActive(currentPath: string, target: string): boolean {
  if (target === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
  return currentPath === target || currentPath.startsWith(target + '/');
}

function NavLeaf({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const active = isPathActive(pathname, to);
  return (
    <NavLink
      to={to}
      className={[
        'block rounded-[var(--radius-input)] py-1.5 ps-9 pe-3 text-[13px] transition-colors',
        active
          ? 'bg-[color:var(--color-primary)]/15 text-[color:var(--color-emerald-300)] font-semibold'
          : 'text-[color:var(--color-sidebar-fg)]/75 hover:bg-[color:var(--color-sidebar-hover)] hover:text-[color:var(--color-sidebar-fg)]',
      ].join(' ')}
    >
      {label}
    </NavLink>
  );
}

function NavGroup({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const activeAncestor = isPathActive(pathname, item.to)
    || (item.children?.some((c) => isPathActive(pathname, c.to)) ?? false);
  const [open, setOpen] = useState(activeAncestor);

  // Re-sync expanded state when the route changes (e.g., deep link or back/forward).
  useEffect(() => {
    if (activeAncestor) setOpen(true);
  }, [activeAncestor]);

  const Icon = item.icon;
  const label = item.labelKey ? t(item.labelKey, { defaultValue: item.labelAr }) : item.labelAr;

  if (!item.children || item.children.length === 0) {
    return (
      <NavLink
        to={item.to}
        end={item.to === '/dashboard'}
        className={({ isActive }) =>
          [
            'group flex items-center gap-3 rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-[color:var(--color-primary)] text-white shadow-[var(--shadow-card)]'
              : 'text-[color:var(--color-sidebar-fg)] hover:bg-[color:var(--color-sidebar-hover)]',
          ].join(' ')
        }
      >
        <Icon size={18} className="shrink-0 opacity-90" />
        <span className="truncate">{label}</span>
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
          'flex w-full items-center gap-3 rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium transition-colors',
          activeAncestor
            ? 'bg-[color:var(--color-primary)] text-white shadow-[var(--shadow-card)]'
            : 'text-[color:var(--color-sidebar-fg)] hover:bg-[color:var(--color-sidebar-hover)]',
        ].join(' ')}
      >
        <Icon size={18} className="shrink-0 opacity-90" />
        <span className="flex-1 truncate text-start">{label}</span>
        {open ? <ChevronUp size={14} className="opacity-70" /> : <ChevronDown size={14} className="opacity-70" />}
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {item.children.map((c) => (
            <NavLeaf key={c.to} to={c.to} label={c.labelAr} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const sections = useMemo(() => SECTIONS, []);

  return (
    <aside className="bg-sidebar flex h-dvh flex-col overflow-y-auto">
      {/* Brand — emerald gradient logo tile + stacked wordmark, mirrors screenshot 002. */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <div
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[color:var(--color-emerald-400)] via-[color:var(--color-emerald-500)] to-[color:var(--color-teal-500)] text-white shadow-[var(--shadow-elev)]"
        >
          {/* simple geometric mark — matches the small "spark" glyph in the brand block */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="text-[11px] font-semibold tracking-widest text-[color:var(--color-sidebar-section)]">
            Madaar
          </div>
          <div className="text-lg font-extrabold text-[color:var(--color-sidebar-fg)]">
            <span className="text-[color:var(--color-emerald-400)]">مدار</span>
            <span className="ms-1">ERP</span>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-[color:var(--color-sidebar-hover)]/40" />

      <nav className="flex-1 space-y-4 px-3 py-4">
        {sections.map((section, i) => (
          <div key={i}>
            <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-sidebar-section)]">
              {section.headerAr}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavGroup key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer pin — small badge similar to the reference site footer block. */}
      <div className="border-t border-[color:var(--color-sidebar-hover)]/40 px-4 py-3 text-[10px] text-[color:var(--color-sidebar-section)]">
        <div className="flex items-center gap-2">
          <CreditCard size={12} className="opacity-70" />
          <span>الإصدار 1.85 • مدار ERP</span>
        </div>
      </div>
    </aside>
  );
}
