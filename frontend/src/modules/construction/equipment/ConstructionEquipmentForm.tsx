import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, TEXTAREA, Card, Field, FormFooter, extractFrappeError } from '../../fleet/FleetFormHelpers';

interface EquipmentDoc {
  name?: string;
  name_ar?: string;
  name_en?: string;
  equipment_code?: string;
  equipment_type?: string;
  status?: string;
  project?: string;
  assigned_operator?: string;
  hourly_cost?: number;
  daily_cost?: number;
  monthly_cost?: number;
  notes?: string;
}

export default function ConstructionEquipmentFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Construction Equipment" action="read">
      <PageShell
        title={isEdit ? `تعديل معدة: ${id ?? ''}` : 'إضافة معدة جديدة'}
        subtitle="سجل معدات المشاريع"
        actions={
          <button type="button" onClick={() => navigate('/construction/equipment')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/construction/equipment')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<EquipmentDoc>({ status: 'Available' });

  const { data: existing } = useFrappeGetDoc<EquipmentDoc>('Madaar Construction Equipment', isEdit ? name : undefined, isEdit && name ? `equip:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: projects } = useFrappeGetDocList<{ name: string; name_ar?: string }>('Madaar Construction Project', { fields: ['name', 'name_ar'], limit: 200 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof EquipmentDoc>(key: K, val: EquipmentDoc[K]) {
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
        await updateDoc('Madaar Construction Equipment', name, cleaned);
        toast.success('تم تحديث المعدة');
      } else {
        await createDoc('Madaar Construction Equipment', cleaned);
        toast.success('تم حفظ المعدة');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات المعدة">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="الاسم بالعربية" required>
            <input type="text" required value={values.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input type="text" dir="ltr" value={values.name_en ?? ''} onChange={(e) => set('name_en', e.target.value)} className={INPUT} />
          </Field>
          <Field label="كود المعدة">
            <input type="text" dir="ltr" value={values.equipment_code ?? ''} onChange={(e) => set('equipment_code', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نوع المعدة">
            <input type="text" value={values.equipment_type ?? ''} onChange={(e) => set('equipment_type', e.target.value)} className={INPUT} placeholder="حفار، رافعة، خلاطة..." />
          </Field>
          <Field label="الحالة">
            <select value={values.status ?? 'Available'} onChange={(e) => set('status', e.target.value)} className={INPUT}>
              <option value="Available">متاحة</option>
              <option value="Assigned">مخصصة</option>
              <option value="Maintenance">صيانة</option>
              <option value="Retired">مستبعدة</option>
            </select>
          </Field>
          <Field label="المشروع">
            <select value={values.project ?? ''} onChange={(e) => set('project', e.target.value)} className={INPUT}>
              <option value="">— بدون تخصيص —</option>
              {(projects ?? []).map((p) => <option key={p.name} value={p.name}>{p.name_ar ?? p.name}</option>)}
            </select>
          </Field>
          <Field label="المشغّل المسؤول">
            <input type="text" value={values.assigned_operator ?? ''} onChange={(e) => set('assigned_operator', e.target.value)} className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="التكاليف">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="التكلفة بالساعة">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.hourly_cost ?? ''} onChange={(e) => set('hourly_cost', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="التكلفة اليومية">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.daily_cost ?? ''} onChange={(e) => set('daily_cost', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="التكلفة الشهرية">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.monthly_cost ?? ''} onChange={(e) => set('monthly_cost', Number(e.target.value))} className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="ملاحظات">
        <textarea value={values.notes ?? ''} onChange={(e) => set('notes', e.target.value)} className={TEXTAREA} placeholder="ملاحظات..." />
      </Card>

      <FormFooter saving={saving} onCancel={onDone} isEdit={isEdit} />
    </form>
  );
}
