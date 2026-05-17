/** المبيعات حسب العميل — wraps ERPNext "Sales Register" grouped by customer. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'العميل', fieldname: 'customer' },
  { label: 'عدد الفواتير', fieldname: 'count', numeric: true },
  { label: 'إجمالي المبيعات', fieldname: 'total', numeric: true },
  { label: 'الخصومات', fieldname: 'discount', numeric: true },
  { label: 'الضرائب', fieldname: 'taxes', numeric: true },
  { label: 'الصافي', fieldname: 'net_total', numeric: true },
];

export default function ByCustomerPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="المبيعات حسب العميل"
      subtitle="ملخص المبيعات لكل عميل خلال الفترة"
      reportName="Customer Acquisition and Loyalty"
      filters={{ from_date: fromDate, to_date: toDate }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
