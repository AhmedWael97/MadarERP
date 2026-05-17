import FleetEntityList from '@/modules/fleet/FleetEntityList';
// ERPNext Material Request has no top-level `project` field (it's per row).
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Material Request',
        title: 'طلبات المواد',
        subtitle: 'طلبات شراء وصرف مواد المشاريع',
        basePath: '/construction/materials',
        newLabel: 'طلب مواد',
        searchField: 'customer',
        dateField: 'transaction_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'transaction_date', header: 'التاريخ' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'material_request_type', header: 'النوع' },
          { fieldname: 'company', header: 'الشركة' },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:     { label: 'مسودة',         cls: 'bg-amber-100 text-amber-700' },
          Submitted: { label: 'مرسل',           cls: 'bg-blue-100 text-blue-700' },
          Stopped:   { label: 'متوقف',          cls: 'bg-red-100 text-red-700' },
          Cancelled: { label: 'ملغى',           cls: 'bg-slate-100 text-slate-700' },
          Pending:   { label: 'بانتظار التنفيذ', cls: 'bg-purple-100 text-purple-700' },
          Issued:    { label: 'تم الصرف',       cls: 'bg-emerald-100 text-emerald-700' },
          Transferred: { label: 'تم التحويل',   cls: 'bg-emerald-100 text-emerald-700' },
        },
      }}
    />
  );
}
