import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Banner: banner_name (autoname, not title), position is an integer
// sort order.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Banner',
        title: 'إدارة البانرات',
        subtitle: 'بانرات الصفحة الرئيسية للمتجر',
        basePath: '/ecommerce/banners',
        newLabel: 'بانر جديد',
        searchField: 'banner_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'banner_name', header: 'الاسم' },
          { fieldname: 'link_url', header: 'الرابط', mono: true, ltr: true },
          { fieldname: 'position', header: 'الترتيب', numeric: true, ltr: true },
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
