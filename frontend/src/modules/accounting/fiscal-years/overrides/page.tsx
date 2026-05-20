import FleetEntityList from '@/modules/fleet/FleetEntityList';
// ERPNext Fiscal Year: year is also the name, so we drop the duplicate column.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Fiscal Year',
        title: 'السنوات المالية',
        subtitle: 'تعريف الفترات المحاسبية وتاريخ بدايتها ونهايتها',
        basePath: '/accounting/fiscal-years',
        newLabel: 'سنة مالية جديدة',
        searchField: 'year',
        columns: [
          { fieldname: 'year',            header: 'السنة المالية' },
          { fieldname: 'year_start_date', header: 'تاريخ البداية' },
          { fieldname: 'year_end_date',   header: 'تاريخ النهاية' },
          { fieldname: 'disabled',        header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '0': { label: 'نشطة',  cls: 'bg-emerald-100 text-emerald-700' },
          '1': { label: 'مغلقة', cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
