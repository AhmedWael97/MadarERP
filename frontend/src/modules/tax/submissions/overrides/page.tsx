import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar EInvoice Submission',
        title: 'الفواتير المُرسلة لمصلحة الضرائب',
        subtitle: 'تتبع حالة الفواتير الإلكترونية',
        basePath: '/tax/submissions',
        newLabel: 'إرسال جديد',
        searchField: 'invoice',
        dateField: 'submission_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'submission_date', header: 'تاريخ الإرسال' },
          { fieldname: 'invoice', header: 'الفاتورة' },
          { fieldname: 'uuid', header: 'UUID', mono: true, ltr: true },
          { fieldname: 'submission_status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Pending:    { label: 'بانتظار الإرسال', cls: 'bg-amber-100 text-amber-700' },
          Submitted:  { label: 'مُرسلة',           cls: 'bg-blue-100 text-blue-700' },
          Accepted:   { label: 'مقبولة',           cls: 'bg-emerald-100 text-emerald-700' },
          Rejected:   { label: 'مرفوضة',           cls: 'bg-red-100 text-red-700' },
          'In Review': { label: 'قيد المراجعة',    cls: 'bg-purple-100 text-purple-700' },
        },
      }}
    />
  );
}
