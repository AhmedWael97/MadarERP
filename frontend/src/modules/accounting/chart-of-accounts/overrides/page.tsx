import TreeOrTableList from '@/components/erp/TreeOrTableList';
// ERPNext Account: account_name, account_number, account_type, root_type,
// is_group, parent_account, company, disabled. The hierarchy is by
// parent_account → child accounts. Defaults to the tree view (matches the
// reference Blade view) with a toggle to a flat searchable table.
export default function Page() {
  return (
    <TreeOrTableList
      cfg={{
        doctype: 'Account',
        title: 'دليل الحسابات',
        subtitle: 'شجرة حسابات النظام — الأصول والخصوم والإيرادات والمصروفات',
        basePath: '/accounting/chart-of-accounts',
        newLabel: 'حساب جديد',
        parentField: 'parent_account',
        searchField: 'account_name',
        defaultView: 'tree',
        labelFields: { fields: ['account_number', 'account_name'], separator: ' — ' },
        columns: [
          { fieldname: 'account_name',   header: 'اسم الحساب' },
          { fieldname: 'account_number', header: 'الكود' },
          { fieldname: 'account_type',   header: 'النوع' },
          { fieldname: 'root_type',      header: 'التصنيف', isBadge: true },
          { fieldname: 'is_group',       header: 'مجموعة', isBadge: true },
          { fieldname: 'disabled',       header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Asset:     { label: 'أصل',       cls: 'bg-violet-100 text-violet-700' },
          Liability: { label: 'خصم',       cls: 'bg-rose-100 text-rose-700' },
          Equity:    { label: 'حقوق ملكية', cls: 'bg-amber-100 text-amber-700' },
          Income:    { label: 'إيراد',     cls: 'bg-emerald-100 text-emerald-700' },
          Expense:   { label: 'مصروف',     cls: 'bg-orange-100 text-orange-700' },
          '0':       { label: '—',         cls: 'bg-slate-100 text-slate-500' },
          '1':       { label: 'نعم',       cls: 'bg-cyan-100 text-cyan-700' },
        },
      }}
    />
  );
}
