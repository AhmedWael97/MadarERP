/** المبيعات اليومية — uses ERPNext "Sales Register" with daily group_by. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'التاريخ', fieldname: 'posting_date' },
  { label: 'عدد الفواتير', fieldname: 'count', numeric: true },
  { label: 'إجمالي قبل الضريبة', fieldname: 'net_total', numeric: true },
  { label: 'الضرائب', fieldname: 'taxes', numeric: true },
  { label: 'الخصومات', fieldname: 'discount', numeric: true },
  { label: 'الإجمالي', fieldname: 'grand_total', numeric: true },
];

export default function DailySalesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(weekAgo);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="المبيعات اليومية"
      subtitle="ملخص المبيعات لكل يوم"
      reportName="Sales Register"
      filters={{ from_date: fromDate, to_date: toDate, group_by: 'Posting Date' }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
