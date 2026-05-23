/** ميزان المراجعة — wraps ERPNext "Trial Balance". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, fmtNum, type ReportColumn } from '../FinancialReportShell';
import { localDate, localYearStart } from '@/lib/formatters/dates';

// ERPNext Trial Balance does NOT return a `closing_balance` field — it
// returns `closing_debit` and `closing_credit` separately (we render the
// natural-side figure). It also returns `account_name` (clean) and `account`
// (with " - <abbr>" suffix); we prefer the clean version.
const COLUMNS: ReportColumn[] = [
  { label: 'الكود', fieldname: 'account_number' },
  {
    label: 'اسم الحساب',
    fieldname: 'account',
    render: (row) => (row.account_name as string) || (row.account as string) || '—',
  },
  { label: 'مدين', fieldname: 'debit', numeric: true },
  { label: 'دائن', fieldname: 'credit', numeric: true },
  {
    label: 'الرصيد',
    fieldname: 'closing_balance',
    numeric: true,
    render: (row) => {
      const dr = Number(row.closing_debit ?? 0);
      const cr = Number(row.closing_credit ?? 0);
      // Show the natural-side balance: debit accounts show their debit total,
      // credit accounts show their credit total. Avoids the confusing "0 / 0"
      // when both columns happen to be equal in the closing snapshot.
      const balance = dr - cr;
      return fmtNum(balance);
    },
  },
];

export default function TrialBalancePage() {
  const [fromDate, setFromDate] = useState(localYearStart());
  const [toDate, setToDate] = useState(localDate());

  return (
    <FinancialReportShell
      title="ميزان المراجعة"
      subtitle="عرض أرصدة جميع الحسابات المدينة والدائنة"
      reportName="Trial Balance"
      filters={{ from_date: fromDate, to_date: toDate, fiscal_year: undefined }}
      permDoctype="GL Entry"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
