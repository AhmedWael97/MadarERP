import FleetEntityList from '@/modules/fleet/FleetEntityList';
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
          { fieldname: 'total_budget', header: 'الإجمالي', numeric: true, ltr: true },
          { fieldname: 'spent', header: 'المنصرف', numeric: true, ltr: true },
          { fieldname: 'remaining', header: 'المتبقي', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
