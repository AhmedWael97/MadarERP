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
          { fieldname: 'maintenance_type', header: 'نوع الصيانة' },
          { fieldname: 'estimated_cost', header: 'التكلفة المقدرة', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Pending: { label: 'قيد المراجعة', cls: 'bg-amber-100 text-amber-700' },
          Approved: { label: 'موافق', cls: 'bg-blue-100 text-blue-700' },
          'In Progress': { label: 'جارية', cls: 'bg-purple-100 text-purple-700' },
          Completed: { label: 'مكتملة', cls: 'bg-emerald-100 text-emerald-700' },
          Rejected: { label: 'مرفوض', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
