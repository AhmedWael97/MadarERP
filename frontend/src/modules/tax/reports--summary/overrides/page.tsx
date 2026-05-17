import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الشهر', fieldname: 'month' },
  { label: 'ضريبة القيمة المضافة', fieldname: 'vat', numeric: true },
  { label: 'ضريبة الدخل', fieldname: 'income_tax', numeric: true },
  { label: 'الضريبة المستقطعة', fieldname: 'withholding_tax', numeric: true },
  { label: 'إجمالي الضرائب', fieldname: 'total_tax', numeric: true },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="ملخص الضرائب السنوي"
      subtitle="إجمالي الضرائب المستحقة والمدفوعة"
      reportName="VAT Audit Report"
      filters={{ from_date: from, to_date: to, group_by: 'Month' }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
