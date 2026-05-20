import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Construction Equipment',
        title: 'معدات الإنشاء',
        subtitle: 'سجل معدات المشاريع',
        basePath: '/construction/equipment',
        newLabel: 'معدة جديدة',
        searchField: 'name_ar',
        columns: [
          { fieldname: 'equipment_code', header: 'الكود', mono: true },
          { fieldname: 'name_ar', header: 'الاسم' },
          { fieldname: 'equipment_type', header: 'النوع' },
          { fieldname: 'project', header: 'المشروع' },
          { fieldname: 'assigned_operator', header: 'المشغل' },
          { fieldname: 'daily_cost', header: 'التكلفة اليومية', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Available:   { label: 'متاحة',     cls: 'bg-emerald-100 text-emerald-700' },
          Assigned:    { label: 'مخصصة',    cls: 'bg-blue-100 text-blue-700' },
          Maintenance: { label: 'صيانة',    cls: 'bg-amber-100 text-amber-700' },
          Retired:     { label: 'مستبعدة',  cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
