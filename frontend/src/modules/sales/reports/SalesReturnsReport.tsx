/** تقرير مرتجعات المبيعات — Sales Register filtered to is_return=1. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'رقم المرتجع', fieldname: 'name' },
  { label: 'التاريخ', fieldname: 'posting_date' },
  { label: 'العميل', fieldname: 'customer' },
  { label: 'الفاتورة الأصلية', fieldname: 'return_against' },
  { label: 'الإجمالي', fieldname: 'grand_total', numeric: true },
];

export default function SalesReturnsReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="تقرير مرتجعات المبيعات"
      subtitle="إجمالي مرتجعات المبيعات خلال الفترة"
      reportName="Sales Register"
      filters={{ from_date: fromDate, to_date: toDate, is_return: 1 }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
