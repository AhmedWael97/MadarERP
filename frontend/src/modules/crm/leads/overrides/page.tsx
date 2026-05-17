import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Lead',
        title: 'العملاء المحتملين',
        subtitle: 'إدارة العملاء المحتملين وتأهيلهم',
        basePath: '/crm/leads',
        newLabel: 'عميل محتمل',
        searchField: 'lead_name',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'lead_name', header: 'الاسم' },
          { fieldname: 'company_name', header: 'الشركة' },
          { fieldname: 'mobile_no', header: 'الموبايل', mono: true, ltr: true },
          { fieldname: 'email_id', header: 'البريد' },
          { fieldname: 'source', header: 'المصدر' },
          { fieldname: 'status', header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Lead:        { label: 'محتمل',          cls: 'bg-amber-100 text-amber-700' },
          Open:        { label: 'مفتوح',          cls: 'bg-blue-100 text-blue-700' },
          Replied:     { label: 'تم الرد',        cls: 'bg-purple-100 text-purple-700' },
          Opportunity: { label: 'تحول لفرصة',     cls: 'bg-emerald-100 text-emerald-700' },
          Quotation:   { label: 'عرض سعر',        cls: 'bg-cyan-100 text-cyan-700' },
          'Lost Quotation': { label: 'فقدت',      cls: 'bg-red-100 text-red-700' },
          Interested:  { label: 'مهتم',           cls: 'bg-emerald-100 text-emerald-700' },
          Converted:   { label: 'تم التحويل',      cls: 'bg-emerald-100 text-emerald-700' },
          'Do Not Contact': { label: 'لا يتم التواصل', cls: 'bg-red-100 text-red-700' },
        },
      }}
    />
  );
}
