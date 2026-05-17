import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Logistics orders = Sales Order filtered to a logistics source/type.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Sales Order',
        title: 'طلبات الخدمات اللوجستية',
        subtitle: 'طلبات النقل والشحن',
        basePath: '/logistics/orders',
        newLabel: 'طلب جديد',
        searchField: 'customer',
        dateField: 'transaction_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'transaction_date', header: 'التاريخ' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'order_type', header: 'النوع' },
          { fieldname: 'delivery_date', header: 'تاريخ التسليم' },
          { fieldname: 'grand_total', header: 'الإجمالي', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:        { label: 'مسودة',          cls: 'bg-amber-100 text-amber-700' },
          'To Deliver': { label: 'بانتظار التسليم', cls: 'bg-blue-100 text-blue-700' },
          'To Bill':    { label: 'بانتظار الفوترة',  cls: 'bg-purple-100 text-purple-700' },
          Completed:    { label: 'مكتمل',           cls: 'bg-emerald-100 text-emerald-700' },
          Cancelled:    { label: 'ملغى',            cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
