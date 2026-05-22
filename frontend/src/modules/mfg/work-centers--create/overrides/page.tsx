import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc } from 'frappe-react-sdk';

export default function Page() {
  const navigate = useNavigate();
  const { createDoc, loading, error } = useFrappeCreateDoc();

  const [workstationName, setWorkstationName] = useState('');
  const [description, setDescription] = useState('');
  const [hourRate, setHourRate] = useState('0');
  const [productionCapacity, setProductionCapacity] = useState('1');
  const [defaultSetupTime, setDefaultSetupTime] = useState('0');
  const [defaultLeadTime, setDefaultLeadTime] = useState('0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDoc('Workstation', {
        workstation_name: workstationName,
        description,
        hour_rate: parseFloat(hourRate),
        production_capacity: parseFloat(productionCapacity),
        default_setup_time: parseFloat(defaultSetupTime),
        default_lead_time: parseFloat(defaultLeadTime),
      });
      navigate('/mfg/work-centers');
    } catch (_) {
      // error shown below
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">إضافة مركز عمل جديد</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">إعداد الماكينة أو القسم الإنتاجي</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/mfg/work-centers')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-500"
        >
          رجوع
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/30 overflow-hidden">
          <div className="bg-gradient-to-l from-teal-600 to-cyan-700 px-6 py-3">
            <h3 className="text-sm font-bold text-white">بيانات مركز العمل</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                اسم مركز العمل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={workstationName}
                onChange={(e) => setWorkstationName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                التكلفة/ساعة
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={hourRate}
                onChange={(e) => setHourRate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                السعة/ساعة
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={productionCapacity}
                onChange={(e) => setProductionCapacity(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                وقت الإعداد (دقيقة)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={defaultSetupTime}
                onChange={(e) => setDefaultSetupTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                وقت التشغيل (دقيقة)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={defaultLeadTime}
                onChange={(e) => setDefaultLeadTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-700/50 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">وصف</label>
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
              onClick={() => navigate('/mfg/work-centers')}
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
