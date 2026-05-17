import FleetEntityList from '@/modules/fleet/FleetEntityList';
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
          { fieldname: 'domain', header: 'النطاق', mono: true, ltr: true },
          { fieldname: 'currency', header: 'العملة' },
          { fieldname: 'language', header: 'اللغة' },
          { fieldname: 'is_active', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نشط',  cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'معطل', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
