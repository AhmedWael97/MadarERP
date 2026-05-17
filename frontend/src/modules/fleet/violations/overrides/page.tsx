import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Vehicle Violation: date (not violation_date), status (not paid bool).
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
        dateField: 'date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'date', header: 'التاريخ' },
          { fieldname: 'vehicle', header: 'المركبة' },
          { fieldname: 'driver', header: 'السائق' },
          { fieldname: 'violation_type', header: 'نوع المخالفة' },
          { fieldname: 'location', header: 'الموقع' },
          { fieldname: 'fine_amount', header: 'الغرامة', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Paid:    { label: 'مدفوعة',    cls: 'bg-emerald-100 text-emerald-700' },
          Unpaid:  { label: 'غير مدفوعة', cls: 'bg-red-100 text-red-700' },
          Disputed: { label: 'متنازع عليها', cls: 'bg-amber-100 text-amber-700' },
        },
      }}
    />
  );
}
