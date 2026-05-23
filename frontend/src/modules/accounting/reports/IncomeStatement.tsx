/** قائمة الدخل — wraps ERPNext "Profit and Loss Statement". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, fmtNum, type ReportColumn } from '../FinancialReportShell';
import { localDate, localYearStart } from '@/lib/formatters/dates';

// Same column shape as Balance Sheet — see BalanceSheet.tsx for the rationale
// (period-named numeric columns + `total`, clean account_name, indent for
// the tree hierarchy).
const COLUMNS: ReportColumn[] = [
  {
    label: 'الحساب',
    fieldname: 'account',
    render: (row) => {
      const name = (row.account_name as string) || (row.account as string) || '—';
      const indent = Number(row.indent ?? 0);
      const isGroup = Number(row.is_group ?? 0) === 1;
      return (
        <span
          style={{ paddingInlineStart: `${indent * 16}px` }}
          className={isGroup ? 'font-bold' : ''}
        >
          {name}
        </span>
      );
    },
  },
  {
    label: 'القيمة',
    fieldname: 'total',
    numeric: true,
    render: (row) => fmtNum(Number(row.total ?? 0)),
  },
];

export default function IncomeStatementPage() {
  const [fromDate, setFromDate] = useState(localYearStart());
  const [toDate, setToDate] = useState(localDate());

  return (
    <FinancialReportShell
      title="قائمة الدخل"
      subtitle="الإيرادات والمصروفات وصافي الربح"
      reportName="Profit and Loss Statement"
      // P&L uses period_start_date/period_end_date (NOT from_date/to_date,
      // see BalanceSheet for the same gotcha).
      filters={{ period_start_date: fromDate, period_end_date: toDate, periodicity: 'Yearly' }}
      permDoctype="GL Entry"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
