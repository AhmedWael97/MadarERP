import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Construction Project',
        title: 'مشاريع الإنشاء',
        subtitle: 'إدارة مشاريع المقاولات والإنشاءات',
        basePath: '/construction/projects',
        newLabel: 'مشروع جديد',
        searchField: 'name_ar',
        dateField: 'start_date',
        columns: [
          { fieldname: 'project_code', header: 'الكود', mono: true },
          { fieldname: 'name_ar', header: 'اسم المشروع' },
          { fieldname: 'project_type', header: 'النوع' },
          { fieldname: 'customer', header: 'العميل' },
          { fieldname: 'start_date', header: 'البداية' },
          { fieldname: 'end_date', header: 'النهاية' },
          { fieldname: 'contract_value', header: 'قيمة العقد', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Planning:      { label: 'تخطيط',     cls: 'bg-amber-100 text-amber-700' },
          'In Progress': { label: 'جاري',      cls: 'bg-blue-100 text-blue-700' },
          Completed:     { label: 'مكتمل',     cls: 'bg-emerald-100 text-emerald-700' },
          'On Hold':     { label: 'معلق',     cls: 'bg-slate-100 text-slate-700' },
          Cancelled:     { label: 'ملغى',      cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
