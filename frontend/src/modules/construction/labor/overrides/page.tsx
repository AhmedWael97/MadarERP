import FleetEntityList from '@/modules/fleet/FleetEntityList';
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
          { fieldname: 'hours', header: 'الساعات', numeric: true, ltr: true },
          { fieldname: 'hour_rate', header: 'تكلفة الساعة', numeric: true, ltr: true },
          { fieldname: 'total_cost', header: 'الإجمالي', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
