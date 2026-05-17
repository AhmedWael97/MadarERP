import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Production centers = Warehouse with a "Kitchen" / "Bar" tag — reuse Warehouse listing.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Warehouse',
        title: 'مراكز الإنتاج',
        subtitle: 'مطابخ وبارات ومراكز التحضير',
        basePath: '/restaurant/production-centers',
        newLabel: 'مركز جديد',
        searchField: 'warehouse_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'warehouse_name', header: 'الاسم' },
          { fieldname: 'parent_warehouse', header: 'المخزن الأب' },
          { fieldname: 'is_group', header: 'مجموعة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'مجموعة', cls: 'bg-blue-100 text-blue-700' },
          '0': { label: 'مفرد',   cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
