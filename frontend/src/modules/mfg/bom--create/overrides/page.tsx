import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';

type BOMItem = { item_code: string; qty: string; scrap: string };

export default function Page() {
  const navigate = useNavigate();
  const { createDoc, loading, error } = useFrappeCreateDoc();

  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<BOMItem[]>([{ item_code: '', qty: '1', scrap: '0' }]);

  const { data: itemList } = useFrappeGetDocList('Item', {
    fields: ['name', 'item_name'],
    filters: [['disabled', '=', 0]],
    limit: 500,
  });

  const addItem = () => setItems([...items, { item_code: '', qty: '1', scrap: '0' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof BOMItem, val: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: val };
    setItems(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDoc('BOM', {
        item,
        quantity: parseFloat(quantity),
        is_default: isDefault ? 1 : 0,
        is_active: isActive ? 1 : 0,
        remarks,
        items: items
          .filter((r) => r.item_code)
          .map((r) => ({
            item_code: r.item_code,
            qty: parseFloat(r.qty),
            scrap: parseFloat(r.scrap),
          })),
      });
      navigate('/mfg/bom');
    } catch (_) {
      // error shown below
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">إنشاء قائمة مكونات جديدة</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">تحديد المواد الخام والعمليات لتصنيع المنتج</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/mfg/bom')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-500"
        >
          رجوع
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/30 overflow-hidden">
          <div className="bg-gradient-to-l from-teal-600 to-cyan-700 px-6 py-3">
            <h3 className="text-sm font-bold text-white">بيانات أساسية</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                المنتج <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              >
                <option value="">— اختر المنتج —</option>
                {itemList?.map((i: any) => (
                  <option key={i.name} value={i.name}>{i.item_name || i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                الكمية المنتجة
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="flex items-end gap-6 pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">BOM افتراضي</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">نشط</span>
              </label>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ملاحظات</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* BOM Items */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/30 overflow-hidden">
          <div className="bg-gradient-to-l from-blue-600 to-indigo-700 px-6 py-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">المكونات (المواد الخام)</h3>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-white bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30"
            >
              + إضافة مكون
            </button>
          </div>
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
              <span className="col-span-6">المادة</span>
              <span className="col-span-3">الكمية</span>
              <span className="col-span-2">هالك %</span>
              <span className="col-span-1"></span>
            </div>
            {items.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <select
                  value={row.item_code}
                  onChange={(e) => updateItem(idx, 'item_code', e.target.value)}
                  className="col-span-6 px-2 py-1.5 text-xs border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
                >
                  <option value="">— مادة —</option>
                  {itemList?.map((i: any) => (
                    <option key={i.name} value={i.name}>{i.item_name || i.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="الكمية"
                  value={row.qty}
                  onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                  className="col-span-3 px-2 py-1.5 text-xs border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="هالك %"
                  value={row.scrap}
                  onChange={(e) => updateItem(idx, 'scrap', e.target.value)}
                  className="col-span-2 px-2 py-1.5 text-xs border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
                />
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

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
            {(error as any)?.message || 'حدث خطأ أثناء الحفظ'}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/mfg/bom')}
            className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
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
      </form>
    </div>
  );
}
