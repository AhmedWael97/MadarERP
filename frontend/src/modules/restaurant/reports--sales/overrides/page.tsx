import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الفترة', fieldname: 'period' },
  { label: 'عدد الطلبات', fieldname: 'count', numeric: true },
  { label: 'إجمالي البيع', fieldname: 'gross', numeric: true },
  { label: 'الخصومات', fieldname: 'discount', numeric: true },
  { label: 'الضرائب', fieldname: 'taxes', numeric: true },
  { label: 'الصافي', fieldname: 'net_total', numeric: true },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="تقارير المبيعات"
      subtitle="إجمالي مبيعات المطعم خلال الفترة"
      reportName="Sales Register"
      filters={{ from_date: from, to_date: to, source: 'Restaurant', group_by: 'Posting Date' }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
