import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Scrap = Stock Entry tracked for waste/rejected production output.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Stock Entry',
        title: 'الهالك',
        subtitle: 'حركات هالك ومرتجعات التصنيع',
        basePath: '/mfg/scrap',
        newLabel: 'سجل هالك',
        searchField: 'work_order',
        dateField: 'posting_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'posting_date', header: 'التاريخ' },
          { fieldname: 'work_order', header: 'أمر الإنتاج' },
          { fieldname: 'stock_entry_type', header: 'النوع' },
          { fieldname: 'total_outgoing_value', header: 'القيمة', numeric: true, ltr: true },
          { fieldname: 'docstatus', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '0': { label: 'مسودة', cls: 'bg-amber-100 text-amber-700' },
          '1': { label: 'مرحّل', cls: 'bg-emerald-100 text-emerald-700' },
          '2': { label: 'ملغى', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
