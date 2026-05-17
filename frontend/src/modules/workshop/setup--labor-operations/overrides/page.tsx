import FleetEntityList from '@/modules/fleet/FleetEntityList';
// ERPNext Operation: description, batch_size, is_corrective_operation.
// No `hour_rate` / `workstation` on Operation directly.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Operation',
        title: 'عمليات العمالة',
        subtitle: 'تعريفات عمليات الورشة والعمالة',
        basePath: '/workshop/setup/labor-operations',
        newLabel: 'عملية جديدة',
        searchField: 'name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'description', header: 'الوصف' },
          { fieldname: 'batch_size', header: 'حجم الدفعة', numeric: true, ltr: true },
          { fieldname: 'is_corrective_operation', header: 'تصحيحية', isBadge: true },
        ],
        badgeMap: {
          '1': { label: 'نعم', cls: 'bg-amber-100 text-amber-700' },
          '0': { label: 'لا',  cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
