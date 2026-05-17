import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'BOM',
        title: 'الوصفات والتكلفة',
        subtitle: 'وصفات الأصناف وحساب التكلفة',
        basePath: '/restaurant/recipes',
        newLabel: 'وصفة جديدة',
        searchField: 'item',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'item', header: 'الصنف' },
          { fieldname: 'item_name', header: 'اسم الصنف' },
          { fieldname: 'total_cost', header: 'التكلفة الإجمالية', numeric: true, ltr: true },
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
