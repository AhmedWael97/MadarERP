/** المبيعات حسب العميل — wraps ERPNext "Sales Register" filtered by date. */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'رقم الفاتورة', fieldname: 'name' },
  { label: 'التاريخ', fieldname: 'posting_date' },
  { label: 'العميل', fieldname: 'customer_name' },
  { label: 'المجموعة', fieldname: 'customer_group' },
  { label: 'صافي المبيعات', fieldname: 'net_total', numeric: true },
  { label: 'الخصم', fieldname: 'discount_amount', numeric: true },
  { label: 'الضريبة', fieldname: 'total_taxes_and_charges', numeric: true },
  { label: 'الإجمالي النهائي', fieldname: 'grand_total', numeric: true },
  { label: 'المبلغ المتبقي', fieldname: 'outstanding_amount', numeric: true },
];

export default function ByCustomerPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="المبيعات حسب العميل"
      subtitle="سجل فواتير المبيعات للفترة المحددة"
      reportName="Sales Register"
      filters={{ from_date: fromDate, to_date: toDate }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
