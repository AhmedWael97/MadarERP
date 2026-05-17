import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Progress Bill',
        title: 'المستخلصات',
        subtitle: 'مستخلصات الأعمال المنفذة (Progress Bills)',
        basePath: '/construction/billings',
        newLabel: 'مستخلص جديد',
        searchField: 'project',
        dateField: 'date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'project', header: 'المشروع' },
          { fieldname: 'date', header: 'التاريخ' },
          { fieldname: 'period', header: 'الفترة' },
          { fieldname: 'total_amount', header: 'الإجمالي', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:    { label: 'مسودة',   cls: 'bg-amber-100 text-amber-700' },
          Submitted: { label: 'مرسل',   cls: 'bg-blue-100 text-blue-700' },
          Approved: { label: 'معتمد',   cls: 'bg-emerald-100 text-emerald-700' },
          Paid:     { label: 'مدفوع',   cls: 'bg-purple-100 text-purple-700' },
          Rejected: { label: 'مرفوض',   cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
