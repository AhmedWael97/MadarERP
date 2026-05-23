/** الميزانية العمومية — wraps ERPNext "Balance Sheet". */
import { useState } from 'react';
import { FinancialReportShell, type ReportColumn } from '../FinancialReportShell';
import { localDate, localYearStart } from '@/lib/formatters/dates';

const COLUMNS: ReportColumn[] = [
  { label: 'الحساب', fieldname: 'account' },
  { label: 'الرصيد', fieldname: 'closing_balance', numeric: true },
];

export default function BalanceSheetPage() {
  const [fromDate, setFromDate] = useState(localYearStart());
  const [toDate, setToDate] = useState(localDate());

  return (
    <FinancialReportShell
      title="الميزانية العمومية"
      subtitle="أصول وخصوم وحقوق ملكية"
      reportName="Balance Sheet"
      // BS uses period_start_date/period_end_date (NOT from_date/to_date,
      // even though the error message lies). fiscal_year is auto-injected
      // by the shell.
      filters={{ period_start_date: fromDate, period_end_date: toDate, periodicity: 'Yearly' }}
      permDoctype="GL Entry"
      columns={COLUMNS}
      filterUI={
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">من تاريخ</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">إلى تاريخ</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm" />
          </div>
        </>
      }
    />
  );
}
