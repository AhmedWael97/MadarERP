import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Madaar Vehicle',
        title: 'إدارة المركبات',
        subtitle: 'بيانات الأسطول والمركبات التشغيلية',
        basePath: '/fleet/vehicles',
        newLabel: 'مركبة جديدة',
        searchField: 'vehicle_number',
        columns: [
          { fieldname: 'vehicle_code', header: 'الكود', mono: true },
          { fieldname: 'vehicle_number', header: 'رقم المركبة', mono: true },
          { fieldname: 'license_plate', header: 'رقم اللوحة', mono: true },
          { fieldname: 'make', header: 'الماركة' },
          { fieldname: 'model', header: 'الموديل' },
          { fieldname: 'year', header: 'السنة', ltr: true },
          { fieldname: 'fuel_type', header: 'الوقود' },
          { fieldname: 'current_odometer', header: 'العداد (كم)', numeric: true, ltr: true },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Active: { label: 'نشطة', cls: 'bg-emerald-100 text-emerald-700' },
          'In Maintenance': { label: 'في الصيانة', cls: 'bg-amber-100 text-amber-700' },
          'Out of Service': { label: 'خارج الخدمة', cls: 'bg-red-100 text-red-700' },
          Reserved: { label: 'محجوزة', cls: 'bg-blue-100 text-blue-700' },
          Sold: { label: 'مباعة', cls: 'bg-slate-100 text-slate-700' },
          Suspended: { label: 'موقوفة', cls: 'bg-orange-100 text-orange-700' },
        },
      }}
    />
  );
}
