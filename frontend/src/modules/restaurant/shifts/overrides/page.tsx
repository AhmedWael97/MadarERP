import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Shift Type',
        title: 'إدارة الشيفتات',
        subtitle: 'أنواع وردياات العمل',
        basePath: '/restaurant/shifts',
        newLabel: 'شيفت جديد',
        searchField: 'name',
        columns: [
          { fieldname: 'name', header: 'الاسم' },
          { fieldname: 'start_time', header: 'البداية', ltr: true },
          { fieldname: 'end_time', header: 'النهاية', ltr: true },
        ],
      }}
    />
  );
}
