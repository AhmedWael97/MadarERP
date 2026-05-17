import FleetEntityList from '@/modules/fleet/FleetEntityList';
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
          { fieldname: 'duration_months', header: 'المدة (أشهر)', numeric: true, ltr: true },
          { fieldname: 'price', header: 'السعر', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
