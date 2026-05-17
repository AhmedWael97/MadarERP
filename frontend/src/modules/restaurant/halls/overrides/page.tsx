import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Hall: hall_name, branch, capacity, is_active. No tables_count.
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
          { fieldname: 'is_active', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نشطة', cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'معطلة', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
