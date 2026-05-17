import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Change Order: amount_change (not amount), description, no change_type.
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
          { fieldname: 'boq', header: 'BOQ' },
          { fieldname: 'date', header: 'التاريخ' },
          { fieldname: 'description', header: 'الوصف' },
          { fieldname: 'amount_change', header: 'فرق القيمة', numeric: true, ltr: true },
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
