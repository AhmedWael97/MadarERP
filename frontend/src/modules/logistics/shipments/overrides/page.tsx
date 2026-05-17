import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Shipment',
        title: 'إدارة الشحنات',
        subtitle: 'شحنات الخدمات اللوجستية للعملاء',
        basePath: '/logistics/shipments',
        newLabel: 'شحنة جديدة',
        searchField: 'pickup_from_type',
        dateField: 'pickup_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'pickup_date', header: 'تاريخ الاستلام' },
          { fieldname: 'pickup_from_type', header: 'من' },
          { fieldname: 'delivery_to_type', header: 'إلى' },
          { fieldname: 'carrier', header: 'الناقل' },
          { fieldname: 'awb_number', header: 'AWB', mono: true, ltr: true },
          { fieldname: 'value_of_goods', header: 'القيمة', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Booked:     { label: 'محجوزة',       cls: 'bg-amber-100 text-amber-700' },
          'In Transit': { label: 'في الطريق', cls: 'bg-blue-100 text-blue-700' },
          Delivered:  { label: 'مُسلَّمة',       cls: 'bg-emerald-100 text-emerald-700' },
          Returned:   { label: 'مُرتجَعة',       cls: 'bg-orange-100 text-orange-700' },
          Cancelled:  { label: 'ملغاة',         cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
