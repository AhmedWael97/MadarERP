/** دليل الموظفين — basic employee listing. */
import { FinancialReportShell, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الاسم', fieldname: 'employee_name' },
  { label: 'الرقم', fieldname: 'name' },
  { label: 'المسمى', fieldname: 'designation' },
  { label: 'القسم', fieldname: 'department' },
  { label: 'تاريخ التعيين', fieldname: 'date_of_joining' },
  { label: 'الهاتف', fieldname: 'cell_number' },
  { label: 'الحالة', fieldname: 'status' },
];

export default function EmployeeDirectoryPage() {
  return (
    <FinancialReportShell
      title="دليل الموظفين"
      subtitle="بيانات اتصال جميع الموظفين"
      reportName="Employee Information"
      filters={{}}
      permDoctype="Employee"
      columns={COLUMNS}
      filterUI={<div />}
    />
  );
}
