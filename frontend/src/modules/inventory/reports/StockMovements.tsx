/** حركات المخزون — ERPNext "Stock Ledger". */
import { useState } from 'react';
import { FinancialReportShell, DateRangeFilters, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'التاريخ', fieldname: 'posting_date' },
  { label: 'الصنف', fieldname: 'item_code' },
  { label: 'المخزن', fieldname: 'warehouse' },
  { label: 'نوع الحركة', fieldname: 'voucher_type' },
  { label: 'رقم السند', fieldname: 'voucher_no' },
  { label: 'الكمية', fieldname: 'actual_qty', numeric: true },
  { label: 'الرصيد', fieldname: 'qty_after_transaction', numeric: true },
];

export default function StockMovementsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="حركات المخزون"
      subtitle="جميع حركات الدخول والخروج"
      reportName="Stock Ledger"
      filters={{ from_date: fromDate, to_date: toDate }}
      permDoctype="Stock Entry"
      columns={COLUMNS}
      filterUI={<DateRangeFilters fromDate={fromDate} toDate={toDate} onFromDate={setFromDate} onToDate={setToDate} />}
    />
  );
}
