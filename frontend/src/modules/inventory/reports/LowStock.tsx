/** تنبيه نقص المخزون — wraps ERPNext "Stock Projected Qty" filtered to below-reorder. */
import { useState } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { FinancialReportShell, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الكود', fieldname: 'item_code' },
  { label: 'الصنف', fieldname: 'item_name' },
  { label: 'الوحدة', fieldname: 'stock_uom' },
  { label: 'الرصيد الحالي', fieldname: 'projected_qty', numeric: true },
  { label: 'حد إعادة الطلب', fieldname: 'safety_stock', numeric: true },
  { label: 'النقص', fieldname: 'shortage', numeric: true },
];

export default function LowStockPage() {
  const [warehouse, setWarehouse] = useState('');
  const { data: warehouses } = useFrappeGetDocList<{ name: string }>('Warehouse', { fields: ['name'], limit: 200 });
  return (
    <FinancialReportShell
      title="تنبيه نقص المخزون"
      subtitle="منتجات تحت حد إعادة الطلب"
      reportName="Stock Projected Qty"
      filters={{ warehouse, group_by: 'Item' }}
      permDoctype="Item"
      columns={COLUMNS}
      filterUI={
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">المخزن</label>
          <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm">
            <option value="">كل المخازن</option>
            {(warehouses ?? []).map((w) => (<option key={w.name} value={w.name}>{w.name}</option>))}
          </select>
        </div>
      }
    />
  );
}
