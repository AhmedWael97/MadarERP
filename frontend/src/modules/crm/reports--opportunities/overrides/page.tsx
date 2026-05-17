import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الحالة', fieldname: 'status' },
  { label: 'عدد الفرص', fieldname: 'count', numeric: true },
  { label: 'إجمالي القيمة', fieldname: 'total_value', numeric: true },
  { label: 'متوسط الاحتمال %', fieldname: 'avg_probability', numeric: true },
  { label: 'القيمة المرجحة', fieldname: 'weighted_value', numeric: true },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="تقرير الفرص"
      subtitle="حالة وقيمة الفرص البيعية"
      reportName="Opportunity Summary by Sales Stage"
      filters={{ from_date: from, to_date: to }}
      permDoctype="Opportunity"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
