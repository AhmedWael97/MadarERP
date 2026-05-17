import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Vehicle Accident',
        title: 'سجل الحوادث',
        subtitle: 'تسجيل حوادث المركبات والتأمين',
        basePath: '/fleet/accidents',
        newLabel: 'حادث جديد',
        searchField: 'name',
        dateField: 'accident_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'accident_date', header: 'التاريخ' },
          { fieldname: 'vehicle', header: 'المركبة' },
          { fieldname: 'driver', header: 'السائق' },
          { fieldname: 'severity', header: 'الشدة', isBadge: true },
          { fieldname: 'estimated_damage', header: 'الأضرار المقدرة', numeric: true, ltr: true },
        ],
        badgeMap: {
          Minor: { label: 'بسيط', cls: 'bg-amber-100 text-amber-700' },
          Moderate: { label: 'متوسط', cls: 'bg-orange-100 text-orange-700' },
          Major: { label: 'بليغ', cls: 'bg-red-100 text-red-700' },
          'Total Loss': { label: 'كلي', cls: 'bg-slate-800 text-white' },
        },
      }}
    />
  );
}
