import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Branch',
        title: 'إدارة الفروع',
        subtitle: 'فروع المطعم والمواقع',
        basePath: '/restaurant/branches',
        newLabel: 'فرع جديد',
        searchField: 'branch',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'branch', header: 'اسم الفرع' },
        ],
      }}
    />
  );
}
