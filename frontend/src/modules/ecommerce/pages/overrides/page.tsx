import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar CMS Page: page_slug (autoname, not `slug`). Title + content +
// is_published + published_date are real fields.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar CMS Page',
        title: 'صفحات المحتوى (CMS)',
        subtitle: 'صفحات ثابتة للمتجر (شروط، خصوصية، ...)',
        basePath: '/ecommerce/pages',
        newLabel: 'صفحة جديدة',
        searchField: 'title',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'page_slug', header: 'الرابط', mono: true, ltr: true },
          { fieldname: 'title', header: 'العنوان' },
          { fieldname: 'published_date', header: 'تاريخ النشر' },
          { fieldname: 'is_published', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'منشورة', cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'مسودة',  cls: 'bg-amber-100 text-amber-700' },
        },
      }}
    />
  );
}
