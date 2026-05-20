import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Trip',
        title: 'إدارة الرحلات',
        subtitle: 'تتبع رحلات الأسطول والتسليم',
        basePath: '/fleet/trips',
        newLabel: 'رحلة جديدة',
        searchField: 'name',
        dateField: 'trip_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'trip_date', header: 'التاريخ' },
          { fieldname: 'vehicle', header: 'المركبة' },
          { fieldname: 'driver', header: 'السائق' },
          { fieldname: 'route', header: 'المسار' },
          { fieldname: 'trip_type', header: 'النوع' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'distance_km', header: 'المسافة (كم)', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Planned:       { label: 'مخططة',   cls: 'bg-amber-100 text-amber-700' },
          'In Progress': { label: 'جارية',   cls: 'bg-blue-100 text-blue-700' },
          Completed:     { label: 'مكتملة',  cls: 'bg-emerald-100 text-emerald-700' },
          Cancelled:     { label: 'ملغاة',   cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
