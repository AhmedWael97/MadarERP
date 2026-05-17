import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Project Budget: planned_amount (was total_budget), actual_amount
// (was spent), variance (was remaining). Also has `category`.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Project Budget',
        title: 'ميزانيات المشاريع',
        subtitle: 'تخطيط ومتابعة ميزانية كل مشروع',
        basePath: '/construction/budgets',
        newLabel: 'ميزانية جديدة',
        searchField: 'project',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'project', header: 'المشروع' },
          { fieldname: 'fiscal_year', header: 'السنة المالية' },
          { fieldname: 'category', header: 'البند' },
          { fieldname: 'planned_amount', header: 'المخطط', numeric: true, ltr: true },
          { fieldname: 'actual_amount', header: 'المنصرف', numeric: true, ltr: true },
          { fieldname: 'variance', header: 'الفرق', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
