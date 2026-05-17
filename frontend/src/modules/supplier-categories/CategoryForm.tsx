/** Supplier Category form — mirrors customer-categories CategoryForm. */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Check, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface CategoryDoc {
  name?: string;
  name_ar?: string;
  name_en?: string;
  discount_percentage?: number;
  is_active?: 0 | 1;
}

export default function SupplierCategoryFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Supplier Category" action="read">
      <PageShell
        title={isEdit ? 'تعديل تصنيف' : 'إضافة تصنيف موردين'}
        subtitle="بيانات التصنيف"
        actions={
          <button type="button" onClick={() => navigate('/supplier-categories')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-sm">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/supplier-categories')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<CategoryDoc>({ discount_percentage: 0, is_active: 1 });

  const { data: existing } = useFrappeGetDoc<CategoryDoc>(
    'Madaar Supplier Category',
    isEdit ? name : undefined,
    isEdit && name ? `supplier-category:${name}` : null,
  );
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof CategoryDoc>(key: K, val: CategoryDoc[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) {
        await updateDoc('Madaar Supplier Category', name, cleaned);
        toast.success('تحديث');
      } else {
        await createDoc('Madaar Supplier Category', cleaned);
        toast.success('تم الحفظ');
      }
      onDone();
    } catch (e: any) {
      toast.error(typeof e?._server_messages === 'string' ? e._server_messages : 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">بيانات التصنيف</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="الاسم بالعربية" required>
              <input type="text" required value={values.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
            </Field>
            <Field label="الاسم بالإنجليزية">
              <input type="text" dir="ltr" value={values.name_en ?? ''} onChange={(e) => set('name_en', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
            </Field>
            <Field label="نسبة الخصم %">
              <input type="number" step="0.01" min={0} max={100} dir="ltr" value={values.discount_percentage ?? 0} onChange={(e) => set('discount_percentage', Number(e.target.value))} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
            </Field>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!values.is_active} onChange={(e) => set('is_active', e.target.checked ? 1 : 0)} className="w-5 h-5 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">نشط</span>
          </label>
        </div>

        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/20">
          <button type="button" onClick={onDone} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 text-sm font-semibold rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-100 transition-all">
            <X size={16} /> إلغاء
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] transition-all disabled:opacity-60">
            <Check size={16} /> {isEdit ? 'تحديث' : 'حفظ'}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label}{required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}
