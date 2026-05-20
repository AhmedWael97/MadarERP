import FleetEntityList from '@/modules/fleet/FleetEntityList';
// ERPNext Fiscal Year: year (Data), year_start_date, year_end_date, disabled.
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
          { fieldname: 'name',            header: 'الكود' },
          { fieldname: 'year',            header: 'الفترة' },
          { fieldname: 'year_start_date', header: 'من' },
          { fieldname: 'year_end_date',   header: 'إلى' },
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
