// Logistics deliveries = same Delivery Note doctype as restaurant deliveries.
// Reuse the restaurant deliveries config but with a logistics-flavored title.
import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Delivery Note',
        title: 'إدارة التوصيل',
        subtitle: 'سندات تسليم البضائع للعملاء',
        basePath: '/logistics/deliveries',
        newLabel: 'تسليم جديد',
        searchField: 'customer',
        dateField: 'posting_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'posting_date', header: 'التاريخ' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'grand_total', header: 'الإجمالي', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:     { label: 'مسودة',  cls: 'bg-amber-100 text-amber-700' },
          'To Bill': { label: 'بانتظار الفوترة', cls: 'bg-blue-100 text-blue-700' },
          Completed: { label: 'مكتملة', cls: 'bg-emerald-100 text-emerald-700' },
          Cancelled: { label: 'ملغاة',  cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
