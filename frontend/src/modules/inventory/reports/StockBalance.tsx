/** أرصدة المخزون — ERPNext "Stock Balance". */
import { useState } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { FinancialReportShell, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'الكود', fieldname: 'item_code' },
  { label: 'الصنف', fieldname: 'item_name' },
  { label: 'المخزن', fieldname: 'warehouse' },
  { label: 'الوحدة', fieldname: 'stock_uom' },
  { label: 'الرصيد', fieldname: 'bal_qty', numeric: true },
  { label: 'قيمة الرصيد', fieldname: 'bal_val', numeric: true },
];

export default function StockBalancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [toDate, setToDate] = useState(today);
  const [warehouse, setWarehouse] = useState('');
  const { data: warehouses } = useFrappeGetDocList<{ name: string }>('Warehouse', { fields: ['name'], limit: 200 });
  return (
    <FinancialReportShell
      title="أرصدة المخزون"
      subtitle="رصيد كل صنف في كل مخزن"
      reportName="Stock Balance"
      filters={{ to_date: toDate, warehouse }}
      permDoctype="Stock Entry"
      columns={COLUMNS}
      filterUI={
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">المخزن</label>
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm">
              <option value="">كل المخازن</option>
              {(warehouses ?? []).map((w) => (<option key={w.name} value={w.name}>{w.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">حتى تاريخ</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm" />
          </div>
        </>
      }
    />
  );
}
