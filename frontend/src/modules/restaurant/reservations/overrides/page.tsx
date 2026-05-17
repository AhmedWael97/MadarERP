import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Reservation: reservation_datetime (single field, not date+time),
// customer_phone (not phone), party_size (not guests_count), table_link
// (not table).
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Reservation',
        title: 'إدارة الحجوزات',
        subtitle: 'حجوزات الطاولات والمناسبات',
        basePath: '/restaurant/reservations',
        newLabel: 'حجز جديد',
        searchField: 'customer_name',
        dateField: 'reservation_datetime',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'customer_name', header: 'العميل' },
          { fieldname: 'customer_phone', header: 'الهاتف', mono: true, ltr: true },
          { fieldname: 'reservation_datetime', header: 'الموعد' },
          { fieldname: 'party_size', header: 'عدد الضيوف', numeric: true, ltr: true },
          { fieldname: 'hall', header: 'الصالة' },
          { fieldname: 'table_link', header: 'الطاولة' },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Pending:   { label: 'قيد التأكيد',  cls: 'bg-amber-100 text-amber-700' },
          Confirmed: { label: 'مؤكد',         cls: 'bg-blue-100 text-blue-700' },
          Seated:    { label: 'تم الاستقبال', cls: 'bg-purple-100 text-purple-700' },
          Completed: { label: 'مكتمل',        cls: 'bg-emerald-100 text-emerald-700' },
          'No Show': { label: 'لم يحضر',      cls: 'bg-red-100 text-red-700' },
          Cancelled: { label: 'ملغى',          cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
