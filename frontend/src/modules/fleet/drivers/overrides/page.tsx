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
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'driver_name', header: 'الاسم' },
          { fieldname: 'license_number', header: 'رقم الرخصة', mono: true },
          { fieldname: 'license_expiry', header: 'انتهاء الرخصة' },
          { fieldname: 'phone', header: 'الهاتف', mono: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Active: { label: 'نشط', cls: 'bg-emerald-100 text-emerald-700' },
          Inactive: { label: 'غير نشط', cls: 'bg-amber-100 text-amber-700' },
          Suspended: { label: 'موقوف', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
