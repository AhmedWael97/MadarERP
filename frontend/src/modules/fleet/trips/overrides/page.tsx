import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Trip actual fields: start_date, end_date, route, driver, purpose,
// start_odometer, end_odometer, distance_km, status. No origin/destination/
// trip_date — those were wrong guesses.
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
        dateField: 'start_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'start_date', header: 'البداية' },
          { fieldname: 'end_date', header: 'النهاية' },
          { fieldname: 'route', header: 'المسار' },
          { fieldname: 'driver', header: 'السائق' },
          { fieldname: 'purpose', header: 'الغرض' },
          { fieldname: 'distance_km', header: 'المسافة (كم)', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Planned: { label: 'مخططة', cls: 'bg-amber-100 text-amber-700' },
          'In Progress': { label: 'جارية', cls: 'bg-blue-100 text-blue-700' },
          Completed: { label: 'مكتملة', cls: 'bg-emerald-100 text-emerald-700' },
          Cancelled: { label: 'ملغاة', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
