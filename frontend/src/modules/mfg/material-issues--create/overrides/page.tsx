import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';

type IssueItem = { item_code: string; qty: string; s_warehouse: string };

export default function Page() {
  const navigate = useNavigate();
  const { createDoc, loading, error } = useFrappeCreateDoc();

  const [workOrder, setWorkOrder] = useState('');
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<IssueItem[]>([{ item_code: '', qty: '1', s_warehouse: '' }]);

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

  const addItem = () => setItems([...items, { item_code: '', qty: '1', s_warehouse: fromWarehouse }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof IssueItem, val: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: val };
    setItems(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDoc('Stock Entry', {
        stock_entry_type: 'Material Issue',
        work_order: workOrder || undefined,
        from_warehouse: fromWarehouse || undefined,
        posting_date: postingDate,
        items: items
          .filter((r) => r.item_code)
          .map((r) => ({
            item_code: r.item_code,
            qty: parseFloat(r.qty),
            s_warehouse: r.s_warehouse || fromWarehouse || undefined,
          })),
      });
      navigate('/mfg/material-issues');
    } catch (_) {
      // error shown below
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">صرف مواد جديد</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">صرف المواد الخام لأمر إنتاج</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/mfg/material-issues')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-500"
        >
          رجوع
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header info */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border overflow-hidden">
          <div className="bg-gradient-to-l from-blue-600 to-indigo-700 px-6 py-3">
            <h3 className="text-sm font-bold text-white">بيانات الصرف</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                المخزن <span className="text-red-500">*</span>
              </label>
              <select
                required
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
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border overflow-hidden">
          <div className="bg-gradient-to-l from-teal-600 to-cyan-700 px-6 py-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">المواد المصروفة</h3>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-white bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30"
            >
              + إضافة مادة
            </button>
          </div>
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
              <span className="col-span-5">المادة</span>
              <span className="col-span-3">الكمية المصروفة</span>
              <span className="col-span-3">المخزن</span>
              <span className="col-span-1"></span>
            </div>
            {items.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <select
                  value={row.item_code}
                  onChange={(e) => updateItem(idx, 'item_code', e.target.value)}
                  className="col-span-5 px-2 py-1.5 text-xs border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
                >
                  <option value="">— مادة —</option>
                  {itemList?.map((i: any) => (
                    <option key={i.name} value={i.name}>{i.item_name || i.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="الكمية"
                  value={row.qty}
                  onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                  className="col-span-3 px-2 py-1.5 text-xs border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
                />
                <select
                  value={row.s_warehouse || fromWarehouse}
                  onChange={(e) => updateItem(idx, 's_warehouse', e.target.value)}
                  className="col-span-3 px-2 py-1.5 text-xs border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
                >
                  <option value="">— مخزن —</option>
                  {warehouseList?.map((w: any) => (
                    <option key={w.name} value={w.name}>{w.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="col-span-1 text-red-400 hover:text-red-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
            {(error as any)?.message || 'حدث خطأ أثناء الحفظ'}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/mfg/material-issues')}
            className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-500 disabled:opacity-60"
          >
            {loading ? 'جارٍ الحفظ...' : 'صرف'}
          </button>
        </div>
      </form>
    </div>
  );
}
