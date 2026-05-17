import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Service Type',
        title: 'أنواع الخدمات',
        subtitle: 'تصنيف خدمات الورشة',
        basePath: '/workshop/setup/service-types',
        newLabel: 'نوع جديد',
        searchField: 'service_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'service_name', header: 'اسم الخدمة' },
          { fieldname: 'category', header: 'التصنيف' },
          { fieldname: 'base_price', header: 'السعر الأساسي', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
