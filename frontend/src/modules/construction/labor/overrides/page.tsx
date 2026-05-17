import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Labor Record: hours_worked (not hours), hourly_rate (not hour_rate).
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Labor Record',
        title: 'سجلات العمالة',
        subtitle: 'ساعات عمل العمالة على المشاريع',
        basePath: '/construction/labor',
        newLabel: 'سجل جديد',
        searchField: 'employee',
        dateField: 'date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'date', header: 'التاريخ' },
          { fieldname: 'project', header: 'المشروع' },
          { fieldname: 'employee', header: 'العامل' },
          { fieldname: 'task_description', header: 'الوصف' },
          { fieldname: 'hours_worked', header: 'الساعات', numeric: true, ltr: true },
          { fieldname: 'hourly_rate', header: 'تكلفة الساعة', numeric: true, ltr: true },
          { fieldname: 'total_cost', header: 'الإجمالي', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
