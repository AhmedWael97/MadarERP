import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Hall',
        title: 'الصالات والطاولات',
        subtitle: 'صالات المطعم وتقسيم الطاولات',
        basePath: '/restaurant/halls',
        newLabel: 'صالة جديدة',
        searchField: 'hall_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'hall_name', header: 'اسم الصالة' },
          { fieldname: 'branch', header: 'الفرع' },
          { fieldname: 'capacity', header: 'السعة', numeric: true, ltr: true },
          { fieldname: 'tables_count', header: 'عدد الطاولات', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
