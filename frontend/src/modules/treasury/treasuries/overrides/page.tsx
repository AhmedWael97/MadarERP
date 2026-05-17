import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Treasury',
        title: 'الخزائن',
        subtitle: 'خزائن النقدية والصناديق',
        basePath: '/treasury/treasuries',
        newLabel: 'خزينة جديدة',
        searchField: 'treasury_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'treasury_name', header: 'الاسم' },
          { fieldname: 'company', header: 'الشركة' },
          { fieldname: 'currency', header: 'العملة' },
          { fieldname: 'balance', header: 'الرصيد', numeric: true, ltr: true },
          { fieldname: 'is_active', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نشطة', cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'معطلة', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
