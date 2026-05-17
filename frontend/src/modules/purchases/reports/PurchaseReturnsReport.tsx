/** تقرير مرتجعات المشتريات — Purchase Register filtered to is_return=1. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'رقم المرتجع', fieldname: 'name' },
  { label: 'التاريخ', fieldname: 'posting_date' },
  { label: 'المورد', fieldname: 'supplier' },
  { label: 'الفاتورة الأصلية', fieldname: 'return_against' },
  { label: 'الإجمالي', fieldname: 'grand_total', numeric: true },
];

export default function PurchaseReturnsReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="مرتجعات المشتريات"
      subtitle="إجمالي مرتجعات المشتريات خلال الفترة"
      reportName="Purchase Register"
      filters={{ from_date: fromDate, to_date: toDate, is_return: 1 }}
      permDoctype="Purchase Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
