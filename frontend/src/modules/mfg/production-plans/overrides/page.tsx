import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Production Plan',
        title: 'خطط الإنتاج',
        subtitle: 'تخطيط احتياجات الإنتاج والمواد',
        basePath: '/mfg/production-plans',
        newLabel: 'خطة جديدة',
        searchField: 'name',
        dateField: 'posting_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'posting_date', header: 'التاريخ' },
          { fieldname: 'from_date', header: 'من' },
          { fieldname: 'to_date', header: 'إلى' },
          { fieldname: 'total_planned_qty', header: 'الكمية المخططة', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:        { label: 'مسودة',    cls: 'bg-amber-100 text-amber-700' },
          Submitted:    { label: 'مرسلة',     cls: 'bg-blue-100 text-blue-700' },
          'In Process': { label: 'قيد التنفيذ', cls: 'bg-purple-100 text-purple-700' },
          Completed:    { label: 'مكتملة',    cls: 'bg-emerald-100 text-emerald-700' },
          Cancelled:    { label: 'ملغاة',     cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
