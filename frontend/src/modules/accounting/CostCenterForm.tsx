/**
 * Cost Center create / edit form override.
 * Mirrors reference `accounting/cost-centers/form.blade.php`.
 *
 * ERPNext doctype: Cost Center. Map:
 *   code         → cost_center_number  (standard ERPNext field; auto-filled
 *                                       by madaar_core.auto_code hook when
 *                                       the user leaves it blank)
 *   parent       → parent_cost_center  (optional — leave empty to create a
 *                                       root cost center)
 *   name_ar      → cost_center_name
 *   name_en      → madaar_name_en      (Custom Field)
 *   type         → madaar_type         (Custom Field: branch/department/project/other)
 *   description  → madaar_description  (Custom Field)
 *   is_active    → disabled (inverse)
 *   is_group     → is_group            (toggle to create a parent CC)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, Footer, extractFrappeError } from './AccountForm';

interface CostCenterDoc {
  name?: string;
  cost_center_name?: string;
  cost_center_number?: string;
  parent_cost_center?: string;
  company?: string;
  is_group?: 0 | 1;
  disabled?: 0 | 1;
  madaar_name_en?: string;
  madaar_type?: 'branch' | 'department' | 'project' | 'other';
  madaar_description?: string;
}

export default function CostCenterFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Cost Center" action="read">
      <PageShell
        title={isEdit ? 'تعديل مركز تكلفة' : 'إنشاء مركز تكلفة جديد'}
        subtitle="بيانات مركز التكلفة"
        actions={
          <button type="button" onClick={() => navigate('/accounting/cost-centers')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/accounting/cost-centers')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<CostCenterDoc>({ madaar_type: 'branch', is_group: 0, disabled: 0 });
  const { data: existing } = useFrappeGetDoc<CostCenterDoc>('Cost Center', isEdit ? name : undefined, isEdit && name ? `cc:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  // Parents: only group CCs are eligible. Leave the dropdown's empty option in
  // place so the user can create a root-level CC by NOT picking a parent.
  const { data: parents } = useFrappeGetDocList<{ name: string; cost_center_name?: string; cost_center_number?: string }>('Cost Center', {
    fields: ['name', 'cost_center_name', 'cost_center_number'],
    filters: [['is_group', '=', 1]],
    limit: 200,
  });

  function set<K extends keyof CostCenterDoc>(key: K, val: CostCenterDoc[K]) {
    setValues((p) => ({ ...p, [key]: val }));
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
        await updateDoc('Cost Center', name, cleaned);
        toast.success('تحديث');
      } else {
        await createDoc('Cost Center', cleaned);
        toast.success('تم الحفظ');
      }
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card title="بيانات مركز التكلفة">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="الكود (يُولَّد تلقائياً إذا تُرك فارغاً)">
            <input
              type="text"
              dir="ltr"
              placeholder="اتركه فارغاً للتوليد التلقائي من كود الأب"
              value={values.cost_center_number ?? ''}
              onChange={(e) => set('cost_center_number', e.target.value)}
              className={INPUT + ' font-mono'}
            />
          </Field>
          <Field label="المركز الأب (اختياري)">
            <select value={values.parent_cost_center ?? ''} onChange={(e) => set('parent_cost_center', e.target.value)} className={INPUT}>
              <option value="">— جذر (بدون أب) —</option>
              {(parents ?? []).map((p) => (
                <option key={p.name} value={p.name}>
                  {p.cost_center_number ? `${p.cost_center_number} — ${p.cost_center_name ?? p.name}` : (p.cost_center_name ?? p.name)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الاسم بالعربية" required>
            <input type="text" required value={values.cost_center_name ?? ''} onChange={(e) => set('cost_center_name', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input type="text" dir="ltr" value={values.madaar_name_en ?? ''} onChange={(e) => set('madaar_name_en', e.target.value)} className={INPUT} />
          </Field>
          <Field label="النوع">
            <select value={values.madaar_type ?? 'branch'} onChange={(e) => set('madaar_type', e.target.value as CostCenterDoc['madaar_type'])} className={INPUT}>
              <option value="branch">فرع</option>
              <option value="department">قسم</option>
              <option value="project">مشروع</option>
              <option value="other">أخرى</option>
            </select>
          </Field>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center cursor-pointer gap-2">
              <input
                type="checkbox"
                checked={!!values.is_group}
                onChange={(e) => set('is_group', e.target.checked ? 1 : 0)}
                className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">مركز رئيسي (يحتوي على مراكز فرعية)</span>
            </label>
            <label className="inline-flex items-center cursor-pointer gap-2">
              <input
                type="checkbox"
                checked={!values.disabled}
                onChange={(e) => set('disabled', e.target.checked ? 0 : 1)}
                className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">نشط</span>
            </label>
          </div>
          <div className="md:col-span-2">
            <Field label="الوصف">
              <textarea rows={3} value={values.madaar_description ?? ''} onChange={(e) => set('madaar_description', e.target.value)} className={INPUT + ' resize-none'} />
            </Field>
          </div>
        </div>

        <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
      </Card>
    </form>
  );
}
