import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, TEXTAREA, Card, Field, FormFooter, extractFrappeError } from '../FleetFormHelpers';

interface ViolationDoc {
  name?: string;
  vehicle?: string;
  driver?: string;
  date?: string;
  violation_type?: string;
  authority?: string;
  location?: string;
  fine_amount?: number;
  charged_to?: string;
  is_paid?: 0 | 1;
  status?: string;
  notes?: string;
}

export default function ViolationFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Vehicle Violation" action="read">
      <PageShell
        title={isEdit ? `تعديل مخالفة: ${id ?? ''}` : 'تسجيل مخالفة جديدة'}
        subtitle="سجل مخالفات المركبات والسائقين"
        actions={
          <button type="button" onClick={() => navigate('/fleet/violations')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/fleet/violations')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<ViolationDoc>({ status: 'Unpaid', charged_to: 'Company', date: today });

  const { data: existing } = useFrappeGetDoc<ViolationDoc>('Madaar Vehicle Violation', isEdit ? name : undefined, isEdit && name ? `violation:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: vehicles } = useFrappeGetDocList<{ name: string; vehicle_number?: string }>('Madaar Vehicle', { fields: ['name', 'vehicle_number'], limit: 300 });
  const { data: drivers } = useFrappeGetDocList<{ name: string; driver_name?: string }>('Madaar Driver Profile', { fields: ['name', 'driver_name'], limit: 300 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof ViolationDoc>(key: K, val: ViolationDoc[K]) {
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
        await updateDoc('Madaar Vehicle Violation', name, cleaned);
        toast.success('تم تحديث المخالفة');
      } else {
        await createDoc('Madaar Vehicle Violation', cleaned);
        toast.success('تم تسجيل المخالفة');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات المخالفة">
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
          <Field label="التاريخ" required>
            <input type="date" required value={values.date ?? today} onChange={(e) => set('date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نوع المخالفة">
            <input type="text" value={values.violation_type ?? ''} onChange={(e) => set('violation_type', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الجهة المُصدِرة">
            <input type="text" value={values.authority ?? ''} onChange={(e) => set('authority', e.target.value)} className={INPUT} placeholder="المرور، البلدية..." />
          </Field>
          <Field label="الموقع">
            <input type="text" value={values.location ?? ''} onChange={(e) => set('location', e.target.value)} className={INPUT} />
          </Field>
          <Field label="قيمة الغرامة">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.fine_amount ?? ''} onChange={(e) => set('fine_amount', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="على حساب">
            <select value={values.charged_to ?? 'Company'} onChange={(e) => set('charged_to', e.target.value)} className={INPUT}>
              <option value="Company">الشركة</option>
              <option value="Driver">السائق</option>
            </select>
          </Field>
          <Field label="الحالة">
            <select value={values.status ?? 'Unpaid'} onChange={(e) => set('status', e.target.value)} className={INPUT}>
              <option value="Unpaid">غير مدفوعة</option>
              <option value="Paid">مدفوعة</option>
              <option value="Contested">مطعون فيها</option>
              <option value="Dismissed">ملغاة</option>
            </select>
          </Field>
          <label className="inline-flex items-center gap-2 cursor-pointer md:col-span-3">
            <input type="checkbox" checked={!!values.is_paid} onChange={(e) => set('is_paid', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">تم الدفع</span>
          </label>
        </div>
      </Card>

      <Card title="ملاحظات">
        <textarea value={values.notes ?? ''} onChange={(e) => set('notes', e.target.value)} className={TEXTAREA} placeholder="ملاحظات إضافية..." />
      </Card>

      <FormFooter saving={saving} onCancel={onDone} isEdit={isEdit} />
    </form>
  );
}
