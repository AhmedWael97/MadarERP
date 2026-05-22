import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';

export default function Page() {
  const navigate = useNavigate();
  const { createDoc, loading, error } = useFrappeCreateDoc();

  const [productionItem, setProductionItem] = useState('');
  const [bomNo, setBomNo] = useState('');
  const [qty, setQty] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [wipWarehouse, setWipWarehouse] = useState('');
  const [fgWarehouse, setFgWarehouse] = useState('');
  const [description, setDescription] = useState('');

  const { data: itemList } = useFrappeGetDocList('Item', {
    fields: ['name', 'item_name'],
    filters: [['disabled', '=', 0]],
    limit: 500,
  });

  const { data: bomList } = useFrappeGetDocList('BOM', {
    fields: ['name', 'item', 'item_name'],
    filters: productionItem ? [['item', '=', productionItem], ['is_active', '=', 1]] : [['is_active', '=', 1]],
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
      await createDoc('Work Order', {
        production_item: productionItem,
        bom_no: bomNo,
        qty: parseFloat(qty),
        planned_start_date: plannedStartDate || undefined,
        planned_end_date: plannedEndDate || undefined,
        wip_warehouse: wipWarehouse || undefined,
        fg_warehouse: fgWarehouse || undefined,
        description,
      });
      navigate('/mfg/work-orders');
    } catch (_) {
      // error shown below
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">إنشاء أمر إنتاج جديد</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">تحديد المنتج والكمية والجدول الزمني</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/mfg/work-orders')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-500"
        >
          رجوع
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/30 overflow-hidden">
          <div className="bg-gradient-to-l from-teal-600 to-cyan-700 px-6 py-3">
            <h3 className="text-sm font-bold text-white">بيانات أمر الإنتاج</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                المنتج <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={productionItem}
                onChange={(e) => { setProductionItem(e.target.value); setBomNo(''); }}
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
                قائمة المكونات (BOM)
              </label>
              <select
                value={bomNo}
                onChange={(e) => setBomNo(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              >
                <option value="">— اختر —</option>
                {bomList?.map((b: any) => (
                  <option key={b.name} value={b.name}>{b.name} — {b.item_name || b.item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                الكمية المخطط إنتاجها <span className="text-red-500">*</span>
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
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                مخزن المواد الخام
              </label>
              <select
                value={wipWarehouse}
                onChange={(e) => setWipWarehouse(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              >
                <option value="">— اختر —</option>
                {warehouseList?.map((w: any) => (
                  <option key={w.name} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                مخزن المنتج النهائي
              </label>
              <select
                value={fgWarehouse}
                onChange={(e) => setFgWarehouse(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              >
                <option value="">— اختر —</option>
                {warehouseList?.map((w: any) => (
                  <option key={w.name} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                تاريخ البداية
              </label>
              <input
                type="date"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                تاريخ النهاية
              </label>
              <input
                type="date"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ملاحظات</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/mfg/work-orders')}
              className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-500 disabled:opacity-60"
            >
              {loading ? 'جارٍ الحفظ...' : 'حفظ'}
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
