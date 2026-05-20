import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Vehicle Maintenance Request',
        title: 'طلبات الصيانة',
        subtitle: 'صيانة وقائية وإصلاحات للمركبات',
        basePath: '/fleet/maintenance/requests',
        newLabel: 'طلب صيانة',
        searchField: 'name',
        dateField: 'request_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'request_date', header: 'التاريخ' },
          { fieldname: 'vehicle', header: 'المركبة' },
          { fieldname: 'issue', header: 'المشكلة' },
          { fieldname: 'priority', header: 'الأولوية', isBadge: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Low:      { label: 'منخفضة',    cls: 'bg-slate-100 text-slate-700' },
          Medium:   { label: 'متوسطة',   cls: 'bg-amber-100 text-amber-700' },
          High:     { label: 'عالية',    cls: 'bg-orange-100 text-orange-700' },
          Critical: { label: 'حرجة',     cls: 'bg-red-100 text-red-700' },
          Open:        { label: 'مفتوح',      cls: 'bg-amber-100 text-amber-700' },
          'In Progress': { label: 'جارية',    cls: 'bg-blue-100 text-blue-700' },
          Completed:   { label: 'مكتملة',    cls: 'bg-emerald-100 text-emerald-700' },
          Cancelled:   { label: 'ملغى',      cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
