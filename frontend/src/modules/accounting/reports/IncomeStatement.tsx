/** قائمة الدخل — wraps ERPNext "Profit and Loss Statement". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, fmtNum, type ReportColumn } from '../FinancialReportShell';
import { localDate, localYearStart } from '@/lib/formatters/dates';

function cleanName(row: Record<string, unknown>) {
  const raw = String((row.account_name as string) || (row.account as string) || '—');
  return raw.replace(/\s-\s[^\s-]+$/, '');
}

function transformByCollapse(rows: Array<Record<string, unknown>>, collapsed: Set<string>) {
  const out: Array<Record<string, unknown>> = [];
  const stack: number[] = [];
  for (const row of rows) {
    const indent = Number(row.indent ?? 0);
    while (stack.length && stack[stack.length - 1] >= indent) stack.pop();
    if (stack.length > 0) continue;
    out.push(row);
    const key = String(row.account ?? row.account_name ?? '');
    if (Number(row.is_group ?? 0) === 1 && collapsed.has(key)) {
      stack.push(indent);
    }
  }
  return out;
}

// Same column shape as Balance Sheet — see BalanceSheet.tsx for the rationale
// (period-named numeric columns + `total`, clean account_name, indent for
// the tree hierarchy).
const buildColumns = (collapsed: Set<string>, toggle: (key: string) => void): ReportColumn[] => [
  {
    label: 'الحساب',
    fieldname: 'account',
    render: (row) => {
      const name = cleanName(row as Record<string, unknown>);
      const indent = Number(row.indent ?? 0);
      const isGroup = Number(row.is_group ?? 0) === 1;
      const key = String(row.account ?? row.account_name ?? '');
      const isClosed = collapsed.has(key);
      return (
        <button
          type="button"
          onClick={() => { if (isGroup) toggle(key); }}
          style={{ paddingInlineStart: `${indent * 16}px` }}
          className={(isGroup ? 'font-bold ' : '') + 'inline-flex items-center gap-1'}
        >
          {isGroup ? <span className="text-xs">{isClosed ? '▸' : '▾'}</span> : <span className="w-3" />}
          <span>{name}</span>
        </button>
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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <FinancialReportShell
      title="قائمة الدخل"
      subtitle="الإيرادات والمصروفات وصافي الربح"
      reportName="Profit and Loss Statement"
      // P&L uses period_start_date/period_end_date (NOT from_date/to_date,
      // see BalanceSheet for the same gotcha).
      filters={{ period_start_date: fromDate, period_end_date: toDate, periodicity: 'Yearly' }}
      permDoctype="GL Entry"
      columns={buildColumns(collapsed, toggle)}
      rowTransform={(rows) => transformByCollapse(rows, collapsed)}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
