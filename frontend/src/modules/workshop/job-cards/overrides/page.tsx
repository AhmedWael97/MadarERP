import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Vehicle Job Card real fields: customer, license_plate, vehicle_make,
// vehicle_model, complaint, assigned_technician, total_cost, status. No
// posting_date / vehicle / service_type / technician / total_amount.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Vehicle Job Card',
        title: 'بطاقات العمل',
        subtitle: 'أوامر شغل الورشة وحالاتها',
        basePath: '/workshop/job-cards',
        newLabel: 'بطاقة جديدة',
        searchField: 'customer',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'license_plate', header: 'اللوحة', mono: true },
          { fieldname: 'vehicle_make', header: 'الصانع' },
          { fieldname: 'vehicle_model', header: 'الموديل' },
          { fieldname: 'assigned_technician', header: 'الفني' },
          { fieldname: 'total_cost', header: 'الإجمالي', numeric: true, ltr: true },
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
