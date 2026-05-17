import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar BOQ actual fields: project, date, currency, total_amount, status. No `boq_name`.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar BOQ',
        title: 'جدول الكميات (BOQ)',
        subtitle: 'تقديرات الكميات والأسعار للمشاريع',
        basePath: '/construction/boq',
        newLabel: 'BOQ جديد',
        searchField: 'project',
        dateField: 'date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'project', header: 'المشروع' },
          { fieldname: 'date', header: 'التاريخ' },
          { fieldname: 'currency', header: 'العملة' },
          { fieldname: 'total_amount', header: 'الإجمالي', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:    { label: 'مسودة', cls: 'bg-amber-100 text-amber-700' },
          Approved: { label: 'معتمد', cls: 'bg-emerald-100 text-emerald-700' },
          Revised:  { label: 'منقح',  cls: 'bg-blue-100 text-blue-700' },
        },
      }}
    />
  );
}
