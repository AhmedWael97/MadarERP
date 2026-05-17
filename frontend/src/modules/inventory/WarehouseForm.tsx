/** Warehouse create/edit form. ERPNext doctype: Warehouse (tree). */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, Footer, extractFrappeError } from '../accounting/AccountForm';

interface WarehouseDoc {
  name?: string;
  warehouse_name?: string;
  parent_warehouse?: string;
  is_group?: 0 | 1;
  disabled?: 0 | 1;
  warehouse_type?: string;
  madaar_warehouse_code?: string;
  madaar_name_en?: string;
  madaar_address?: string;
}

export default function WarehouseFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Warehouse" action="read">
      <PageShell
        title={isEdit ? 'تعديل مخزن' : 'إنشاء مخزن جديد'}
        subtitle="بيانات المخزن"
        actions={
          <button type="button" onClick={() => navigate('/inventory/warehouses')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/inventory/warehouses')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<WarehouseDoc>({ is_group: 0, disabled: 0 });
  const { data: existing } = useFrappeGetDoc<WarehouseDoc>('Warehouse', isEdit ? name : undefined, isEdit && name ? `wh:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: parents } = useFrappeGetDocList<{ name: string; warehouse_name?: string }>('Warehouse', {
    fields: ['name', 'warehouse_name'],
    filters: [['is_group', '=', 1]],
    limit: 200,
  });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof WarehouseDoc>(key: K, val: WarehouseDoc[K]) { setValues((p) => ({ ...p, [key]: val })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) await updateDoc('Warehouse', name, cleaned);
      else await createDoc('Warehouse', cleaned);
      toast.success('تم الحفظ');
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card title="بيانات المخزن">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="الكود">
            <input type="text" dir="ltr" placeholder="WH-001" value={values.madaar_warehouse_code ?? ''} onChange={(e) => set('madaar_warehouse_code', e.target.value)} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="المخزن الأب">
            <select value={values.parent_warehouse ?? ''} onChange={(e) => set('parent_warehouse', e.target.value)} className={INPUT}>
              <option value="">— جذر (بدون أب) —</option>
              {(parents ?? []).map((p) => (<option key={p.name} value={p.name}>{p.warehouse_name ?? p.name}</option>))}
            </select>
          </Field>
          <Field label="الاسم بالعربية" required>
            <input type="text" required value={values.warehouse_name ?? ''} onChange={(e) => set('warehouse_name', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input type="text" dir="ltr" value={values.madaar_name_en ?? ''} onChange={(e) => set('madaar_name_en', e.target.value)} className={INPUT} />
          </Field>
          <div className="md:col-span-2">
            <Field label="العنوان">
              <input type="text" value={values.madaar_address ?? ''} onChange={(e) => set('madaar_address', e.target.value)} className={INPUT} />
            </Field>
          </div>
          <div className="flex items-center gap-6 md:col-span-2 pt-3 border-t border-slate-100 dark:border-white/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!values.is_group} onChange={(e) => set('is_group', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]" />
              <span className="text-sm text-slate-600 dark:text-slate-400">مخزن رئيسي (له مخازن فرعية)</span>
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
