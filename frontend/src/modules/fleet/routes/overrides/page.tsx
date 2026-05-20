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
          { fieldname: 'route_code', header: 'الكود', mono: true },
          { fieldname: 'route_name', header: 'اسم المسار' },
          { fieldname: 'origin', header: 'من' },
          { fieldname: 'destination', header: 'إلى' },
          { fieldname: 'distance_km', header: 'المسافة (كم)', numeric: true, ltr: true },
          { fieldname: 'standard_hours', header: 'الوقت (ساعة)', numeric: true, ltr: true },
          { fieldname: 'is_active', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نشط', cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'متوقف', cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
