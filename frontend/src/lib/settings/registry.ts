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
  { key: 'company', titleKey: 'settings.group.company', defaultTitle: 'Company & Branding' },
  { key: 'finance', titleKey: 'settings.group.finance', defaultTitle: 'Accounting & Finance' },
  { key: 'sales', titleKey: 'settings.group.sales', defaultTitle: 'Selling, Buying & CRM' },
  { key: 'inventory', titleKey: 'settings.group.inventory', defaultTitle: 'Inventory & Manufacturing' },
  { key: 'operations', titleKey: 'settings.group.operations', defaultTitle: 'Operations & Support' },
  { key: 'system', titleKey: 'settings.group.system', defaultTitle: 'System (Frappe)' },
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
    defaultTitle: 'Company Profile',
    descKey: 'settings.section.company.desc',
    defaultDesc: 'Legal name, tax ID, default currency, country, logo and letterhead.',
  },
  {
    key: 'print',
    doctype: 'Print Settings',
    isSingle: true,
    group: 'company',
    icon: Printer,
    titleKey: 'settings.section.print.title',
    defaultTitle: 'Print & PDF',
    descKey: 'settings.section.print.desc',
    defaultDesc: 'Print format, page size, paper orientation, letterhead defaults.',
  },
  {
    key: 'website',
    doctype: 'Website Settings',
    isSingle: true,
    group: 'company',
    icon: Globe,
    titleKey: 'settings.section.website.title',
    defaultTitle: 'Website',
    descKey: 'settings.section.website.desc',
    defaultDesc: 'Public site title, brand HTML, footer, social links, robots.txt.',
  },

  // Accounting & Finance
  {
    key: 'accounts',
    doctype: 'Accounts Settings',
    isSingle: true,
    group: 'finance',
    icon: BookOpen,
    titleKey: 'settings.section.accounts.title',
    defaultTitle: 'Accounts Settings',
    descKey: 'settings.section.accounts.desc',
    defaultDesc: 'Credit/debit defaults, frozen periods, deferred accounting, rounding.',
  },
  {
    key: 'pos',
    doctype: 'POS Settings',
    isSingle: true,
    group: 'finance',
    icon: CreditCard,
    titleKey: 'settings.section.pos.title',
    defaultTitle: 'POS Settings',
    descKey: 'settings.section.pos.desc',
    defaultDesc: 'POS print format, hide customer in offline mode, payments order.',
  },
  {
    key: 'subscription',
    doctype: 'Subscription Settings',
    isSingle: true,
    group: 'finance',
    icon: Repeat,
    titleKey: 'settings.section.subscription.title',
    defaultTitle: 'Subscriptions',
    descKey: 'settings.section.subscription.desc',
    defaultDesc: 'Cancel after grace period, prorate invoices, automatic invoicing.',
  },
  {
    key: 'currency-exchange',
    doctype: 'Currency Exchange Settings',
    isSingle: true,
    group: 'finance',
    icon: Coins,
    titleKey: 'settings.section.currency-exchange.title',
    defaultTitle: 'Currency Exchange',
    descKey: 'settings.section.currency-exchange.desc',
    defaultDesc: 'Exchange rate provider (URL, request key, response field).',
  },
  {
    key: 'banking',
    doctype: 'Plaid Settings',
    isSingle: true,
    group: 'finance',
    icon: Banknote,
    titleKey: 'settings.section.banking.title',
    defaultTitle: 'Banking (Plaid)',
    descKey: 'settings.section.banking.desc',
    defaultDesc: 'Plaid integration for live bank feeds and transaction sync.',
  },

  // Selling, Buying & CRM
  {
    key: 'selling',
    doctype: 'Selling Settings',
    isSingle: true,
    group: 'sales',
    icon: Receipt,
    titleKey: 'settings.section.selling.title',
    defaultTitle: 'Selling Settings',
    descKey: 'settings.section.selling.desc',
    defaultDesc: 'Customer naming, sales order requirements, tax inclusion, defaults.',
  },
  {
    key: 'buying',
    doctype: 'Buying Settings',
    isSingle: true,
    group: 'sales',
    icon: ShoppingCart,
    titleKey: 'settings.section.buying.title',
    defaultTitle: 'Buying Settings',
    descKey: 'settings.section.buying.desc',
    defaultDesc: 'Supplier naming, PO requirements, billing thresholds, defaults.',
  },
  {
    key: 'crm',
    doctype: 'CRM Settings',
    isSingle: true,
    group: 'sales',
    icon: Users,
    titleKey: 'settings.section.crm.title',
    defaultTitle: 'CRM Settings',
    descKey: 'settings.section.crm.desc',
    defaultDesc: 'Carry forward communication, lead-to-customer conversion defaults.',
  },
  {
    key: 'appointment-booking',
    doctype: 'Appointment Booking Settings',
    isSingle: true,
    group: 'sales',
    icon: Calendar,
    titleKey: 'settings.section.appointment-booking.title',
    defaultTitle: 'Appointment Booking',
    descKey: 'settings.section.appointment-booking.desc',
    defaultDesc: 'Public availability, time slots, holiday list, agents and notifications.',
  },

  // Inventory & Manufacturing
  {
    key: 'stock',
    doctype: 'Stock Settings',
    isSingle: true,
    group: 'inventory',
    icon: Boxes,
    titleKey: 'settings.section.stock.title',
    defaultTitle: 'Stock Settings',
    descKey: 'settings.section.stock.desc',
    defaultDesc: 'Default warehouse, valuation method, item naming, batch/serial behavior.',
  },
  {
    key: 'item-variant',
    doctype: 'Item Variant Settings',
    isSingle: true,
    group: 'inventory',
    icon: Layers,
    titleKey: 'settings.section.item-variant.title',
    defaultTitle: 'Item Variants',
    descKey: 'settings.section.item-variant.desc',
    defaultDesc: 'Variant field inheritance, attribute copy behavior.',
  },
  {
    key: 'stock-reposting',
    doctype: 'Stock Reposting Settings',
    isSingle: true,
    group: 'inventory',
    icon: Repeat,
    titleKey: 'settings.section.stock-reposting.title',
    defaultTitle: 'Stock Reposting',
    descKey: 'settings.section.stock-reposting.desc',
    defaultDesc: 'Batch size, item-based vs. transaction-based reposting.',
  },
  {
    key: 'delivery',
    doctype: 'Delivery Settings',
    isSingle: true,
    group: 'inventory',
    icon: Truck,
    titleKey: 'settings.section.delivery.title',
    defaultTitle: 'Delivery Settings',
    descKey: 'settings.section.delivery.desc',
    defaultDesc: 'Send notifications on dispatch, dispatch address override.',
  },
  {
    key: 'manufacturing',
    doctype: 'Manufacturing Settings',
    isSingle: true,
    group: 'inventory',
    icon: Factory,
    titleKey: 'settings.section.manufacturing.title',
    defaultTitle: 'Manufacturing Settings',
    descKey: 'settings.section.manufacturing.desc',
    defaultDesc: 'Capacity planning, default warehouses, work order overproduction.',
  },

  // Operations & Support
  {
    key: 'projects',
    doctype: 'Projects Settings',
    isSingle: true,
    group: 'operations',
    icon: Briefcase,
    titleKey: 'settings.section.projects.title',
    defaultTitle: 'Projects Settings',
    descKey: 'settings.section.projects.desc',
    defaultDesc: 'Timesheet rules, task status flow, project completion defaults.',
  },
  {
    key: 'support',
    doctype: 'Support Settings',
    isSingle: true,
    group: 'operations',
    icon: LifeBuoy,
    titleKey: 'settings.section.support.title',
    defaultTitle: 'Support Settings',
    descKey: 'settings.section.support.desc',
    defaultDesc: 'Service-level agreements, default response/resolution times.',
  },
  {
    key: 'video',
    doctype: 'Video Settings',
    isSingle: true,
    group: 'operations',
    icon: Video,
    titleKey: 'settings.section.video.title',
    defaultTitle: 'Video Settings',
    descKey: 'settings.section.video.desc',
    defaultDesc: 'YouTube API key for video tracking and analytics.',
  },
  {
    key: 'telephony',
    doctype: 'Incoming Call Settings',
    isSingle: true,
    group: 'operations',
    icon: PhoneCall,
    titleKey: 'settings.section.telephony.title',
    defaultTitle: 'Telephony',
    descKey: 'settings.section.telephony.desc',
    defaultDesc: 'Incoming call routing and agent assignment rules.',
  },

  // System (Frappe)
  {
    key: 'system',
    doctype: 'System Settings',
    isSingle: true,
    group: 'system',
    icon: Cog,
    titleKey: 'settings.section.system.title',
    defaultTitle: 'System Settings',
    descKey: 'settings.section.system.desc',
    defaultDesc: 'Timezone, locale, password policy, session timeout, file uploads.',
  },
  {
    key: 'email-domain',
    doctype: 'Email Domain',
    isSingle: false,
    group: 'system',
    icon: Mail,
    titleKey: 'settings.section.email-domain.title',
    defaultTitle: 'Email Domains',
    descKey: 'settings.section.email-domain.desc',
    defaultDesc: 'SMTP / IMAP server defaults shared across email accounts.',
  },
  {
    key: 'notification',
    doctype: 'Notification Settings',
    isSingle: true,
    group: 'system',
    icon: Bell,
    titleKey: 'settings.section.notification.title',
    defaultTitle: 'Notification Settings',
    descKey: 'settings.section.notification.desc',
    defaultDesc: 'Per-user email subscriptions for assignments, mentions, and updates.',
  },
];

export function sectionByKey(key: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((s) => s.key === key);
}

export function sectionsByGroup(group: SettingsGroupKey): SettingsSection[] {
  return SETTINGS_SECTIONS.filter((s) => s.group === group);
}
