import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, TEXTAREA, Card, Field, FormFooter, extractFrappeError } from '../FleetFormHelpers';

interface AccidentDoc {
  name?: string;
  vehicle?: string;
  driver?: string;
  accident_datetime?: string;
  accident_type?: string;
  location?: string;
  severity?: string;
  estimated_repair_cost?: number;
  actual_cost?: number;
  insurance_claim?: 0 | 1;
  insurance_claim_number?: string;
  status?: string;
  description?: string;
}

export default function AccidentFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Vehicle Accident" action="read">
      <PageShell
        title={isEdit ? `تعديل حادث: ${id ?? ''}` : 'تسجيل حادث جديد'}
        subtitle="سجل حوادث المركبات"
        actions={
          <button type="button" onClick={() => navigate('/fleet/accidents')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/fleet/accidents')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const now = new Date().toISOString().slice(0, 16);
  const [values, setValues] = useState<AccidentDoc>({ status: 'Under Review', severity: 'Minor', accident_datetime: now });

  const { data: existing } = useFrappeGetDoc<AccidentDoc>('Madaar Vehicle Accident', isEdit ? name : undefined, isEdit && name ? `accident:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: vehicles } = useFrappeGetDocList<{ name: string; vehicle_number?: string }>('Madaar Vehicle', { fields: ['name', 'vehicle_number'], limit: 300 });
  const { data: drivers } = useFrappeGetDocList<{ name: string; driver_name?: string }>('Madaar Driver Profile', { fields: ['name', 'driver_name'], limit: 300 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof AccidentDoc>(key: K, val: AccidentDoc[K]) {
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
        await updateDoc('Madaar Vehicle Accident', name, cleaned);
        toast.success('تم تحديث الحادث');
      } else {
        await createDoc('Madaar Vehicle Accident', cleaned);
        toast.success('تم تسجيل الحادث');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات الحادث">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="المركبة" required>
            <select required value={values.vehicle ?? ''} onChange={(e) => set('vehicle', e.target.value)} className={INPUT}>
              <option value="">— اختر مركبة —</option>
              {(vehicles ?? []).map((v) => <option key={v.name} value={v.name}>{v.vehicle_number ?? v.name}</option>)}
            </select>
          </Field>
          <Field label="السائق">
            <select value={values.driver ?? ''} onChange={(e) => set('driver', e.target.value)} className={INPUT}>
              <option value="">— اختر سائق —</option>
              {(drivers ?? []).map((d) => <option key={d.name} value={d.name}>{d.driver_name ?? d.name}</option>)}
            </select>
          </Field>
          <Field label="وقت الحادث" required>
            <input type="datetime-local" required dir="ltr" value={values.accident_datetime ?? now} onChange={(e) => set('accident_datetime', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نوع الحادث">
            <input type="text" value={values.accident_type ?? ''} onChange={(e) => set('accident_type', e.target.value)} className={INPUT} placeholder="اصطدام، انزلاق، دهس..." />
          </Field>
          <Field label="الموقع">
            <input type="text" value={values.location ?? ''} onChange={(e) => set('location', e.target.value)} className={INPUT} />
          </Field>
          <Field label="مستوى الضرر">
            <select value={values.severity ?? 'Minor'} onChange={(e) => set('severity', e.target.value)} className={INPUT}>
              <option value="Minor">بسيط</option>
              <option value="Moderate">متوسط</option>
              <option value="Severe">شديد</option>
              <option value="Total Loss">خسارة كلية</option>
            </select>
          </Field>
          <Field label="الحالة">
            <select value={values.status ?? 'Under Review'} onChange={(e) => set('status', e.target.value)} className={INPUT}>
              <option value="Under Review">قيد المراجعة</option>
              <option value="Resolved">محلول</option>
              <option value="Claimed">مطالَب به</option>
              <option value="Closed">مغلق</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card title="التكاليف والتأمين">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="تكلفة الإصلاح التقديرية">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.estimated_repair_cost ?? ''} onChange={(e) => set('estimated_repair_cost', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="التكلفة الفعلية">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.actual_cost ?? ''} onChange={(e) => set('actual_cost', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="رقم مطالبة التأمين">
            <input type="text" dir="ltr" value={values.insurance_claim_number ?? ''} onChange={(e) => set('insurance_claim_number', e.target.value)} className={INPUT} />
          </Field>
          <label className="inline-flex items-center gap-2 cursor-pointer md:col-span-3">
            <input type="checkbox" checked={!!values.insurance_claim} onChange={(e) => set('insurance_claim', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">تم تقديم مطالبة تأمين</span>
          </label>
        </div>
      </Card>

      <Card title="وصف الحادث">
        <textarea value={values.description ?? ''} onChange={(e) => set('description', e.target.value)} className={TEXTAREA} placeholder="وصف تفصيلي للحادث والملابسات..." />
      </Card>

      <FormFooter saving={saving} onCancel={onDone} isEdit={isEdit} />
    </form>
  );
}
