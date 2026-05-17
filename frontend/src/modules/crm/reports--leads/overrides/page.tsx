import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'المصدر', fieldname: 'source' },
  { label: 'إجمالي العملاء', fieldname: 'count', numeric: true },
  { label: 'تم التحويل', fieldname: 'converted', numeric: true },
  { label: 'معدل التحويل %', fieldname: 'conversion_rate', numeric: true },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="تقرير العملاء المحتملين"
      subtitle="مصادر العملاء ومعدلات التحويل"
      reportName="Lead Details"
      filters={{ from_date: from, to_date: to }}
      permDoctype="Lead"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
