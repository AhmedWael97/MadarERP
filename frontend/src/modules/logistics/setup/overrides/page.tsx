import FleetEntityList from '@/modules/fleet/FleetEntityList';
// Logistics setup = Shipping Rule (rates / zones / surcharges).
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Shipping Rule',
        title: 'إعدادات الشحن',
        subtitle: 'قواعد الشحن والمناطق والأسعار',
        basePath: '/logistics/setup',
        newLabel: 'قاعدة جديدة',
        searchField: 'label',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'label', header: 'الاسم' },
          { fieldname: 'shipping_rule_type', header: 'النوع' },
          { fieldname: 'calculate_based_on', header: 'الاحتساب على' },
          { fieldname: 'disabled', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          '0': { label: 'مفعّلة', cls: 'bg-emerald-100 text-emerald-700' },
          '1': { label: 'معطلة',  cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
