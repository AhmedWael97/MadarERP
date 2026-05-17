/** تقرير أعمار الديون — wraps ERPNext "Accounts Receivable" (with party_type switch).
 *  Switching to Supplier flips the report to "Accounts Payable" (الدائنة). */
import { useState } from 'react';
import { FinancialReportShell, type ReportColumn } from '../FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'العميل/المورد', fieldname: 'party' },
  { label: 'الكود', fieldname: 'party_account' },
  { label: '0-30', fieldname: 'range1', numeric: true },
  { label: '31-60', fieldname: 'range2', numeric: true },
  { label: '61-90', fieldname: 'range3', numeric: true },
  { label: '91-120', fieldname: 'range4', numeric: true },
  { label: '120+', fieldname: 'range5', numeric: true },
  { label: 'الإجمالي', fieldname: 'total_due', numeric: true },
];

export default function AgingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [reportDate, setReportDate] = useState(today);
  const [partyType, setPartyType] = useState<'Customer' | 'Supplier'>('Customer');

  return (
    <FinancialReportShell
      title="تقرير أعمار الديون"
      subtitle={partyType === 'Customer' ? 'أعمار ديون العملاء (المدينة)' : 'أعمار ديون الموردين (الدائنة)'}
      reportName={partyType === 'Customer' ? 'Accounts Receivable' : 'Accounts Payable'}
      filters={{
        report_date: reportDate,
        ageing_based_on: 'Posting Date',
        range1: 30,
        range2: 60,
        range3: 90,
        range4: 120,
        party_type: partyType,
      }}
      permDoctype="GL Entry"
      columns={COLUMNS}
      filterUI={
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">النوع</label>
            <select value={partyType} onChange={(e) => setPartyType(e.target.value as 'Customer' | 'Supplier')} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm">
              <option value="Customer">عملاء (مدينة)</option>
              <option value="Supplier">موردين (دائنة)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">حتى تاريخ</label>
            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm" />
          </div>
        </>
      }
    />
  );
}
