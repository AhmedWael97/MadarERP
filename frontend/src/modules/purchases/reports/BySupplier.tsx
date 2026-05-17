/** المشتريات حسب المورد — Supplier-wise Purchase Register. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'المورد', fieldname: 'supplier' },
  { label: 'عدد الفواتير', fieldname: 'count', numeric: true },
  { label: 'إجمالي المشتريات', fieldname: 'total', numeric: true },
  { label: 'الخصومات', fieldname: 'discount', numeric: true },
  { label: 'الضرائب', fieldname: 'taxes', numeric: true },
  { label: 'الصافي', fieldname: 'net_total', numeric: true },
];

export default function BySupplierPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="المشتريات حسب المورد"
      subtitle="ملخص المشتريات لكل مورد خلال الفترة"
      reportName="Purchase Register"
      filters={{ from_date: fromDate, to_date: toDate, group_by: 'Supplier' }}
      permDoctype="Purchase Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
