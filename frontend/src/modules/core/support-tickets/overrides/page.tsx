import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Issue',
        title: 'الدعم الفني',
        subtitle: 'تذاكر دعم العملاء والاستفسارات',
        basePath: '/support-tickets',
        newLabel: 'تذكرة جديدة',
        searchField: 'subject',
        dateField: 'opening_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'opening_date', header: 'تاريخ الفتح' },
          { fieldname: 'subject', header: 'الموضوع' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'raised_by', header: 'بواسطة' },
          { fieldname: 'priority', header: 'الأولوية', isBadge: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Open:        { label: 'مفتوحة',     cls: 'bg-amber-100 text-amber-700' },
          Replied:     { label: 'تم الرد',     cls: 'bg-blue-100 text-blue-700' },
          'On Hold':   { label: 'معلقة',      cls: 'bg-purple-100 text-purple-700' },
          Resolved:    { label: 'تم الحل',     cls: 'bg-emerald-100 text-emerald-700' },
          Closed:      { label: 'مغلقة',       cls: 'bg-slate-100 text-slate-700' },
          Low:         { label: 'منخفضة',     cls: 'bg-slate-100 text-slate-700' },
          Medium:      { label: 'متوسطة',     cls: 'bg-amber-100 text-amber-700' },
          High:        { label: 'عالية',       cls: 'bg-orange-100 text-orange-700' },
          Urgent:      { label: 'عاجلة',       cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
