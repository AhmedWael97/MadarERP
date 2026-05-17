import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Vehicle Accident: accident_datetime (not accident_date),
// estimated_repair_cost (not estimated_damage).
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
          { fieldname: 'accident_datetime', header: 'وقت الحادث' },
          { fieldname: 'vehicle', header: 'المركبة' },
          { fieldname: 'driver', header: 'السائق' },
          { fieldname: 'location', header: 'الموقع' },
          { fieldname: 'severity', header: 'الشدة', isBadge: true },
          { fieldname: 'estimated_repair_cost', header: 'تكلفة الإصلاح', numeric: true, ltr: true },
          { fieldname: 'insurance_claim_number', header: 'رقم المطالبة', mono: true, ltr: true },
          { fieldname: 'status', header: 'الحالة' },
        ],
        badgeMap: {
          Minor:    { label: 'بسيط',  cls: 'bg-amber-100 text-amber-700' },
          Moderate: { label: 'متوسط', cls: 'bg-orange-100 text-orange-700' },
          Major:    { label: 'بليغ',  cls: 'bg-red-100 text-red-700' },
          'Total Loss': { label: 'كلي', cls: 'bg-slate-800 text-white' },
        },
      }}
    />
  );
}
