/** قائمة الدخل — wraps ERPNext "Profit and Loss Statement". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '../FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الحساب', fieldname: 'account' },
  { label: 'القيمة', fieldname: 'closing_balance', numeric: true },
];

export default function IncomeStatementPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);

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
