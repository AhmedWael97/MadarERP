import FleetEntityList from '@/modules/fleet/FleetEntityList';
// ERPNext Account: account_name, account_number, account_type, root_type,
// is_group, balance_must_be, parent_account, company, disabled.
// Rendering as a flat searchable list — easier to scan than the tree view,
// and avoids the auto-generated TreeView placeholder that was erroring out.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Account',
        title: 'دليل الحسابات',
        subtitle: 'شجرة حسابات النظام — الأصول والخصوم والإيرادات والمصروفات',
        basePath: '/accounting/chart-of-accounts',
        newLabel: 'حساب جديد',
        searchField: 'account_name',
        columns: [
          { fieldname: 'account_number', header: 'الكود' },
          { fieldname: 'account_name',   header: 'اسم الحساب' },
          { fieldname: 'account_type',   header: 'النوع' },
          { fieldname: 'root_type',      header: 'الطبيعة', isBadge: true },
          { fieldname: 'parent_account', header: 'الحساب الأب' },
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
