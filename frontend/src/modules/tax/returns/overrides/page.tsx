import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar VAT Return real fields: period_start/period_end, input_vat,
// output_vat, net_payable, filed_date, status.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar VAT Return',
        title: 'الإقرارات الضريبية',
        subtitle: 'إقرارات ضريبة القيمة المضافة الدورية',
        basePath: '/tax/returns',
        newLabel: 'إقرار جديد',
        searchField: 'name',
        dateField: 'period_start',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'period_start', header: 'من' },
          { fieldname: 'period_end', header: 'إلى' },
          { fieldname: 'output_vat', header: 'الضريبة المستحقة', numeric: true, ltr: true },
          { fieldname: 'input_vat', header: 'الضريبة المخصومة', numeric: true, ltr: true },
          { fieldname: 'net_payable', header: 'الصافي', numeric: true, ltr: true },
          { fieldname: 'filed_date', header: 'تاريخ التقديم' },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:     { label: 'مسودة',  cls: 'bg-amber-100 text-amber-700' },
          Submitted: { label: 'مُقدّم', cls: 'bg-blue-100 text-blue-700' },
          Accepted:  { label: 'مقبول', cls: 'bg-emerald-100 text-emerald-700' },
          Rejected:  { label: 'مرفوض', cls: 'bg-red-100 text-red-700' },
          Paid:      { label: 'مدفوع', cls: 'bg-purple-100 text-purple-700' },
        },
      }}
    />
  );
}
