import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Madaar Modifier Group: group_name, min_selections, max_selections. No
// is_required field on this doctype (selection min/max conveys that).
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
          { fieldname: 'min_selections', header: 'الحد الأدنى', numeric: true, ltr: true },
          { fieldname: 'max_selections', header: 'الحد الأقصى', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
