import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';

export default function Page() {
  const navigate = useNavigate();
  const { createDoc, loading, error } = useFrappeCreateDoc();

  const [workOrder, setWorkOrder] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [qty, setQty] = useState('');
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');

  const { data: workOrderList } = useFrappeGetDocList('Work Order', {
    fields: ['name', 'production_item', 'qty'],
    filters: [['docstatus', '=', 1]],
    limit: 200,
  });

  const { data: itemList } = useFrappeGetDocList('Item', {
    fields: ['name', 'item_name'],
    filters: [['disabled', '=', 0]],
    limit: 500,
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
        stock_entry_type: 'Material Issue',
        work_order: workOrder || undefined,
        posting_date: postingDate,
        remarks: reason,
        items: itemCode
          ? [
              {
                item_code: itemCode,
                qty: parseFloat(qty),
                s_warehouse: fromWarehouse || undefined,
              },
            ]
          : [],
      });
      navigate('/mfg/scrap');
    } catch (_) {
      // error shown below
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">تسجيل هالك جديد</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">تسجيل الهالك والمخلفات الناتجة من الإنتاج</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/mfg/scrap')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-500"
        >
          رجوع
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border overflow-hidden">
          <div className="bg-gradient-to-l from-red-600 to-rose-700 px-6 py-3">
            <h3 className="text-sm font-bold text-white">بيانات الهالك</h3>
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
                المنتج/المادة <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              >
                <option value="">— اختر —</option>
                {itemList?.map((i: any) => (
                  <option key={i.name} value={i.name}>{i.item_name || i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                الكمية <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المخزن</label>
              <select
                value={fromWarehouse}
                onChange={(e) => setFromWarehouse(e.target.value)}
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
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">السبب</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/mfg/scrap')}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-500 disabled:opacity-60"
            >
              {loading ? 'جارٍ الحفظ...' : 'تسجيل'}
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
