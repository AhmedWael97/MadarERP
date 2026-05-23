import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Sales Order',
        title: 'إدارة الطلبات',
        subtitle: 'طلبات المطعم (صالة / تيك أواي / توصيل)',
        basePath: '/restaurant/orders',
        newLabel: 'طلب جديد',
        searchField: 'customer',
        dateField: 'transaction_date',
        columns: [
          { fieldname: 'name',             header: 'الرقم' },
          { fieldname: 'transaction_date', header: 'التاريخ' },
          { fieldname: 'customer',         header: 'العميل' },
          { fieldname: 'order_type',       header: 'النوع',    isBadge: true },
          { fieldname: 'grand_total',      header: 'الإجمالي', numeric: true, ltr: true },
          { fieldname: 'status',           header: 'الحالة',   isBadge: true },
        ],
        badgeMap: {
          // Sales Order statuses
          Draft:                  { label: 'مسودة',              cls: 'bg-slate-100 text-slate-700' },
          'To Deliver and Bill':  { label: 'بانتظار التسليم والفوترة', cls: 'bg-amber-100 text-amber-700' },
          'To Deliver':           { label: 'بانتظار التسليم',    cls: 'bg-blue-100 text-blue-700' },
          'To Bill':              { label: 'بانتظار الفوترة',    cls: 'bg-purple-100 text-purple-700' },
          Completed:              { label: 'مكتمل',               cls: 'bg-emerald-100 text-emerald-700' },
          Cancelled:              { label: 'ملغى',                cls: 'bg-red-100 text-red-700' },
          'On Hold':              { label: 'معلق',                cls: 'bg-orange-100 text-orange-700' },
          Closed:                 { label: 'مغلق',                cls: 'bg-gray-100 text-gray-600' },
          // order_type custom field values
          dine_in:   { label: 'داخلي',    cls: 'bg-teal-100 text-teal-700' },
          takeaway:  { label: 'تيك أواي', cls: 'bg-sky-100 text-sky-700' },
          delivery:  { label: 'توصيل',    cls: 'bg-indigo-100 text-indigo-700' },
          drive_thru:{ label: 'سيارات',   cls: 'bg-violet-100 text-violet-700' },
          pickup:    { label: 'استلام',   cls: 'bg-pink-100 text-pink-700' },
        },
      }}
    />
  );
}
