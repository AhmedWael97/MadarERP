/** تقييم المخزون — Stock Balance grouped with valuation columns. */
import { useState } from 'react';
import { FinancialReportShell, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الكود', fieldname: 'item_code' },
  { label: 'الصنف', fieldname: 'item_name' },
  { label: 'الكمية', fieldname: 'bal_qty', numeric: true },
  { label: 'متوسط التكلفة', fieldname: 'val_rate', numeric: true },
  { label: 'إجمالي القيمة', fieldname: 'bal_val', numeric: true },
];

export default function StockValuationPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [toDate, setToDate] = useState(today);
  return (
    <FinancialReportShell
      title="تقييم المخزون"
      subtitle="القيمة الدفترية للمخزون"
      reportName="Stock Balance"
      filters={{ to_date: toDate, group_by: 'Item' }}
      permDoctype="Stock Entry"
      columns={COLUMNS}
      filterUI={
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">حتى تاريخ</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm" />
        </div>
      }
    />
  );
}
