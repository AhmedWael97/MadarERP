import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'المندوب', fieldname: 'sales_person' },
  { label: 'عملاء جدد', fieldname: 'leads', numeric: true },
  { label: 'فرص', fieldname: 'opportunities', numeric: true },
  { label: 'مبيعات', fieldname: 'sales', numeric: true },
  { label: 'إجمالي القيمة', fieldname: 'total_value', numeric: true },
  { label: 'معدل التحويل %', fieldname: 'conversion_rate', numeric: true },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="أداء فريق المبيعات"
      subtitle="إنتاجية فريق المبيعات حسب المندوب"
      reportName="Sales Person-wise Transaction Summary"
      filters={{ from_date: from, to_date: to }}
      permDoctype="Opportunity"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
