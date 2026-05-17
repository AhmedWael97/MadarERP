import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'POS Profile',
        title: 'ملفات نقطة البيع',
        subtitle: 'إعدادات نقاط البيع لكل فرع',
        basePath: '/restaurant/pos',
        newLabel: 'ملف جديد',
        searchField: 'name',
        columns: [
          { fieldname: 'name', header: 'الاسم' },
          { fieldname: 'company', header: 'الشركة' },
          { fieldname: 'warehouse', header: 'المخزن' },
          { fieldname: 'currency', header: 'العملة' },
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
