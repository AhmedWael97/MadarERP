/** المشتريات حسب المنتج — Item-wise Purchase Register. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الصنف', fieldname: 'item_code' },
  { label: 'اسم الصنف', fieldname: 'item_name' },
  { label: 'الكمية', fieldname: 'qty', numeric: true },
  { label: 'الوحدة', fieldname: 'stock_uom' },
  { label: 'إجمالي المشتريات', fieldname: 'amount', numeric: true },
];

export default function ByProductPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="المشتريات حسب المنتج"
      subtitle="حجم المشتريات لكل صنف خلال الفترة"
      reportName="Item-wise Purchase Register"
      filters={{ from_date: fromDate, to_date: toDate }}
      permDoctype="Purchase Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
