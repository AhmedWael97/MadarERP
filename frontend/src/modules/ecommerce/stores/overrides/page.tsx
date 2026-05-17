import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Store: store_name, currency, warehouse, is_default. No domain/language/is_active.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Store',
        title: 'إدارة المتاجر',
        subtitle: 'متاجر إلكترونية متعددة (Multi-Store)',
        basePath: '/ecommerce/stores',
        newLabel: 'متجر جديد',
        searchField: 'store_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'store_name', header: 'اسم المتجر' },
          { fieldname: 'currency', header: 'العملة' },
          { fieldname: 'warehouse', header: 'المخزن' },
          { fieldname: 'is_default', header: 'افتراضي', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نعم', cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'لا',  cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
