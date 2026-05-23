/** قائمة التدفقات النقدية — wraps ERPNext "Cash Flow". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, fmtNum, type ReportColumn } from '../FinancialReportShell';
import { localDate, localYearStart } from '@/lib/formatters/dates';

function cleanName(row: Record<string, unknown>) {
  const raw = String((row.account_name as string) || (row.account as string) || '—');
  return raw.replace(/\s-\s[^\s-]+$/, '');
}

// Same column shape as Balance Sheet / P&L — see BalanceSheet.tsx for the
// rationale.
const COLUMNS: ReportColumn[] = [
  {
    label: 'البند',
    fieldname: 'account',
    render: (row) => {
      const name = cleanName(row as Record<string, unknown>);
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

export default function CashFlowPage() {
  const [fromDate, setFromDate] = useState(localYearStart());
  const [toDate, setToDate] = useState(localDate());

  return (
    <FinancialReportShell
      title="قائمة التدفقات النقدية"
      subtitle="الأنشطة التشغيلية والاستثمارية والتمويلية"
      reportName="Cash Flow"
      // Cash Flow uses period_start_date/period_end_date (NOT from_date/to_date,
      // same gotcha as Balance Sheet and Profit and Loss).
      filters={{ period_start_date: fromDate, period_end_date: toDate, periodicity: 'Yearly' }}
      permDoctype="GL Entry"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
