import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Driver Profile',
        title: 'إدارة السائقين',
        subtitle: 'سجلات السائقين والرخص والتراخيص',
        basePath: '/fleet/drivers',
        newLabel: 'سائق جديد',
        searchField: 'driver_name',
        columns: [
          { fieldname: 'driver_code', header: 'الكود', mono: true },
          { fieldname: 'driver_name', header: 'الاسم' },
          { fieldname: 'mobile', header: 'الجوال', mono: true, ltr: true },
          { fieldname: 'license_number', header: 'الرخصة', mono: true },
          { fieldname: 'assigned_vehicle', header: 'المركبة' },
          { fieldname: 'branch', header: 'الفرع' },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Active: { label: 'نشط', cls: 'bg-emerald-100 text-emerald-700' },
          'On Leave': { label: 'إجازة', cls: 'bg-amber-100 text-amber-700' },
          Inactive: { label: 'غير نشط', cls: 'bg-slate-100 text-slate-700' },
          Suspended: { label: 'موقوف', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
