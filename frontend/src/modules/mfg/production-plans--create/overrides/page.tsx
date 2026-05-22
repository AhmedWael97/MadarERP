import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';

export default function Page() {
  const navigate = useNavigate();
  const { createDoc, loading, error } = useFrappeCreateDoc();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [notes, setNotes] = useState('');

  // Production Plan in ERPNext uses get_items_from to populate items
  const [getItemsFrom, setGetItemsFrom] = useState('Sales Order');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDoc('Production Plan', {
        get_items_from: getItemsFrom,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        notes,
      });
      navigate('/mfg/production-plans');
    } catch (_) {
      // error shown below
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">خطة إنتاج جديدة</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">تخطيط الإنتاج المستقبلي وتحديد الكميات المتوقعة</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/mfg/production-plans')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-500"
        >
          رجوع
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border overflow-hidden">
          <div className="bg-gradient-to-l from-teal-600 to-cyan-700 px-6 py-3">
            <h3 className="text-sm font-bold text-white">بيانات الخطة</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                استيراد الطلبات من <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={getItemsFrom}
                onChange={(e) => setGetItemsFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              >
                <option value="Sales Order">أوامر المبيعات</option>
                <option value="Material Request">طلبات المواد</option>
                <option value="Product Bundle">مجموعة المنتجات</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                تاريخ البدء
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                تاريخ الانتهاء
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ملاحظات</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/mfg/production-plans')}
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
