/** دوران العمالة — wraps ERPNext "Monthly Attendance Sheet" + Left employee count. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الشهر', fieldname: 'period' },
  { label: 'موظفون جدد', fieldname: 'joined', numeric: true },
  { label: 'موظفون منتهيي الخدمة', fieldname: 'left', numeric: true },
  { label: 'الصافي', fieldname: 'net_change', numeric: true },
  { label: 'معدل الدوران %', fieldname: 'turnover_rate', numeric: true },
];

export default function TurnoverPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="دوران العمالة"
      subtitle="معدل دخول وخروج الموظفين"
      reportName="Employee Information"
      filters={{ from_date: fromDate, to_date: toDate }}
      permDoctype="Employee"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
