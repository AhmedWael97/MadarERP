import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Route',
        title: 'إدارة المسارات',
        subtitle: 'مسارات النقل والتسليم المعتمدة',
        basePath: '/fleet/routes',
        newLabel: 'مسار جديد',
        searchField: 'route_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'route_name', header: 'اسم المسار' },
          { fieldname: 'origin', header: 'البداية' },
          { fieldname: 'destination', header: 'النهاية' },
          { fieldname: 'distance_km', header: 'المسافة (كم)', numeric: true, ltr: true },
          { fieldname: 'estimated_duration', header: 'المدة المقدرة', ltr: true },
        ],
      }}
    />
  );
}
