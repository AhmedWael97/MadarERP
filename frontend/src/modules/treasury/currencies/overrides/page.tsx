import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Standard Frappe Currency doctype. Listed under Treasury since rates power
// the multi-currency flow used by treasuries / bank accounts. Disabled flag
// flips visibility for the user without removing the row.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Currency',
        title: 'العملات',
        subtitle: 'إدارة العملات المعتمدة في النظام والرموز',
        basePath: '/treasury/currencies',
        newLabel: 'عملة جديدة',
        searchField: 'currency_name',
        columns: [
          { fieldname: 'name',          header: 'الكود' },
          { fieldname: 'currency_name', header: 'الاسم' },
          { fieldname: 'symbol',        header: 'الرمز' },
          { fieldname: 'fraction',      header: 'الكسر' },
          { fieldname: 'smallest_currency_fraction_value', header: 'أصغر كسر', numeric: true, ltr: true },
          { fieldname: 'enabled',       header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'مفعّلة', cls: 'bg-emerald-100 text-emerald-700' },
          '0': { label: 'معطّلة', cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
