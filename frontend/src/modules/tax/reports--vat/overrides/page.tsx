import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الفترة', fieldname: 'period' },
  { label: 'مبيعات خاضعة', fieldname: 'taxable_sales', numeric: true },
  { label: 'ضريبة المخرجات', fieldname: 'output_tax', numeric: true },
  { label: 'مشتريات خاضعة', fieldname: 'taxable_purchases', numeric: true },
  { label: 'ضريبة المدخلات', fieldname: 'input_tax', numeric: true },
  { label: 'الصافي', fieldname: 'net_tax', numeric: true },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="تقرير ضريبة القيمة المضافة"
      subtitle="ضريبة المدخلات والمخرجات للفترة"
      reportName="VAT Audit Report"
      filters={{ from_date: from, to_date: to }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
