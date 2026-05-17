import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Operation',
        title: 'عمليات العمالة',
        subtitle: 'تعريفات عمليات الورشة والعمالة',
        basePath: '/workshop/setup/labor-operations',
        newLabel: 'عملية جديدة',
        searchField: 'name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'description', header: 'الوصف' },
          { fieldname: 'workstation', header: 'محطة العمل' },
          { fieldname: 'hour_rate', header: 'تكلفة الساعة', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
