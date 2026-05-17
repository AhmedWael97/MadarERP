import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Maintenance Package: package_name, description, total_price (not
// `price`). No duration_months on the doctype.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Maintenance Package',
        title: 'باقات الصيانة',
        subtitle: 'باقات صيانة جاهزة للعملاء',
        basePath: '/workshop/setup/service-packages',
        newLabel: 'باقة جديدة',
        searchField: 'package_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'package_name', header: 'اسم الباقة' },
          { fieldname: 'description', header: 'الوصف' },
          { fieldname: 'total_price', header: 'السعر الإجمالي', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
