import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Modifier Group',
        title: 'مجموعات الإضافات',
        subtitle: 'إضافات وخيارات أصناف القائمة',
        basePath: '/restaurant/modifiers',
        newLabel: 'مجموعة جديدة',
        searchField: 'group_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'group_name', header: 'اسم المجموعة' },
          { fieldname: 'is_required', header: 'إلزامي', isBadge: true },
          { fieldname: 'min_selections', header: 'الحد الأدنى', numeric: true, ltr: true },
          { fieldname: 'max_selections', header: 'الحد الأقصى', numeric: true, ltr: true },
        ],
        badgeMap: {
          '1': { label: 'إلزامي',    cls: 'bg-red-100 text-red-700' },
          '0': { label: 'اختياري',   cls: 'bg-emerald-100 text-emerald-700' },
        },
      }}
    />
  );
}
