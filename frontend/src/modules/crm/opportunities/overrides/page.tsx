import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Opportunity',
        title: 'الفرص البيعية',
        subtitle: 'متابعة الفرص حتى الإغلاق',
        basePath: '/crm/opportunities',
        newLabel: 'فرصة جديدة',
        searchField: 'party_name',
        dateField: 'transaction_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'transaction_date', header: 'التاريخ' },
          { fieldname: 'party_name', header: 'الطرف' },
          { fieldname: 'opportunity_type', header: 'النوع' },
          { fieldname: 'source', header: 'المصدر' },
          { fieldname: 'probability', header: 'الاحتمال %', numeric: true, ltr: true },
          { fieldname: 'opportunity_amount', header: 'القيمة', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Open:      { label: 'مفتوحة', cls: 'bg-amber-100 text-amber-700' },
          Quotation: { label: 'عرض سعر', cls: 'bg-blue-100 text-blue-700' },
          Converted: { label: 'تم التحويل', cls: 'bg-emerald-100 text-emerald-700' },
          Closed:    { label: 'مغلقة',   cls: 'bg-slate-100 text-slate-700' },
          Lost:      { label: 'مفقودة',   cls: 'bg-red-100 text-red-700' },
          Replied:   { label: 'تم الرد',  cls: 'bg-purple-100 text-purple-700' },
        },
      }}
    />
  );
}
