import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar COD Settlement: shipment (link), amount_collected (not total_collected).
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar COD Settlement',
        title: 'تسوية الدفع عند الاستلام',
        subtitle: 'تسويات مبالغ COD المُحصَّلة من شركات الشحن',
        basePath: '/logistics/cod',
        newLabel: 'تسوية جديدة',
        searchField: 'shipment',
        dateField: 'settlement_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'settlement_date', header: 'التاريخ' },
          { fieldname: 'shipment', header: 'الشحنة' },
          { fieldname: 'payment_method', header: 'وسيلة الدفع' },
          { fieldname: 'amount_collected', header: 'المبلغ المُحصَّل', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Pending:   { label: 'بانتظار التسوية', cls: 'bg-amber-100 text-amber-700' },
          Settled:   { label: 'تمت التسوية',     cls: 'bg-emerald-100 text-emerald-700' },
          Disputed:  { label: 'متنازع عليه',     cls: 'bg-red-100 text-red-700' },
          Cancelled: { label: 'ملغى',            cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
