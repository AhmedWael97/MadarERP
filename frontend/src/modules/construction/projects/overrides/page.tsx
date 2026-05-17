import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Project',
        title: 'المشاريع',
        subtitle: 'إدارة مشاريع المقاولات والإنشاءات',
        basePath: '/construction/projects',
        newLabel: 'مشروع جديد',
        searchField: 'project_name',
        dateField: 'expected_start_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'project_name', header: 'اسم المشروع' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'expected_start_date', header: 'البداية' },
          { fieldname: 'expected_end_date', header: 'النهاية' },
          { fieldname: 'percent_complete', header: 'الإنجاز %', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Open:        { label: 'مفتوح',  cls: 'bg-amber-100 text-amber-700' },
          Completed:   { label: 'مكتمل',  cls: 'bg-emerald-100 text-emerald-700' },
          Cancelled:   { label: 'ملغى',   cls: 'bg-red-100 text-red-700' },
          'On Hold':   { label: 'متوقف',  cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
