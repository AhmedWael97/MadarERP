import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Change Order',
        title: 'أوامر التغيير',
        subtitle: 'Variation Orders — تعديلات على نطاق المشروع',
        basePath: '/construction/variations',
        newLabel: 'أمر تغيير',
        searchField: 'project',
        dateField: 'date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'project', header: 'المشروع' },
          { fieldname: 'date', header: 'التاريخ' },
          { fieldname: 'change_type', header: 'النوع' },
          { fieldname: 'amount', header: 'القيمة', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Pending:  { label: 'قيد المراجعة', cls: 'bg-amber-100 text-amber-700' },
          Approved: { label: 'معتمد',         cls: 'bg-emerald-100 text-emerald-700' },
          Rejected: { label: 'مرفوض',         cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
