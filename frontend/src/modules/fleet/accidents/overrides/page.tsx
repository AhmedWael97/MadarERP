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
        dateField: 'accident_datetime',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'accident_datetime', header: 'التاريخ' },
          { fieldname: 'vehicle', header: 'المركبة' },
          { fieldname: 'driver', header: 'السائق' },
          { fieldname: 'accident_type', header: 'النوع' },
          { fieldname: 'location', header: 'الموقع' },
          { fieldname: 'severity', header: 'مستوى الضرر', isBadge: true },
          { fieldname: 'estimated_repair_cost', header: 'التكلفة', numeric: true, ltr: true },
        ],
        badgeMap: {
          Minor:        { label: 'بسيط',     cls: 'bg-amber-100 text-amber-700' },
          Moderate:     { label: 'متوسط',    cls: 'bg-orange-100 text-orange-700' },
          Severe:       { label: 'شديد',     cls: 'bg-red-100 text-red-700' },
          'Total Loss': { label: 'خسارة كلية', cls: 'bg-slate-800 text-white' },
        },
      }}
    />
  );
}
