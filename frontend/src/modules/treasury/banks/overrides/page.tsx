import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Bank Account',
        title: 'الحسابات البنكية',
        subtitle: 'حسابات الشركة في البنوك المختلفة',
        basePath: '/treasury/banks',
        newLabel: 'حساب جديد',
        searchField: 'account_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'account_name', header: 'اسم الحساب' },
          { fieldname: 'bank', header: 'البنك' },
          { fieldname: 'bank_account_no', header: 'رقم الحساب', mono: true, ltr: true },
          { fieldname: 'account_type', header: 'النوع' },
          { fieldname: 'is_default', header: 'افتراضي', isBadge: true },
          { fieldname: 'disabled', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نعم',   cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'لا',    cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
