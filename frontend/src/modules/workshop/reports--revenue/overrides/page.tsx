import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الفترة', fieldname: 'period' },
  { label: 'عدد البطاقات', fieldname: 'count', numeric: true },
  { label: 'إيرادات قطع الغيار', fieldname: 'parts_revenue', numeric: true },
  { label: 'إيرادات العمالة', fieldname: 'labor_revenue', numeric: true },
  { label: 'الإجمالي', fieldname: 'total_revenue', numeric: true },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="تقرير إيرادات الورشة"
      subtitle="إيرادات الورشة من العمالة والقطع"
      reportName="Sales Register"
      filters={{ from_date: from, to_date: to, source: 'Workshop' }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
