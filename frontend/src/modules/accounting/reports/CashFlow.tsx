/** قائمة التدفقات النقدية — wraps ERPNext "Cash Flow". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '../FinancialReportShell';
import { localDate, localYearStart } from '@/lib/formatters/dates';

const COLUMNS: ReportColumn[] = [
  { label: 'البند', fieldname: 'account' },
  { label: 'القيمة', fieldname: 'closing_balance', numeric: true },
];

export default function CashFlowPage() {
  const [fromDate, setFromDate] = useState(localYearStart());
  const [toDate, setToDate] = useState(localDate());

  return (
    <FinancialReportShell
      title="قائمة التدفقات النقدية"
      subtitle="الأنشطة التشغيلية والاستثمارية والتمويلية"
      reportName="Cash Flow"
      filters={{ from_date: fromDate, to_date: toDate, periodicity: 'Yearly', fiscal_year: undefined }}
      permDoctype="GL Entry"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
