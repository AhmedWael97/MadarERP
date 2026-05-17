import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Fuel Log',
        title: 'سجل الوقود',
        subtitle: 'حركات تعبئة الوقود واستهلاك المركبات',
        basePath: '/fleet/fuel',
        newLabel: 'تعبئة جديدة',
        searchField: 'name',
        dateField: 'fuel_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'fuel_date', header: 'التاريخ' },
          { fieldname: 'vehicle', header: 'المركبة' },
          { fieldname: 'driver', header: 'السائق' },
          { fieldname: 'liters', header: 'اللترات', numeric: true, ltr: true },
          { fieldname: 'odometer', header: 'العداد (كم)', numeric: true, ltr: true },
          { fieldname: 'total_cost', header: 'التكلفة', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
