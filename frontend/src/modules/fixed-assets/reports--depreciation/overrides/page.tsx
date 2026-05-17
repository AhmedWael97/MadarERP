import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الأصل', fieldname: 'asset_name' },
  { label: 'التصنيف', fieldname: 'asset_category' },
  { label: 'تاريخ الشراء', fieldname: 'purchase_date' },
  { label: 'تكلفة الشراء', fieldname: 'gross_purchase_amount', numeric: true },
  { label: 'الإهلاك السنوي', fieldname: 'depreciation_amount', numeric: true },
  { label: 'الإهلاك المتراكم', fieldname: 'accumulated_depreciation_amount', numeric: true },
  { label: 'القيمة الدفترية', fieldname: 'value_after_depreciation', numeric: true },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="جدول الإهلاك"
      subtitle="جدول إهلاك الأصول الثابتة"
      reportName="Fixed Asset Register"
      filters={{ from_date: from, to_date: to, status: 'In Location' }}
      permDoctype="Asset"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
