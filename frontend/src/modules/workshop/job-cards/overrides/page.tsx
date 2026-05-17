import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Vehicle Job Card',
        title: 'بطاقات العمل',
        subtitle: 'أوامر شغل الورشة وحالاتها',
        basePath: '/workshop/job-cards',
        newLabel: 'بطاقة جديدة',
        searchField: 'name',
        dateField: 'posting_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'posting_date', header: 'التاريخ' },
          { fieldname: 'vehicle', header: 'المركبة' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'technician', header: 'الفني' },
          { fieldname: 'service_type', header: 'الخدمة' },
          { fieldname: 'total_amount', header: 'الإجمالي', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Open:        { label: 'مفتوحة',  cls: 'bg-amber-100 text-amber-700' },
          'In Progress': { label: 'قيد العمل', cls: 'bg-blue-100 text-blue-700' },
          Completed:   { label: 'مكتملة',  cls: 'bg-emerald-100 text-emerald-700' },
          Invoiced:    { label: 'مفوترة',  cls: 'bg-purple-100 text-purple-700' },
          Cancelled:   { label: 'ملغاة',   cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
