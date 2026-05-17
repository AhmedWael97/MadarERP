import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Ecommerce orders = Sales Order tagged from the storefront. Same shape as
// logistics orders — could share a config, but keeping it explicit so each
// module shows the right Arabic copy in the page header.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Sales Order',
        title: 'طلبات المتجر الإلكتروني',
        subtitle: 'طلبات العملاء من الموقع والتطبيق',
        basePath: '/ecommerce/orders',
        newLabel: 'طلب جديد',
        searchField: 'customer',
        dateField: 'transaction_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'transaction_date', header: 'التاريخ' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'delivery_date', header: 'موعد التسليم' },
          { fieldname: 'grand_total', header: 'الإجمالي', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:        { label: 'في السلة',         cls: 'bg-amber-100 text-amber-700' },
          'To Deliver': { label: 'قيد التوصيل',      cls: 'bg-blue-100 text-blue-700' },
          'To Bill':    { label: 'بانتظار الفوترة',   cls: 'bg-purple-100 text-purple-700' },
          Completed:    { label: 'مكتمل',             cls: 'bg-emerald-100 text-emerald-700' },
          Cancelled:    { label: 'ملغى',              cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
