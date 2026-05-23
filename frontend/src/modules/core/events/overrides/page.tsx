import FleetEntityList from '@/modules/fleet/FleetEntityList';

export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Event Request',
        title: 'طلبات الفعاليات',
        subtitle: 'إدارة ومتابعة طلبات الفعاليات',
        basePath: '/events',
        newLabel: 'طلب فعالية جديد',
        searchField: 'event_title',
        dateField: 'requested_start',
        columns: [
          { fieldname: 'name',            header: 'الرقم' },
          { fieldname: 'event_title',     header: 'عنوان الفعالية' },
          { fieldname: 'source_type',     header: 'المصدر',         isBadge: true },
          { fieldname: 'event_type',      header: 'تصنيف الفعالية' },
          { fieldname: 'coordinator',     header: 'المنسق' },
          { fieldname: 'requested_start', header: 'تاريخ البداية' },
          { fieldname: 'workflow_state',  header: 'الحالة',         isBadge: true },
        ],
        badgeMap: {
          // workflow states
          'Draft':          { label: 'مسودة',         cls: 'bg-slate-100 text-slate-700' },
          'Pending Review': { label: 'قيد المراجعة',  cls: 'bg-amber-100 text-amber-700' },
          'Approved':       { label: 'مقبول',          cls: 'bg-emerald-100 text-emerald-700' },
          'Rejected':       { label: 'مرفوض',          cls: 'bg-red-100 text-red-700' },
          'Cancelled':      { label: 'ملغى',            cls: 'bg-gray-100 text-gray-600' },
          // source_type values
          'Internal Initiative': { label: 'داخلي',  cls: 'bg-blue-100 text-blue-700' },
          'External Request':    { label: 'خارجي',  cls: 'bg-purple-100 text-purple-700' },
        },
      }}
    />
  );
}
