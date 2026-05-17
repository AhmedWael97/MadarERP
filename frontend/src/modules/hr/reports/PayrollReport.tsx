/** تقرير الرواتب — wraps ERPNext "Salary Register". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الموظف', fieldname: 'employee_name' },
  { label: 'القسم', fieldname: 'department' },
  { label: 'الاستحقاقات', fieldname: 'gross_pay', numeric: true },
  { label: 'الخصومات', fieldname: 'total_deduction', numeric: true },
  { label: 'الصافي', fieldname: 'net_pay', numeric: true },
];

export default function PayrollReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="تقرير الرواتب"
      subtitle="ملخص رواتب الفترة"
      reportName="Salary Register"
      filters={{ from_date: fromDate, to_date: toDate }}
      permDoctype="Salary Slip"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
