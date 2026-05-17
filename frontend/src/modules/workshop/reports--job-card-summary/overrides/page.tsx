import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الفترة', fieldname: 'period' },
  { label: 'إجمالي البطاقات', fieldname: 'total', numeric: true },
  { label: 'مكتملة', fieldname: 'completed', numeric: true },
  { label: 'قيد العمل', fieldname: 'in_progress', numeric: true },
  { label: 'إجمالي الإيرادات', fieldname: 'total_revenue', numeric: true },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="ملخص أوامر الشغل"
      subtitle="إحصائيات بطاقات العمل خلال الفترة"
      reportName="Job Card Summary"
      filters={{ from_date: from, to_date: to }}
      permDoctype="Madaar Vehicle Job Card"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
