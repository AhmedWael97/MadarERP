import FleetEntityList from '@/modules/fleet/FleetEntityList';
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
        dateField: 'period_from',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'period_from', header: 'من' },
          { fieldname: 'period_to', header: 'إلى' },
          { fieldname: 'output_tax', header: 'الضريبة المستحقة', numeric: true, ltr: true },
          { fieldname: 'input_tax', header: 'الضريبة المخصومة', numeric: true, ltr: true },
          { fieldname: 'net_tax', header: 'الصافي', numeric: true, ltr: true },
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
