import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar EInvoice Submission: status (not submission_status), last_attempt
// (not submission_date). uuid + long_id are real fields.
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
        dateField: 'last_attempt',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'last_attempt', header: 'آخر محاولة' },
          { fieldname: 'invoice', header: 'الفاتورة' },
          { fieldname: 'uuid', header: 'UUID', mono: true, ltr: true },
          { fieldname: 'retry_count', header: 'محاولات', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
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
