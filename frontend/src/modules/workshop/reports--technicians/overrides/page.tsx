import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الفني', fieldname: 'technician_name' },
  { label: 'عدد البطاقات', fieldname: 'job_count', numeric: true },
  { label: 'ساعات العمل', fieldname: 'total_hours', numeric: true },
  { label: 'الإيرادات', fieldname: 'revenue', numeric: true },
  { label: 'متوسط الساعة', fieldname: 'avg_hour_rate', numeric: true },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="أداء الفنيين"
      subtitle="إنتاجية وكفاءة فنيي الورشة"
      reportName="Technician Performance"
      filters={{ from_date: from, to_date: to }}
      permDoctype="Madaar Vehicle Job Card"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
