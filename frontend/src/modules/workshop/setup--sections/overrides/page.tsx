import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Department',
        title: 'أقسام الورشة',
        subtitle: 'تقسيم الورشة لأقسام إدارية',
        basePath: '/workshop/setup/sections',
        newLabel: 'قسم جديد',
        searchField: 'department_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'department_name', header: 'الاسم' },
          { fieldname: 'parent_department', header: 'القسم الأب' },
          { fieldname: 'is_group', header: 'مجموعة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نعم', cls: 'bg-blue-100 text-blue-700' },
          '0': { label: 'لا',  cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
