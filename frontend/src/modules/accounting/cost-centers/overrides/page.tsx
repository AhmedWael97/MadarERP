import FleetEntityList from '@/modules/fleet/FleetEntityList';
// ERPNext Cost Center: cost_center_name, cost_center_number, parent_cost_center,
// company, is_group, disabled. The reference Blade view shows this as a flat
// list with نوع (group/leaf) + المستوى (parent) — render the same here.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Cost Center',
        title: 'مراكز التكلفة',
        subtitle: 'هيكل تجميع المصروفات والإيرادات حسب القسم أو المشروع',
        basePath: '/accounting/cost-centers',
        newLabel: 'مركز تكلفة جديد',
        searchField: 'cost_center_name',
        columns: [
          { fieldname: 'cost_center_number', header: 'الكود' },
          { fieldname: 'cost_center_name',   header: 'الاسم' },
          { fieldname: 'is_group',           header: 'النوع', isBadge: true },
          { fieldname: 'parent_cost_center', header: 'المستوى الأعلى' },
          { fieldname: 'company',            header: 'الشركة' },
          { fieldname: 'disabled',           header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '0': { label: 'مفصل / نشط', cls: 'bg-emerald-100 text-emerald-700' },
          '1': { label: 'مجموعة',     cls: 'bg-violet-100 text-violet-700' },
        },
      }}
    />
  );
}
