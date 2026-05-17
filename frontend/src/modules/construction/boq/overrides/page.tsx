import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar BOQ',
        title: 'جدول الكميات (BOQ)',
        subtitle: 'تقديرات الكميات والأسعار للمشاريع',
        basePath: '/construction/boq',
        newLabel: 'BOQ جديد',
        searchField: 'boq_name',
        dateField: 'date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'project', header: 'المشروع' },
          { fieldname: 'boq_name', header: 'اسم البند' },
          { fieldname: 'date', header: 'التاريخ' },
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
