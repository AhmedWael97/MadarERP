/** المبيعات حسب المنتج — wraps ERPNext "Item-wise Sales Register". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'رقم الفاتورة', fieldname: 'parent' },
  { label: 'التاريخ', fieldname: 'posting_date' },
  { label: 'العميل', fieldname: 'customer_name' },
  { label: 'كود الصنف', fieldname: 'item_code' },
  { label: 'اسم الصنف', fieldname: 'item_name' },
  { label: 'الكمية', fieldname: 'qty', numeric: true },
  { label: 'الوحدة', fieldname: 'stock_uom' },
  { label: 'سعر الوحدة', fieldname: 'base_rate', numeric: true },
  { label: 'إجمالي المبيعات', fieldname: 'base_net_amount', numeric: true },
];

export default function ByProductPage() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="المبيعات حسب المنتج"
      subtitle="حجم المبيعات لكل صنف خلال الفترة"
      reportName="Item-wise Sales Register"
      filters={{ from_date: fromDate, to_date: toDate }}
      permDoctype="Sales Invoice"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
