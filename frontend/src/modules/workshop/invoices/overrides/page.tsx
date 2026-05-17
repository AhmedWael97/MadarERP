import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Workshop invoices = Sales Invoice with a workshop tag/source. Reuse the
// general entity list — filter to workshop source on the Frappe side when needed.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Sales Invoice',
        title: 'فواتير الورشة',
        subtitle: 'فواتير خدمات الورشة',
        basePath: '/workshop/invoices',
        newLabel: 'فاتورة ورشة',
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
          Paid:      { label: 'مدفوعة', cls: 'bg-emerald-100 text-emerald-700' },
          Unpaid:    { label: 'غير مدفوعة', cls: 'bg-red-100 text-red-700' },
          Overdue:   { label: 'متأخرة', cls: 'bg-orange-100 text-orange-700' },
          Cancelled: { label: 'ملغاة',  cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
