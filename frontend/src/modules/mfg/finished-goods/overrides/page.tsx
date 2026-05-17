import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Finished goods = Stock Entry with stock_entry_type='Manufacture'.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Stock Entry',
        title: 'المنتجات النهائية',
        subtitle: 'استلام منتجات تامة الصنع للمخزن',
        basePath: '/mfg/finished-goods',
        newLabel: 'استلام جديد',
        searchField: 'work_order',
        dateField: 'posting_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'posting_date', header: 'التاريخ' },
          { fieldname: 'work_order', header: 'أمر الإنتاج' },
          { fieldname: 'fg_completed_qty', header: 'الكمية المنتجة', numeric: true, ltr: true },
          { fieldname: 'to_warehouse', header: 'إلى مخزن' },
          { fieldname: 'total_incoming_value', header: 'القيمة', numeric: true, ltr: true },
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
