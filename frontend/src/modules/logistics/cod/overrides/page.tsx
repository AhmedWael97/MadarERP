import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar COD Settlement',
        title: 'تسوية الدفع عند الاستلام',
        subtitle: 'تسويات مبالغ COD المُحصَّلة من شركات الشحن',
        basePath: '/logistics/cod',
        newLabel: 'تسوية جديدة',
        searchField: 'carrier',
        dateField: 'settlement_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'settlement_date', header: 'التاريخ' },
          { fieldname: 'carrier', header: 'الناقل' },
          { fieldname: 'shipments_count', header: 'عدد الشحنات', numeric: true, ltr: true },
          { fieldname: 'total_collected', header: 'إجمالي المُحصَّل', numeric: true, ltr: true },
          { fieldname: 'commission', header: 'العمولة', numeric: true, ltr: true },
          { fieldname: 'net_amount', header: 'الصافي', numeric: true, ltr: true },
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
