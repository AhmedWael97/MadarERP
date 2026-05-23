import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { localDate } from '@/lib/formatters/dates';

interface RateDoc {
  name?: string;
  from_currency?: string;
  to_currency?: string;
  rate?: number;
  effective_from?: string;
  effective_to?: string;
}

const INPUT =
  'w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-all';

export default function ExchangeRateFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Currency Rate Period" action="read">
      <PageShell
        title={isEdit ? `تعديل سعر الصرف: ${id ?? ''}` : 'سعر صرف جديد'}
        subtitle="فترة سعر الصرف"
        actions={
          <button type="button" onClick={() => navigate('/treasury/exchange-rates')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/treasury/exchange-rates')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [doc, setDoc] = useState<RateDoc>({ effective_from: localDate(), rate: 1 });
  const { data: existing } = useFrappeGetDoc<RateDoc>('Madaar Currency Rate Period', isEdit ? name : undefined, isEdit && name ? `fx:${name}` : null);
  useEffect(() => { if (existing) setDoc((d) => ({ ...d, ...existing })); }, [existing]);

  const { data: currencies } = useFrappeGetDocList<{ name: string }>('Currency', { fields: ['name'], filters: [['enabled', '=', 1]], limit: 200 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      from_currency: doc.from_currency,
      to_currency: doc.to_currency,
      rate: doc.rate,
      effective_from: doc.effective_from,
      effective_to: doc.effective_to || undefined,
    };
    try {
      if (isEdit && name) {
        await updateDoc('Madaar Currency Rate Period', name, payload);
        toast.success('تم التحديث');
      } else {
        await createDoc('Madaar Currency Rate Period', payload);
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
          <h3 className="text-base font-bold text-white">بيانات سعر الصرف</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">من عملة</label>
            <select required value={doc.from_currency ?? ''} onChange={(e) => setDoc((d) => ({ ...d, from_currency: e.target.value }))} className={INPUT}>
              <option value="">اختر</option>
              {(currencies ?? []).map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">إلى عملة</label>
            <select required value={doc.to_currency ?? ''} onChange={(e) => setDoc((d) => ({ ...d, to_currency: e.target.value }))} className={INPUT}>
              <option value="">اختر</option>
              {(currencies ?? []).map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">السعر</label>
            <input type="number" step="0.000001" min={0} required value={doc.rate ?? 1} onChange={(e) => setDoc((d) => ({ ...d, rate: Number(e.target.value) }))} className={INPUT} dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">يبدأ من</label>
            <input type="date" required value={doc.effective_from ?? ''} onChange={(e) => setDoc((d) => ({ ...d, effective_from: e.target.value }))} className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">حتى (اختياري)</label>
            <input type="date" value={doc.effective_to ?? ''} onChange={(e) => setDoc((d) => ({ ...d, effective_to: e.target.value }))} className={INPUT} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onDone} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 rounded-xl">إلغاء</button>
        <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl">{saving ? '...' : (isEdit ? 'حفظ التغييرات' : 'حفظ السعر')}</button>
      </div>
    </form>
  );
}
