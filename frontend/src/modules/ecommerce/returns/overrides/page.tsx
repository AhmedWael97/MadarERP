import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Sales Invoice',
        title: 'مرتجعات المتجر الإلكتروني',
        subtitle: 'مرتجعات وإلغاءات طلبات المتجر',
        basePath: '/ecommerce/returns',
        newLabel: 'مرتجع جديد',
        searchField: 'customer',
        dateField: 'posting_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'posting_date', header: 'التاريخ' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'return_against', header: 'الفاتورة الأصلية' },
          { fieldname: 'grand_total', header: 'القيمة', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:     { label: 'مسودة',   cls: 'bg-amber-100 text-amber-700' },
          Submitted: { label: 'مرحّل',   cls: 'bg-emerald-100 text-emerald-700' },
          Return:    { label: 'مرتجع',    cls: 'bg-orange-100 text-orange-700' },
          Cancelled: { label: 'ملغى',     cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
