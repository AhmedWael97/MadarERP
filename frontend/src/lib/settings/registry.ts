import {
  Building2,
  BookOpen,
  ShoppingCart,
  Receipt,
  Boxes,
  Users,
  Factory,
  LifeBuoy,
  CreditCard,
  Truck,
  Calendar,
  Repeat,
  Layers,
  Printer,
  Globe,
  Mail,
  Bell,
  Cog,
  Briefcase,
  Coins,
  Video,
  PhoneCall,
  Banknote,
  type LucideIcon,
} from 'lucide-react';

/**
 * Each settings section maps a sidebar card to either a Frappe Single doctype
 * (the common case — Accounts Settings, Buying Settings, etc.) or to a regular
 * doctype with a resolved name (Company).
 *
 * Group keys mirror the high-level categories shown on the hub. The order here
 * is the display order in each category.
 */
export type SettingsGroupKey =
  | 'company'
  | 'finance'
  | 'sales'
  | 'inventory'
  | 'operations'
  | 'system';

export interface SettingsSection {
  /** URL slug — `/settings/<key>`. */
  key: string;
  /** Frappe DocType to load via FormShell. */
  doctype: string;
  /** When true, doctype is a Frappe Single — the name equals the doctype itself. */
  isSingle: boolean;
  /** Special handlers: e.g. `company` resolves the default Company name at runtime. */
  special?: 'company';
  group: SettingsGroupKey;
  icon: LucideIcon;
  /** i18n key for the title — falls back to `defaultTitle` when missing. */
  titleKey: string;
  defaultTitle: string;
  /** Short description shown on the hub card. */
  descKey: string;
  defaultDesc: string;
}

export const SETTINGS_GROUPS: Array<{ key: SettingsGroupKey; titleKey: string; defaultTitle: string }> = [
  { key: 'company', titleKey: 'settings.group.company', defaultTitle: 'الشركة والهوية البصرية' },
  { key: 'finance', titleKey: 'settings.group.finance', defaultTitle: 'المحاسبة والمالية' },
  { key: 'sales', titleKey: 'settings.group.sales', defaultTitle: 'المبيعات والمشتريات وإدارة العملاء' },
  { key: 'inventory', titleKey: 'settings.group.inventory', defaultTitle: 'المخزون والتصنيع' },
  { key: 'operations', titleKey: 'settings.group.operations', defaultTitle: 'العمليات والدعم' },
  { key: 'system', titleKey: 'settings.group.system', defaultTitle: 'النظام (فرابي)' },
];

export const SETTINGS_SECTIONS: SettingsSection[] = [
  // Company & Branding
  {
    key: 'company',
    doctype: 'Company',
    isSingle: false,
    special: 'company',
    group: 'company',
    icon: Building2,
    titleKey: 'settings.section.company.title',
    defaultTitle: 'الملف التعريفي للشركة',
    descKey: 'settings.section.company.desc',
    defaultDesc: 'الاسم القانوني، الرقم الضريبي، العملة الافتراضية، الدولة، الشعار والترويسة.',
  },
  {
    key: 'print',
    doctype: 'Print Settings',
    isSingle: true,
    group: 'company',
    icon: Printer,
    titleKey: 'settings.section.print.title',
    defaultTitle: 'الطباعة والتقارير',
    descKey: 'settings.section.print.desc',
    defaultDesc: 'تنسيق الطباعة، حجم الصفحة، اتجاه الورق، الترويسات الافتراضية.',
  },
  {
    key: 'website',
    doctype: 'Website Settings',
    isSingle: true,
    group: 'company',
    icon: Globe,
    titleKey: 'settings.section.website.title',
    defaultTitle: 'الموقع الإلكتروني',
    descKey: 'settings.section.website.desc',
    defaultDesc: 'عنوان الموقع، كود HTML للعلامة التجارية، الروابط الاجتماعية، robots.txt.',
  },

  // Accounting & Finance
  {
    key: 'accounts',
    doctype: 'Accounts Settings',
    isSingle: true,
    group: 'finance',
    icon: BookOpen,
    titleKey: 'settings.section.accounts.title',
    defaultTitle: 'إعدادات المحاسبة',
    descKey: 'settings.section.accounts.desc',
    defaultDesc: 'إعدادات الدائن والمدين، الفترات المجمدة، المحاسبة المؤجلة، التقريب.',
  },
  {
    key: 'pos',
    doctype: 'POS Settings',
    isSingle: true,
    group: 'finance',
    icon: CreditCard,
    titleKey: 'settings.section.pos.title',
    defaultTitle: 'إعدادات نقطة البيع',
    descKey: 'settings.section.pos.desc',
    defaultDesc: 'تنسيق طباعة نقطة البيع، إخفاء العميل في وضع عدم الاتصال، ترتيب المدفوعات.',
  },
  {
    key: 'subscription',
    doctype: 'Subscription Settings',
    isSingle: true,
    group: 'finance',
    icon: Repeat,
    titleKey: 'settings.section.subscription.title',
    defaultTitle: 'إعدادات الاشتراكات',
    descKey: 'settings.section.subscription.desc',
    defaultDesc: 'الإلغاء بعد فترة السماح، التوزيع النسبي للفواتير، الفوترة التلقائية.',
  },
  {
    key: 'currency-exchange',
    doctype: 'Currency Exchange Settings',
    isSingle: true,
    group: 'finance',
    icon: Coins,
    titleKey: 'settings.section.currency-exchange.title',
    defaultTitle: 'أسعار الصرف',
    descKey: 'settings.section.currency-exchange.desc',
    defaultDesc: 'مزود أسعار الصرف (الرابط، مفتاح الطلب، حقل الاستجابة).',
  },
  {
    key: 'banking',
    doctype: 'Plaid Settings',
    isSingle: true,
    group: 'finance',
    icon: Banknote,
    titleKey: 'settings.section.banking.title',
    defaultTitle: 'البنوك (Plaid)',
    descKey: 'settings.section.banking.desc',
    defaultDesc: 'تكامل Plaid للتغذية المصرفية المباشرة ومزامنة المعاملات.',
  },

  // Selling, Buying & CRM
  {
    key: 'selling',
    doctype: 'Selling Settings',
    isSingle: true,
    group: 'sales',
    icon: Receipt,
    titleKey: 'settings.section.selling.title',
    defaultTitle: 'إعدادات المبيعات',
    descKey: 'settings.section.selling.desc',
    defaultDesc: 'تسمية العملاء، متطلبات أوامر البيع، شمول الضريبة، الإعدادات الافتراضية.',
  },
  {
    key: 'buying',
    doctype: 'Buying Settings',
    isSingle: true,
    group: 'sales',
    icon: ShoppingCart,
    titleKey: 'settings.section.buying.title',
    defaultTitle: 'إعدادات المشتريات',
    descKey: 'settings.section.buying.desc',
    defaultDesc: 'تسمية الموردين، متطلبات أوامر الشراء، حدود الفوترة، الإعدادات الافتراضية.',
  },
  {
    key: 'crm',
    doctype: 'CRM Settings',
    isSingle: true,
    group: 'sales',
    icon: Users,
    titleKey: 'settings.section.crm.title',
    defaultTitle: 'إعدادات إدارة العملاء',
    descKey: 'settings.section.crm.desc',
    defaultDesc: 'نقل سجل التواصل، إعدادات تحويل العميل المحتمل إلى عميل فعلي.',
  },
  {
    key: 'appointment-booking',
    doctype: 'Appointment Booking Settings',
    isSingle: true,
    group: 'sales',
    icon: Calendar,
    titleKey: 'settings.section.appointment-booking.title',
    defaultTitle: 'حجز المواعيد',
    descKey: 'settings.section.appointment-booking.desc',
    defaultDesc: 'الإتاحة العامة، الفترات الزمنية، قائمة الإجازات، الموظفون والإشعارات.',
  },

  // Inventory & Manufacturing
  {
    key: 'stock',
    doctype: 'Stock Settings',
    isSingle: true,
    group: 'inventory',
    icon: Boxes,
    titleKey: 'settings.section.stock.title',
    defaultTitle: 'إعدادات المخزون',
    descKey: 'settings.section.stock.desc',
    defaultDesc: 'المستودع الافتراضي، طريقة التقييم، تسمية الأصناف، سلوك الدُفعات والأرقام المسلسلة.',
  },
  {
    key: 'item-variant',
    doctype: 'Item Variant Settings',
    isSingle: true,
    group: 'inventory',
    icon: Layers,
    titleKey: 'settings.section.item-variant.title',
    defaultTitle: 'متغيرات الأصناف',
    descKey: 'settings.section.item-variant.desc',
    defaultDesc: 'توريث حقول المتغيرات، سلوك نسخ الخصائص.',
  },
  {
    key: 'stock-reposting',
    doctype: 'Stock Reposting Settings',
    isSingle: true,
    group: 'inventory',
    icon: Repeat,
    titleKey: 'settings.section.stock-reposting.title',
    defaultTitle: 'إعادة ترحيل المخزون',
    descKey: 'settings.section.stock-reposting.desc',
    defaultDesc: 'حجم الدُفعة، إعادة الترحيل بحسب الصنف أو المعاملة.',
  },
  {
    key: 'delivery',
    doctype: 'Delivery Settings',
    isSingle: true,
    group: 'inventory',
    icon: Truck,
    titleKey: 'settings.section.delivery.title',
    defaultTitle: 'إعدادات التسليم',
    descKey: 'settings.section.delivery.desc',
    defaultDesc: 'إرسال إشعارات عند الشحن، تجاوز عنوان الإرسال.',
  },
  {
    key: 'manufacturing',
    doctype: 'Manufacturing Settings',
    isSingle: true,
    group: 'inventory',
    icon: Factory,
    titleKey: 'settings.section.manufacturing.title',
    defaultTitle: 'إعدادات التصنيع',
    descKey: 'settings.section.manufacturing.desc',
    defaultDesc: 'تخطيط الطاقة الإنتاجية، المستودعات الافتراضية، الإفراط في الإنتاج لأوامر العمل.',
  },

  // Operations & Support
  {
    key: 'projects',
    doctype: 'Projects Settings',
    isSingle: true,
    group: 'operations',
    icon: Briefcase,
    titleKey: 'settings.section.projects.title',
    defaultTitle: 'إعدادات المشاريع',
    descKey: 'settings.section.projects.desc',
    defaultDesc: 'قواعد ورقة الوقت، مسار حالة المهام، إعدادات اكتمال المشروع.',
  },
  {
    key: 'support',
    doctype: 'Support Settings',
    isSingle: true,
    group: 'operations',
    icon: LifeBuoy,
    titleKey: 'settings.section.support.title',
    defaultTitle: 'إعدادات الدعم الفني',
    descKey: 'settings.section.support.desc',
    defaultDesc: 'اتفاقيات مستوى الخدمة، أوقات الاستجابة والحل الافتراضية.',
  },
  {
    key: 'video',
    doctype: 'Video Settings',
    isSingle: true,
    group: 'operations',
    icon: Video,
    titleKey: 'settings.section.video.title',
    defaultTitle: 'إعدادات الفيديو',
    descKey: 'settings.section.video.desc',
    defaultDesc: 'مفتاح YouTube API لتتبع الفيديو والتحليلات.',
  },
  {
    key: 'telephony',
    doctype: 'Incoming Call Settings',
    isSingle: true,
    group: 'operations',
    icon: PhoneCall,
    titleKey: 'settings.section.telephony.title',
    defaultTitle: 'الاتصالات الهاتفية',
    descKey: 'settings.section.telephony.desc',
    defaultDesc: 'توجيه المكالمات الواردة وقواعد تعيين الموظفين.',
  },

  // System (Frappe)
  {
    key: 'system',
    doctype: 'System Settings',
    isSingle: true,
    group: 'system',
    icon: Cog,
    titleKey: 'settings.section.system.title',
    defaultTitle: 'إعدادات النظام',
    descKey: 'settings.section.system.desc',
    defaultDesc: 'المنطقة الزمنية، اللغة، سياسة كلمة المرور، انتهاء الجلسة، رفع الملفات.',
  },
  {
    key: 'email-domain',
    doctype: 'Email Domain',
    isSingle: false,
    group: 'system',
    icon: Mail,
    titleKey: 'settings.section.email-domain.title',
    defaultTitle: 'نطاقات البريد الإلكتروني',
    descKey: 'settings.section.email-domain.desc',
    defaultDesc: 'إعدادات SMTP / IMAP المشتركة بين حسابات البريد الإلكتروني.',
  },
  {
    key: 'notification',
    doctype: 'Notification Settings',
    isSingle: true,
    group: 'system',
    icon: Bell,
    titleKey: 'settings.section.notification.title',
    defaultTitle: 'إعدادات الإشعارات',
    descKey: 'settings.section.notification.desc',
    defaultDesc: 'اشتراكات البريد الإلكتروني لكل مستخدم للتعيينات والإشارات والتحديثات.',
  },
];

export function sectionByKey(key: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((s) => s.key === key);
}

export function sectionsByGroup(group: SettingsGroupKey): SettingsSection[] {
  return SETTINGS_SECTIONS.filter((s) => s.group === group);
}
