import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Expense Claim',
        title: 'مصروفات المشاريع',
        subtitle: 'مطالبات مصروفات على المشاريع',
        basePath: '/construction/expenses',
        newLabel: 'مطالبة جديدة',
        searchField: 'employee',
        dateField: 'posting_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'posting_date', header: 'التاريخ' },
          { fieldname: 'employee', header: 'الموظف' },
          { fieldname: 'project', header: 'المشروع' },
          { fieldname: 'total_claimed_amount', header: 'الإجمالي', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:    { label: 'مسودة', cls: 'bg-amber-100 text-amber-700' },
          Submitted: { label: 'مرسل', cls: 'bg-blue-100 text-blue-700' },
          Approved: { label: 'معتمد', cls: 'bg-emerald-100 text-emerald-700' },
          Paid:     { label: 'مدفوع', cls: 'bg-purple-100 text-purple-700' },
          Rejected: { label: 'مرفوض', cls: 'bg-red-100 text-red-700' },
          Cancelled: { label: 'ملغى', cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
