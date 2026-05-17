import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الكود', fieldname: 'name' },
  { label: 'الأصل', fieldname: 'asset_name' },
  { label: 'التصنيف', fieldname: 'asset_category' },
  { label: 'الموقع', fieldname: 'location' },
  { label: 'الحارس', fieldname: 'custodian' },
  { label: 'تاريخ الشراء', fieldname: 'purchase_date' },
  { label: 'تكلفة الشراء', fieldname: 'gross_purchase_amount', numeric: true },
  { label: 'القيمة الدفترية', fieldname: 'value_after_depreciation', numeric: true },
  { label: 'الحالة', fieldname: 'status' },
];

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  return (
    <FinancialReportShell
      title="سجل الأصول الثابتة"
      subtitle="جميع الأصول الثابتة وحالاتها"
      reportName="Fixed Asset Register"
      filters={{ from_date: from, to_date: to }}
      permDoctype="Asset"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={from} toDate={to} onFromDate={setFrom} onToDate={setTo} />}
    />
  );
}
