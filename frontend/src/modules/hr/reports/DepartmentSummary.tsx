/** ملخص الأقسام — wraps ERPNext "Employees working on a Holiday" / dept-level aggregation.
 *  We use a generic Employee group_by report. */
import { FinancialReportShell, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'القسم', fieldname: 'department' },
  { label: 'عدد الموظفين', fieldname: 'count', numeric: true },
  { label: 'متوسط الراتب', fieldname: 'avg_salary', numeric: true },
];

export default function DepartmentSummaryPage() {
  return (
    <FinancialReportShell
      title="ملخص الأقسام"
      subtitle="عدد الموظفين ومتوسط الرواتب لكل قسم"
      reportName="Employee Leave Balance"
      filters={{ group_by: 'Department' }}
      permDoctype="Employee"
      columns={COLUMNS}
      filterUI={<div />}
    />
  );
}
