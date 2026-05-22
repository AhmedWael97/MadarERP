import FleetEntityList from '@/modules/fleet/FleetEntityList';

export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Construction Contract',
        title: 'عقود المقاولات',
        subtitle: 'عقود مشاريع الإنشاء والبناء',
        basePath: '/construction/contracts',
        newLabel: 'عقد جديد',
        searchField: 'contract_number',
        dateField: 'start_date',
        columns: [
          { fieldname: 'contract_number', header: 'رقم العقد', mono: true },
          { fieldname: 'project',         header: 'المشروع' },
          { fieldname: 'client',          header: 'العميل' },
          { fieldname: 'contract_value',  header: 'قيمة العقد', numeric: true },
          { fieldname: 'contract_type',   header: 'نوع العقد' },
          { fieldname: 'start_date',      header: 'تاريخ البداية' },
          { fieldname: 'end_date',        header: 'تاريخ الانتهاء' },
          { fieldname: 'status',          header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Draft:      { label: 'مسودة',  cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
          Active:     { label: 'نشط',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
          Completed:  { label: 'مكتمل',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
          Terminated: { label: 'منهي',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
          Suspended:  { label: 'موقوف',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        },
      }}
    />
  );
}
