/** أداء المنتجات — sales + purchases + stock by item. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الكود', fieldname: 'item_code' },
  { label: 'الصنف', fieldname: 'item_name' },
  { label: 'مبيعات', fieldname: 'sales_amount', numeric: true },
  { label: 'مشتريات', fieldname: 'purchase_amount', numeric: true },
  { label: 'الكمية المباعة', fieldname: 'sales_qty', numeric: true },
  { label: 'الكمية المشتراة', fieldname: 'purchase_qty', numeric: true },
];

export default function ProductPerformancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="أداء المنتجات"
      subtitle="مبيعات ومشتريات لكل صنف"
      reportName="Item Prices"
      filters={{ from_date: fromDate, to_date: toDate }}
      permDoctype="Item"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
