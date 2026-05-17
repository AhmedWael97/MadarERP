/** ملخص المبيعات — Sales Register, monthly grouped. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الفترة', fieldname: 'period' },
  { label: 'عدد الفواتير', fieldname: 'count', numeric: true },
  { label: 'إجمالي المبيعات', fieldname: 'net_total', numeric: true },
  { label: 'إجمالي الخصومات', fieldname: 'discount', numeric: true },
  { label: 'إجمالي الضرائب', fieldname: 'taxes', numeric: true },
  { label: 'الإجمالي النهائي', fieldname: 'grand_total', numeric: true },
];

export default function SalesSummaryPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="ملخص المبيعات"
      subtitle="ملخص شهري للمبيعات والخصومات والضرائب"
      reportName="Sales Register"
      filters={{ from_date: fromDate, to_date: toDate, group_by: 'Month' }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
