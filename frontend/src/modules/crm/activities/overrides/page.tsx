import FleetEntityList from '@/modules/fleet/FleetEntityList';
// CRM activities = ToDo doctype (tasks/calls/meetings linked to a Lead/Opportunity/Customer).
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'ToDo',
        title: 'المتابعات',
        subtitle: 'الأنشطة والمكالمات والاجتماعات',
        basePath: '/crm/activities',
        newLabel: 'متابعة جديدة',
        searchField: 'description',
        dateField: 'date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'date', header: 'التاريخ' },
          { fieldname: 'allocated_to', header: 'المسؤول' },
          { fieldname: 'description', header: 'الوصف' },
          { fieldname: 'reference_type', header: 'نوع المرجع' },
          { fieldname: 'reference_name', header: 'المرجع' },
          { fieldname: 'priority', header: 'الأولوية', isBadge: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Open:    { label: 'مفتوحة', cls: 'bg-amber-100 text-amber-700' },
          Closed:  { label: 'مغلقة',  cls: 'bg-emerald-100 text-emerald-700' },
          Cancelled: { label: 'ملغاة', cls: 'bg-slate-100 text-slate-700' },
          High:    { label: 'عالية',  cls: 'bg-red-100 text-red-700' },
          Medium:  { label: 'متوسطة', cls: 'bg-amber-100 text-amber-700' },
          Low:     { label: 'منخفضة', cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
