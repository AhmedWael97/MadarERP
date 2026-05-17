import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Banner',
        title: 'إدارة البانرات',
        subtitle: 'بانرات الصفحة الرئيسية للمتجر',
        basePath: '/ecommerce/banners',
        newLabel: 'بانر جديد',
        searchField: 'title',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'title', header: 'العنوان' },
          { fieldname: 'position', header: 'الموقع' },
          { fieldname: 'start_date', header: 'البداية' },
          { fieldname: 'end_date', header: 'النهاية' },
          { fieldname: 'is_active', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نشط', cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'معطل', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
