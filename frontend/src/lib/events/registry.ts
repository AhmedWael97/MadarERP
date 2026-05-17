import {
  Inbox,
  CalendarRange,
  FileSignature,
  Megaphone,
  Sparkles,
  Bell,
  ClipboardCheck,
  Archive,
  Boxes,
  Banknote,
  MapPin,
  Tags,
  type LucideIcon,
} from 'lucide-react';

/**
 * The Culture Wheel — twelve canonical stages plus master data (venues / types).
 * Each section has one Frappe DocType. The Events module pages render against
 * these via the generic FormShell + DataTable components.
 */
export type EventsGroupKey = 'pipeline' | 'execution' | 'masters';

export interface EventsSection {
  /** URL slug: `/events/<key>`. */
  key: string;
  doctype: string;
  group: EventsGroupKey;
  icon: LucideIcon;
  titleKey: string;
  defaultTitle: string;
  descKey: string;
  defaultDesc: string;
}

export const EVENTS_GROUPS: Array<{ key: EventsGroupKey; titleKey: string; defaultTitle: string }> = [
  { key: 'pipeline',  titleKey: 'events.group.pipeline',  defaultTitle: 'Intake & Contracting' },
  { key: 'execution', titleKey: 'events.group.execution', defaultTitle: 'Execution & Closure' },
  { key: 'masters',   titleKey: 'events.group.masters',   defaultTitle: 'Master Data' },
];

export const EVENTS_SECTIONS: EventsSection[] = [
  // Pipeline — stages 1-8
  {
    key: 'requests',
    doctype: 'Madaar Event Request',
    group: 'pipeline',
    icon: Inbox,
    titleKey: 'events.section.requests.title',
    defaultTitle: 'Event Requests',
    descKey: 'events.section.requests.desc',
    defaultDesc: 'Intake — internal initiatives and external artist requests.',
  },
  {
    key: 'schedules',
    doctype: 'Madaar Event Schedule',
    group: 'pipeline',
    icon: CalendarRange,
    titleKey: 'events.section.schedules.title',
    defaultTitle: 'Schedules',
    descKey: 'events.section.schedules.desc',
    defaultDesc: 'Venue bookings — conflict-checked tentative + confirmed slots.',
  },
  {
    key: 'resource-plans',
    doctype: 'Madaar Event Resource Plan',
    group: 'pipeline',
    icon: Boxes,
    titleKey: 'events.section.resource-plans.title',
    defaultTitle: 'Resource Plans',
    descKey: 'events.section.resource-plans.desc',
    defaultDesc: 'HR, technical, and material requirements per event.',
  },
  {
    key: 'contracts',
    doctype: 'Madaar Event Contract',
    group: 'pipeline',
    icon: FileSignature,
    titleKey: 'events.section.contracts.title',
    defaultTitle: 'Contracts',
    descKey: 'events.section.contracts.desc',
    defaultDesc: 'HR + Legal gates, signature workflow, terms & conditions.',
  },
  {
    key: 'finance-cases',
    doctype: 'Madaar Event Finance Case',
    group: 'pipeline',
    icon: Banknote,
    titleKey: 'events.section.finance-cases.title',
    defaultTitle: 'Finance Cases',
    descKey: 'events.section.finance-cases.desc',
    defaultDesc: 'Budgets, expense tracking, finance clearance per event.',
  },
  {
    key: 'publications',
    doctype: 'Madaar Event Publication',
    group: 'pipeline',
    icon: Sparkles,
    titleKey: 'events.section.publications.title',
    defaultTitle: 'Publications',
    descKey: 'events.section.publications.desc',
    defaultDesc: 'Website pages — gated on a signed contract.',
  },
  {
    key: 'marketing',
    doctype: 'Madaar Event Marketing Campaign',
    group: 'pipeline',
    icon: Megaphone,
    titleKey: 'events.section.marketing.title',
    defaultTitle: 'Marketing Campaigns',
    descKey: 'events.section.marketing.desc',
    defaultDesc: 'Channels, assets, timeline — activated after publication.',
  },

  // Execution — stages 9-12
  {
    key: 'operations',
    doctype: 'Madaar Event Ops Notification',
    group: 'execution',
    icon: Bell,
    titleKey: 'events.section.operations.title',
    defaultTitle: 'Operations Notifications',
    descKey: 'events.section.operations.desc',
    defaultDesc: 'Hand-off to security, ushers, technical, cleaning.',
  },
  {
    key: 'day-checklist',
    doctype: 'Madaar Event Day Checklist',
    group: 'execution',
    icon: ClipboardCheck,
    titleKey: 'events.section.day-checklist.title',
    defaultTitle: 'Event-Day Checklists',
    descKey: 'events.section.day-checklist.desc',
    defaultDesc: 'Six core gates that must be ticked before "Smooth".',
  },
  {
    key: 'closures',
    doctype: 'Madaar Event Closure',
    group: 'execution',
    icon: Archive,
    titleKey: 'events.section.closures.title',
    defaultTitle: 'Closures',
    descKey: 'events.section.closures.desc',
    defaultDesc: 'Post-event deliverables, financial closure, archival.',
  },

  // Master data
  {
    key: 'venues',
    doctype: 'Madaar Event Venue',
    group: 'masters',
    icon: MapPin,
    titleKey: 'events.section.venues.title',
    defaultTitle: 'Venues',
    descKey: 'events.section.venues.desc',
    defaultDesc: 'Halls, studios, outdoor spaces — capacity and status.',
  },
  {
    key: 'types',
    doctype: 'Madaar Event Type',
    group: 'masters',
    icon: Tags,
    titleKey: 'events.section.types.title',
    defaultTitle: 'Event Types',
    descKey: 'events.section.types.desc',
    defaultDesc: 'Performance, talk, workshop, festival … with rehearsal/ticket flags.',
  },
];

export function eventsSectionByKey(key: string): EventsSection | undefined {
  return EVENTS_SECTIONS.find((s) => s.key === key);
}
