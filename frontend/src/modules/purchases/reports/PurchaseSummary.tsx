/** ملخص المشتريات — Purchase Register monthly. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الفترة', fieldname: 'period' },
  { label: 'عدد الفواتير', fieldname: 'count', numeric: true },
  { label: 'إجمالي المشتريات', fieldname: 'net_total', numeric: true },
  { label: 'إجمالي الخصومات', fieldname: 'discount', numeric: true },
  { label: 'إجمالي الضرائب', fieldname: 'taxes', numeric: true },
  { label: 'الإجمالي النهائي', fieldname: 'grand_total', numeric: true },
];

export default function PurchaseSummaryPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="ملخص المشتريات"
      subtitle="ملخص شهري للمشتريات والخصومات والضرائب"
      reportName="Purchase Register"
      filters={{ from_date: fromDate, to_date: toDate, group_by: 'Month' }}
      permDoctype="Purchase Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
