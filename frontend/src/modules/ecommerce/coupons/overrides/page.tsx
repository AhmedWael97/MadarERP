import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Coupon Code',
        title: 'إدارة الكوبونات',
        subtitle: 'أكواد الخصم والعروض الترويجية',
        basePath: '/ecommerce/coupons',
        newLabel: 'كوبون جديد',
        searchField: 'coupon_name',
        dateField: 'valid_from',
        columns: [
          { fieldname: 'name', header: 'الكوبون', mono: true },
          { fieldname: 'coupon_name', header: 'الاسم' },
          { fieldname: 'coupon_type', header: 'النوع' },
          { fieldname: 'valid_from', header: 'يبدأ من' },
          { fieldname: 'valid_upto', header: 'يصلح حتى' },
          { fieldname: 'used', header: 'تم الاستخدام', numeric: true, ltr: true },
          { fieldname: 'maximum_use', header: 'الحد الأقصى', numeric: true, ltr: true },
        ],
      }}
    />
  );
}
