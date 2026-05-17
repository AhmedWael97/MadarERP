import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'BOM',
        title: 'قوائم المواد (BOM)',
        subtitle: 'تعريف مكونات الأصناف وتكاليفها',
        basePath: '/mfg/bom',
        newLabel: 'BOM جديد',
        searchField: 'item',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'item', header: 'الصنف' },
          { fieldname: 'item_name', header: 'اسم الصنف' },
          { fieldname: 'quantity', header: 'الكمية', numeric: true, ltr: true },
          { fieldname: 'total_cost', header: 'التكلفة الإجمالية', numeric: true, ltr: true },
          { fieldname: 'is_default', header: 'افتراضي', isBadge: true },
          { fieldname: 'is_active', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نعم', cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'لا',  cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
