import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Sales Taxes and Charges Template',
        title: 'إعدادات الضرائب',
        subtitle: 'قوالب الضرائب والرسوم المطبقة',
        basePath: '/tax/setup',
        newLabel: 'قالب جديد',
        searchField: 'title',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'title', header: 'العنوان' },
          { fieldname: 'company', header: 'الشركة' },
          { fieldname: 'is_default', header: 'افتراضي', isBadge: true },
          { fieldname: 'disabled', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نعم',     cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'لا',       cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
