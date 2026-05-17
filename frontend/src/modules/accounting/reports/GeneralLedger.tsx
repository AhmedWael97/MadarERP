/** الأستاذ العام — wraps ERPNext's built-in "General Ledger" query report. */
import { useState } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '../FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'التاريخ', fieldname: 'posting_date' },
  { label: 'رقم القيد', fieldname: 'voucher_no' },
  { label: 'الحساب', fieldname: 'account' },
  { label: 'البيان', fieldname: 'against' },
  { label: 'مدين', fieldname: 'debit', numeric: true },
  { label: 'دائن', fieldname: 'credit', numeric: true },
  { label: 'الرصيد', fieldname: 'balance', numeric: true },
];

export default function GeneralLedgerPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);
  const [account, setAccount] = useState('');

  const { data: accounts } = useFrappeGetDocList<{ name: string; account_name?: string; account_number?: string }>('Account', {
    fields: ['name', 'account_name', 'account_number'],
    filters: [['is_group', '=', 0]],
    limit: 500,
    orderBy: { field: 'account_number', order: 'asc' },
  });

  return (
    <FinancialReportShell
      title="الأستاذ العام"
      subtitle="حركات حساب محدد مع تفاصيل القيود"
      reportName="General Ledger"
      filters={{ from_date: fromDate, to_date: toDate, account, company: undefined }}
      permDoctype="GL Entry"
      columns={COLUMNS}
      autoFetch={false}
      emptyMessage="اختر حساباً وحدد الفترة ثم اضغط عرض"
      filterUI={
        <>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">الحساب</label>
            <select value={account} onChange={(e) => setAccount(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm">
              <option value="">— اختر حساب —</option>
              {(accounts ?? []).map((a) => (<option key={a.name} value={a.name}>{a.account_number ?? ''} — {a.account_name ?? a.name}</option>))}
            </select>
          </div>
          <DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />
        </>
      }
    />
  );
}
