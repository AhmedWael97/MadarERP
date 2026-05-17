import FleetEntityList from '@/modules/fleet/FleetEntityList';
export default function Page() {
  return (
    <FleetEntityList
      cfg={{
        doctype: 'Version',
        title: 'سجل تدقيق الضرائب',
        subtitle: 'تتبع التغييرات على المستندات الضريبية',
        basePath: '/tax/audit-log',
        newLabel: 'سجل جديد',
        searchField: 'ref_doctype',
        dateField: 'creation',
        columns: [
          { fieldname: 'name', header: 'الرقم' },
          { fieldname: 'creation', header: 'تاريخ التغيير' },
          { fieldname: 'ref_doctype', header: 'نوع المستند' },
          { fieldname: 'docname', header: 'المستند' },
          { fieldname: 'owner', header: 'المستخدم' },
        ],
      }}
    />
  );
}
