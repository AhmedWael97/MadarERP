import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface CurrencyDoc {
  name?: string;
  currency_name?: string;
  symbol?: string;
  fraction?: string;
  smallest_currency_fraction_value?: number;
  enabled?: 0 | 1;
}

const INPUT =
  'w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-all';

export default function CurrencyFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';

  return (
    <RequirePerm doctype="Currency" action="read">
      <PageShell
        title={isEdit ? `تعديل العملة: ${id ?? ''}` : 'عملة جديدة'}
        subtitle="إعدادات العملة"
        actions={
          <button type="button" onClick={() => navigate('/treasury/currencies')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/treasury/currencies')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [doc, setDoc] = useState<CurrencyDoc>({ enabled: 1, smallest_currency_fraction_value: 1 });
  const { data: existing } = useFrappeGetDoc<CurrencyDoc>('Currency', isEdit ? name : undefined, isEdit && name ? `cur:${name}` : null);
  useEffect(() => { if (existing) setDoc((d) => ({ ...d, ...existing })); }, [existing]);

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      currency_name: doc.currency_name,
      symbol: doc.symbol,
      fraction: doc.fraction,
      smallest_currency_fraction_value: doc.smallest_currency_fraction_value,
      enabled: doc.enabled ?? 1,
    };
    try {
      if (isEdit && name) {
        await updateDoc('Currency', name, payload);
        toast.success('تم التحديث');
      } else {
        await createDoc('Currency', payload);
        toast.success('تم الحفظ');
      }
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-l from-violet-600 to-purple-700">
          <h3 className="text-base font-bold text-white">بيانات العملة</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">اسم العملة</label>
            <input required value={doc.currency_name ?? ''} onChange={(e) => setDoc((d) => ({ ...d, currency_name: e.target.value }))} className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">الرمز</label>
            <input value={doc.symbol ?? ''} onChange={(e) => setDoc((d) => ({ ...d, symbol: e.target.value }))} className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">اسم الكسر</label>
            <input value={doc.fraction ?? ''} onChange={(e) => setDoc((d) => ({ ...d, fraction: e.target.value }))} className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">أصغر كسر</label>
            <input type="number" min={1} value={doc.smallest_currency_fraction_value ?? 1} onChange={(e) => setDoc((d) => ({ ...d, smallest_currency_fraction_value: Number(e.target.value) || 1 }))} className={INPUT} />
          </div>
          <label className="inline-flex items-center cursor-pointer gap-2 md:col-span-2">
            <input type="checkbox" checked={!!doc.enabled} onChange={(e) => setDoc((d) => ({ ...d, enabled: e.target.checked ? 1 : 0 }))} className="w-4 h-4 rounded border-slate-300 text-violet-500 focus:ring-violet-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">مفعلة</span>
          </label>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onDone} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 rounded-xl">إلغاء</button>
        <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl">{saving ? '...' : (isEdit ? 'حفظ التغييرات' : 'حفظ العملة')}</button>
      </div>
    </form>
  );
}
