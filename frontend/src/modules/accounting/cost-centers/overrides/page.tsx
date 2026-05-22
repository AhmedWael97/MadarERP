import TreeOrTableList from '@/components/erp/TreeOrTableList';
// ERPNext Cost Center: hierarchy via parent_cost_center. Defaults to the tree
// view (matches the reference Blade view) with a Table toggle for searching.
export default function Page() {
  return (
    <TreeOrTableList
      cfg={{
        doctype: 'Cost Center',
        title: 'مراكز التكلفة',
        subtitle: 'هيكل تجميع المصروفات والإيرادات حسب القسم أو المشروع',
        basePath: '/accounting/cost-centers',
        newLabel: 'مركز تكلفة جديد',
        parentField: 'parent_cost_center',
        searchField: 'cost_center_name',
        defaultView: 'tree',
        labelFields: { fields: ['cost_center_number', 'cost_center_name'], separator: ' — ' },
        columns: [
          { fieldname: 'cost_center_name',   header: 'الاسم' },
          { fieldname: 'cost_center_number', header: 'الكود' },
          { fieldname: 'is_group',           header: 'النوع', isBadge: true },
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
