/** ميزان المراجعة — wraps ERPNext "Trial Balance". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '../FinancialReportShell';
import { localDate, localYearStart } from '@/lib/formatters/dates';

const COLUMNS: ReportColumn[] = [
  { label: 'الكود', fieldname: 'account_number' },
  { label: 'اسم الحساب', fieldname: 'account' },
  { label: 'مدين', fieldname: 'debit', numeric: true },
  { label: 'دائن', fieldname: 'credit', numeric: true },
  { label: 'الرصيد', fieldname: 'closing_balance', numeric: true },
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
