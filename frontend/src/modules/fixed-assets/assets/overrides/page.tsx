import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Asset',
        title: 'الأصول الثابتة',
        subtitle: 'سجل الأصول الثابتة للشركة',
        basePath: '/fixed-assets/assets',
        newLabel: 'أصل جديد',
        searchField: 'asset_name',
        dateField: 'purchase_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'asset_name', header: 'اسم الأصل' },
          { fieldname: 'asset_category', header: 'التصنيف' },
          { fieldname: 'purchase_date', header: 'تاريخ الشراء' },
          { fieldname: 'gross_purchase_amount', header: 'تكلفة الشراء', numeric: true, ltr: true },
          { fieldname: 'value_after_depreciation', header: 'القيمة الحالية', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:           { label: 'مسودة',      cls: 'bg-amber-100 text-amber-700' },
          Submitted:       { label: 'متاح',        cls: 'bg-emerald-100 text-emerald-700' },
          'Partially Depreciated': { label: 'إهلاك جزئي', cls: 'bg-blue-100 text-blue-700' },
          'Fully Depreciated':   { label: 'إهلاك كلي',  cls: 'bg-purple-100 text-purple-700' },
          Sold:            { label: 'مباع',         cls: 'bg-cyan-100 text-cyan-700' },
          Scrapped:        { label: 'مستبعد',       cls: 'bg-red-100 text-red-700' },
          'In Maintenance': { label: 'صيانة',       cls: 'bg-amber-100 text-amber-700' },
        },
      }}
    />
  );
}
