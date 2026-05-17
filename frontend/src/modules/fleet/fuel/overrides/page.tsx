import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Fuel Log: date (not fuel_date), quantity (not liters).
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
        dateField: 'date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'date', header: 'التاريخ' },
          { fieldname: 'vehicle', header: 'المركبة' },
          { fieldname: 'driver', header: 'السائق' },
          { fieldname: 'fuel_type', header: 'نوع الوقود' },
          { fieldname: 'quantity', header: 'الكمية (لتر)', numeric: true, ltr: true },
          { fieldname: 'unit_price', header: 'سعر اللتر', numeric: true, ltr: true },
          { fieldname: 'odometer', header: 'العداد (كم)', numeric: true, ltr: true },
          { fieldname: 'total_cost', header: 'التكلفة', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
