import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Currency Rate Period — historical rates with effective_from /
// effective_to windows. Transactions look up the row whose window contains
// their posting_date via madaar_core.currency_rate.resolve_rate.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Currency Rate Period',
        title: 'أسعار صرف العملات',
        subtitle: 'أسعار الصرف المتعددة بحسب الفترة الزمنية — المعاملات تستخدم السعر الساري في تاريخها',
        basePath: '/treasury/exchange-rates',
        newLabel: 'سعر جديد',
        searchField: 'from_currency',
        dateField: 'effective_from',
        columns: [
          { fieldname: 'name',           header: 'الكود' },
          { fieldname: 'from_currency',  header: 'من عملة' },
          { fieldname: 'to_currency',    header: 'إلى عملة' },
          { fieldname: 'rate',           header: 'السعر', numeric: true, ltr: true },
          { fieldname: 'effective_from', header: 'يبدأ من' },
          { fieldname: 'effective_to',   header: 'حتى (أو مفتوح)' },
        ],
      }}
    />
  );
}
