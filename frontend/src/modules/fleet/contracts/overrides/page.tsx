import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Contract',
        title: 'إدارة العقود',
        subtitle: 'عقود التشغيل والصيانة',
        basePath: '/fleet/contracts',
        newLabel: 'عقد جديد',
        searchField: 'party_name',
        dateField: 'start_date',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'party_name', header: 'الطرف الآخر' },
          { fieldname: 'party_type', header: 'النوع' },
          { fieldname: 'start_date', header: 'البداية' },
          { fieldname: 'end_date', header: 'النهاية' },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Unsigned: { label: 'غير موقّع', cls: 'bg-amber-100 text-amber-700' },
          Active: { label: 'ساري', cls: 'bg-emerald-100 text-emerald-700' },
          Inactive: { label: 'غير ساري', cls: 'bg-slate-100 text-slate-700' },
        },
      }}
    />
  );
}
