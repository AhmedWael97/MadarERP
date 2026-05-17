/** Department create/edit. ERPNext doctype: Department (tree). */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, Footer, extractFrappeError } from '../accounting/AccountForm';

interface DeptDoc {
  name?: string;
  department_name?: string;
  parent_department?: string;
  is_group?: 0 | 1;
  disabled?: 0 | 1;
}

export default function DepartmentFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Department" action="read">
      <PageShell
        title={isEdit ? 'تعديل قسم' : 'إنشاء قسم جديد'}
        subtitle="بيانات القسم"
        actions={
          <button type="button" onClick={() => navigate('/hr/departments')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/hr/departments')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<DeptDoc>({ is_group: 0, disabled: 0 });
  const { data: existing } = useFrappeGetDoc<DeptDoc>('Department', isEdit ? name : undefined, isEdit && name ? `dept:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: parents } = useFrappeGetDocList<{ name: string; department_name?: string }>('Department', {
    fields: ['name', 'department_name'],
    filters: [['is_group', '=', 1]],
    limit: 200,
  });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof DeptDoc>(key: K, val: DeptDoc[K]) { setValues((p) => ({ ...p, [key]: val })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) await updateDoc('Department', name, cleaned);
      else await createDoc('Department', cleaned);
      toast.success('تم الحفظ');
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card title="بيانات القسم">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="اسم القسم" required>
            <input type="text" required value={values.department_name ?? ''} onChange={(e) => set('department_name', e.target.value)} className={INPUT} />
          </Field>
          <Field label="القسم الأب">
            <select value={values.parent_department ?? ''} onChange={(e) => set('parent_department', e.target.value)} className={INPUT}>
              <option value="">— جذر (بدون أب) —</option>
              {(parents ?? []).map((p) => (<option key={p.name} value={p.name}>{p.department_name ?? p.name}</option>))}
            </select>
          </Field>
          <div className="flex items-center gap-6 md:col-span-2 pt-3 border-t border-slate-100 dark:border-white/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!values.is_group} onChange={(e) => set('is_group', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]" />
              <span className="text-sm text-slate-600 dark:text-slate-400">قسم رئيسي (له أقسام فرعية)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!values.disabled} onChange={(e) => set('disabled', e.target.checked ? 0 : 1)} className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]" />
              <span className="text-sm text-slate-600 dark:text-slate-400">نشط</span>
            </label>
          </div>
        </div>
        <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
      </Card>
    </form>
  );
}
