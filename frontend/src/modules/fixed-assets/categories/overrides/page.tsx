import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Asset Category',
        title: 'تصنيفات الأصول الثابتة',
        subtitle: 'فئات وإعدادات إهلاك الأصول',
        basePath: '/fixed-assets/categories',
        newLabel: 'تصنيف جديد',
        searchField: 'asset_category_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'asset_category_name', header: 'اسم التصنيف' },
          { fieldname: 'enable_cwip_accounting', header: 'محاسبة الإنشاء', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'مفعّل', cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'معطل', cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
