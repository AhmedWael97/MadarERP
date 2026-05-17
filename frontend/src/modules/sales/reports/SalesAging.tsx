/** أعمار ديون المبيعات — wraps ERPNext "Accounts Receivable" filtered to AR. */
import { useState } from 'react';
import { FinancialReportShell, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'العميل', fieldname: 'party' },
  { label: '0-30', fieldname: 'range1', numeric: true },
  { label: '31-60', fieldname: 'range2', numeric: true },
  { label: '61-90', fieldname: 'range3', numeric: true },
  { label: '91-120', fieldname: 'range4', numeric: true },
  { label: '120+', fieldname: 'range5', numeric: true },
  { label: 'الإجمالي', fieldname: 'total_due', numeric: true },
];

export default function SalesAgingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [reportDate, setReportDate] = useState(today);
  return (
    <FinancialReportShell
      title="أعمار ديون المبيعات"
      subtitle="أعمار الديون المستحقة على العملاء"
      reportName="Accounts Receivable"
      filters={{ report_date: reportDate, ageing_based_on: 'Posting Date', range1: 30, range2: 60, range3: 90, range4: 120, party_type: 'Customer' }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">حتى تاريخ</label>
          <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm" />
        </div>
      }
    />
  );
}
