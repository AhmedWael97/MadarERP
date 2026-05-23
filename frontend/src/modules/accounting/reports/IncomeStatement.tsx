/** قائمة الدخل — wraps ERPNext "Profit and Loss Statement". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '../FinancialReportShell';
import { localDate, localYearStart } from '@/lib/formatters/dates';

const COLUMNS: ReportColumn[] = [
  { label: 'الحساب', fieldname: 'account' },
  { label: 'القيمة', fieldname: 'closing_balance', numeric: true },
];

export default function IncomeStatementPage() {
  const [fromDate, setFromDate] = useState(localYearStart());
  const [toDate, setToDate] = useState(localDate());

  return (
    <FinancialReportShell
      title="قائمة الدخل"
      subtitle="الإيرادات والمصروفات وصافي الربح"
      reportName="Profit and Loss Statement"
      filters={{ from_date: fromDate, to_date: toDate, periodicity: 'Yearly', fiscal_year: undefined }}
      permDoctype="GL Entry"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
