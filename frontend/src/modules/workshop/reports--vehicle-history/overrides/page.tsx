import { useState } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { FinancialReportShell, type ReportColumn } from '@/modules/accounting/FinancialReportShell';

const COLUMNS: ReportColumn[] = [
  { label: 'التاريخ', fieldname: 'posting_date' },
  { label: 'البطاقة', fieldname: 'name' },
  { label: 'نوع الخدمة', fieldname: 'service_type' },
  { label: 'الفني', fieldname: 'technician' },
  { label: 'العداد', fieldname: 'odometer', numeric: true },
  { label: 'التكلفة', fieldname: 'total_amount', numeric: true },
];

export default function Page() {
  const [vehicle, setVehicle] = useState('');
  const { data: vehicles } = useFrappeGetDocList<{ name: string }>('Madaar Vehicle', { fields: ['name'], limit: 200 });
  return (
    <FinancialReportShell
      title="سجل خدمة المركبات"
      subtitle="تاريخ صيانة وخدمة كل مركبة"
      reportName="Vehicle Service History"
      filters={{ vehicle }}
      permDoctype="Madaar Vehicle Job Card"
      columns={COLUMNS}
      autoFetch={false}
      emptyMessage="اختر مركبة لعرض سجلها"
      filterUI={
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">المركبة</label>
          <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm">
            <option value="">— اختر مركبة —</option>
            {(vehicles ?? []).map((v) => (<option key={v.name} value={v.name}>{v.name}</option>))}
          </select>
        </div>
      }
    />
  );
}
