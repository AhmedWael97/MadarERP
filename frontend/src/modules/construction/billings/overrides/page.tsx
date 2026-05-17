import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Progress Bill: period_start/period_end (not date/period),
// gross_amount + retention_amount + net_amount (not total_amount).
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
        dateField: 'period_end',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'project', header: 'المشروع' },
          { fieldname: 'boq', header: 'BOQ' },
          { fieldname: 'period_start', header: 'بداية الفترة' },
          { fieldname: 'period_end', header: 'نهاية الفترة' },
          { fieldname: 'completion_pct', header: 'نسبة الإنجاز %', numeric: true, ltr: true },
          { fieldname: 'gross_amount', header: 'القيمة الإجمالية', numeric: true, ltr: true },
          { fieldname: 'retention_amount', header: 'الاستقطاع', numeric: true, ltr: true },
          { fieldname: 'net_amount', header: 'الصافي', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
