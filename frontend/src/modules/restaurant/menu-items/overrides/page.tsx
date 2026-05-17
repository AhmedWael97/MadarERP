import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Item',
        title: 'أصناف القائمة',
        subtitle: 'قائمة طعام المطعم',
        basePath: '/restaurant/menu-items',
        newLabel: 'صنف جديد',
        searchField: 'item_name',
        columns: [
          { fieldname: 'item_code', header: 'الكود', mono: true },
          { fieldname: 'item_name', header: 'الاسم' },
          { fieldname: 'item_group', header: 'التصنيف' },
          { fieldname: 'standard_rate', header: 'السعر', numeric: true, ltr: true },
          { fieldname: 'stock_uom', header: 'الوحدة' },
          { fieldname: 'disabled', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '0': { label: 'نشط',  cls: 'bg-emerald-100 text-emerald-700' },
          '1': { label: 'معطل', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
