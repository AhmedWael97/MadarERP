import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';

export default function Page() {
  const navigate = useNavigate();
  const { createDoc, loading, error } = useFrappeCreateDoc();

  const [workOrder, setWorkOrder] = useState('');
  const [fgCompletedQty, setFgCompletedQty] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');

  const { data: workOrderList } = useFrappeGetDocList('Work Order', {
    fields: ['name', 'production_item', 'qty', 'status'],
    filters: [['docstatus', '=', 1]],
    limit: 200,
  });

  const { data: warehouseList } = useFrappeGetDocList('Warehouse', {
    fields: ['name'],
    filters: [['is_group', '=', 0]],
    limit: 200,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDoc('Stock Entry', {
        stock_entry_type: 'Manufacture',
        work_order: workOrder || undefined,
        fg_completed_qty: parseFloat(fgCompletedQty),
        to_warehouse: toWarehouse || undefined,
        posting_date: postingDate,
        remarks,
      });
      navigate('/mfg/finished-goods');
    } catch (_) {
      // error shown below
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">استلام إنتاج جديد</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">تسجيل المنتجات النهائية المستلمة من الإنتاج</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/mfg/finished-goods')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-500"
        >
          رجوع
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border overflow-hidden">
          <div className="bg-gradient-to-l from-emerald-600 to-green-700 px-6 py-3">
            <h3 className="text-sm font-bold text-white">بيانات الاستلام</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                أمر الإنتاج <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={workOrder}
                onChange={(e) => setWorkOrder(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              >
                <option value="">— اختر —</option>
                {workOrderList?.map((wo: any) => (
                  <option key={wo.name} value={wo.name}>{wo.name} — {wo.production_item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                الكمية المستلمة <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={fgCompletedQty}
                onChange={(e) => setFgCompletedQty(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                المخزن <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={toWarehouse}
                onChange={(e) => setToWarehouse(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              >
                <option value="">— اختر —</option>
                {warehouseList?.map((w: any) => (
                  <option key={w.name} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">التاريخ</label>
              <input
                type="date"
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ملاحظات</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/mfg/finished-goods')}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading ? 'جارٍ الحفظ...' : 'استلام'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
            {(error as any)?.message || 'حدث خطأ أثناء الحفظ'}
          </div>
        )}
      </form>
    </div>
  );
}
