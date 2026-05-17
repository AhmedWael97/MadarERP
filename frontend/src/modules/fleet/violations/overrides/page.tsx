import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Vehicle Violation',
        title: 'سجل المخالفات',
        subtitle: 'مخالفات المرور وغرامات السائقين',
        basePath: '/fleet/violations',
        newLabel: 'مخالفة جديدة',
        searchField: 'name',
        dateField: 'violation_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'violation_date', header: 'التاريخ' },
          { fieldname: 'vehicle', header: 'المركبة' },
          { fieldname: 'driver', header: 'السائق' },
          { fieldname: 'violation_type', header: 'نوع المخالفة' },
          { fieldname: 'fine_amount', header: 'الغرامة', numeric: true, ltr: true },
          { fieldname: 'paid', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'مدفوعة', cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'غير مدفوعة', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
