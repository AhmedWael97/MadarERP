import FleetEntityList from '@/modules/fleet/FleetEntityList';
// ERPNext Bank doctype = financial institutions (CIB, NBE, ...).
// Distinct from Bank Account, which is the company's specific account at
// such an institution. Standard fields: bank_name (autoname, reqd),
// swift_number, website, bank_transaction_mapping (child).
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Bank',
        title: 'البنوك',
        subtitle: 'قائمة المؤسسات البنكية',
        basePath: '/treasury/bank-institutions',
        newLabel: 'بنك جديد',
        searchField: 'bank_name',
        columns: [
          { fieldname: 'name', header: 'الكود' },
          { fieldname: 'bank_name', header: 'اسم البنك' },
          { fieldname: 'swift_number', header: 'SWIFT', mono: true, ltr: true },
          { fieldname: 'website', header: 'الموقع الإلكتروني', mono: true, ltr: true },
        ],
      }}
    />
  );
}
