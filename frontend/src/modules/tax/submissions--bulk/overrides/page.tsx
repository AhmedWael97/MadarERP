import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar EInvoice Bulk Batch',
        title: 'إرسال مجمع للفواتير',
        subtitle: 'دفعات إرسال مجمّعة لمصلحة الضرائب',
        basePath: '/tax/submissions/bulk',
        newLabel: 'دفعة جديدة',
        searchField: 'name',
        dateField: 'batch_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'batch_date', header: 'التاريخ' },
          { fieldname: 'total_invoices', header: 'عدد الفواتير', numeric: true, ltr: true },
          { fieldname: 'accepted_count', header: 'مقبولة', numeric: true, ltr: true },
          { fieldname: 'rejected_count', header: 'مرفوضة', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:      { label: 'مسودة',      cls: 'bg-amber-100 text-amber-700' },
          Processing: { label: 'جاري التنفيذ', cls: 'bg-blue-100 text-blue-700' },
          Completed:  { label: 'مكتمل',       cls: 'bg-emerald-100 text-emerald-700' },
          Failed:     { label: 'فشل',          cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
