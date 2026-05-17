import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Material issues = Stock Entry with stock_entry_type='Material Issue' or
// 'Material Consumption for Manufacture'. The list shows all such entries.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Stock Entry',
        title: 'صرف المواد',
        subtitle: 'صرف مواد للتصنيع',
        basePath: '/mfg/material-issues',
        newLabel: 'صرف جديد',
        searchField: 'work_order',
        dateField: 'posting_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'posting_date', header: 'التاريخ' },
          { fieldname: 'stock_entry_type', header: 'النوع' },
          { fieldname: 'work_order', header: 'أمر الإنتاج' },
          { fieldname: 'from_warehouse', header: 'من مخزن' },
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
