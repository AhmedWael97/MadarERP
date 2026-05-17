import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Work centers in ERPNext = Workstation doctype.
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Workstation',
        title: 'مراكز العمل',
        subtitle: 'محطات الإنتاج وتكاليف التشغيل',
        basePath: '/mfg/work-centers',
        newLabel: 'مركز جديد',
        searchField: 'workstation_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'workstation_name', header: 'الاسم' },
          { fieldname: 'production_capacity', header: 'الطاقة الإنتاجية', numeric: true, ltr: true },
          { fieldname: 'hour_rate', header: 'تكلفة الساعة', numeric: true, ltr: true },
          { fieldname: 'hour_rate_electricity', header: 'كهرباء/ساعة', numeric: true, ltr: true },
          { fieldname: 'hour_rate_labour', header: 'عمالة/ساعة', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
