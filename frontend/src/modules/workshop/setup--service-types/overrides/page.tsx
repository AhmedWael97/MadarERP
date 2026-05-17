import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Service Type: service_type (autoname, not service_name), description,
// standard_duration_minutes, standard_price (not base_price). No category.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Service Type',
        title: 'أنواع الخدمات',
        subtitle: 'تصنيف خدمات الورشة',
        basePath: '/workshop/setup/service-types',
        newLabel: 'نوع جديد',
        searchField: 'service_type',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'service_type', header: 'الخدمة' },
          { fieldname: 'description', header: 'الوصف' },
          { fieldname: 'standard_duration_minutes', header: 'المدة (د)', numeric: true, ltr: true },
          { fieldname: 'standard_price', header: 'السعر القياسي', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
