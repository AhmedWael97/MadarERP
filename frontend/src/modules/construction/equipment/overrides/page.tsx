import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Asset',
        title: 'المعدات',
        subtitle: 'معدات الإنشاءات والمشاريع',
        basePath: '/construction/equipment',
        newLabel: 'معدة جديدة',
        searchField: 'asset_name',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'asset_name', header: 'اسم المعدة' },
          { fieldname: 'item_code', header: 'الصنف' },
          { fieldname: 'asset_category', header: 'التصنيف' },
          { fieldname: 'gross_purchase_amount', header: 'تكلفة الشراء', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Submitted:    { label: 'متاحة',     cls: 'bg-emerald-100 text-emerald-700' },
          'In Maintenance': { label: 'صيانة',  cls: 'bg-amber-100 text-amber-700' },
          'Out of Order': { label: 'معطلة',     cls: 'bg-red-100 text-red-700' },
          Scrapped:     { label: 'مستبعدة',    cls: 'bg-slate-100 text-slate-700' },
          Sold:         { label: 'مباعة',       cls: 'bg-purple-100 text-purple-700' },
        },
      }}
    />
  );
}
