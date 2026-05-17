import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Treasury actual fields (per doctype JSON):
//   treasury_name (autoname, reqd), company (Link Company, reqd),
//   branch (Link Branch), account (Link Account, reqd), currency (Link Currency),
//   is_active (Check). There is NO `balance` field — that was a wrong guess and
//   it made the API reject the list query as "Field not permitted: balance".
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
          { fieldname: 'branch', header: 'الفرع' },
          { fieldname: 'account', header: 'الحساب', mono: true },
          { fieldname: 'currency', header: 'العملة' },
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
