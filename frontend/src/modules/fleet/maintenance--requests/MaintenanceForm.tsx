import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, TEXTAREA, Card, Field, FormFooter, extractFrappeError } from '../FleetFormHelpers';

interface MaintenanceDoc {
  name?: string;
  vehicle?: string;
  request_date?: string;
  maintenance_type?: string;
  priority?: string;
  reported_by?: string;
  assigned_technician?: string;
  status?: string;
  estimated_cost?: number;
  actual_cost?: number;
  parts_cost?: number;
  labor_cost?: number;
  odometer_on_maintenance?: number;
  vendor?: string;
  issue?: string;
  description?: string;
}

export default function MaintenanceFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Vehicle Maintenance Request" action="read">
      <PageShell
        title={isEdit ? `تعديل طلب صيانة: ${id ?? ''}` : 'طلب صيانة جديد'}
        subtitle="صيانة وإصلاحات المركبات"
        actions={
          <button type="button" onClick={() => navigate('/fleet/maintenance/requests')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/fleet/maintenance/requests')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<MaintenanceDoc>({ status: 'Open', priority: 'Medium', request_date: today });

  const { data: existing } = useFrappeGetDoc<MaintenanceDoc>('Madaar Vehicle Maintenance Request', isEdit ? name : undefined, isEdit && name ? `maint:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: vehicles } = useFrappeGetDocList<{ name: string; vehicle_number?: string }>('Madaar Vehicle', { fields: ['name', 'vehicle_number'], limit: 300 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof MaintenanceDoc>(key: K, val: MaintenanceDoc[K]) {
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
        await updateDoc('Madaar Vehicle Maintenance Request', name, cleaned);
        toast.success('تم تحديث طلب الصيانة');
      } else {
        await createDoc('Madaar Vehicle Maintenance Request', cleaned);
        toast.success('تم حفظ طلب الصيانة');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات الطلب">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="المركبة" required>
            <select required value={values.vehicle ?? ''} onChange={(e) => set('vehicle', e.target.value)} className={INPUT}>
              <option value="">— اختر مركبة —</option>
              {(vehicles ?? []).map((v) => <option key={v.name} value={v.name}>{v.vehicle_number ?? v.name}</option>)}
            </select>
          </Field>
          <Field label="التاريخ" required>
            <input type="date" required value={values.request_date ?? today} onChange={(e) => set('request_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نوع الصيانة">
            <select value={values.maintenance_type ?? ''} onChange={(e) => set('maintenance_type', e.target.value)} className={INPUT}>
              <option value="">— اختر —</option>
              <option value="Preventive">وقائية</option>
              <option value="Corrective">تصحيحية</option>
              <option value="PM">PM</option>
              <option value="Emergency">طارئة</option>
            </select>
          </Field>
          <Field label="الأولوية">
            <select value={values.priority ?? 'Medium'} onChange={(e) => set('priority', e.target.value)} className={INPUT}>
              <option value="Low">منخفضة</option>
              <option value="Medium">متوسطة</option>
              <option value="High">عالية</option>
              <option value="Critical">حرجة</option>
            </select>
          </Field>
          <Field label="الحالة">
            <select value={values.status ?? 'Open'} onChange={(e) => set('status', e.target.value)} className={INPUT}>
              <option value="Open">مفتوح</option>
              <option value="In Progress">جارية</option>
              <option value="Completed">مكتملة</option>
              <option value="Cancelled">ملغى</option>
            </select>
          </Field>
          <Field label="المُبلِّغ">
            <input type="text" value={values.reported_by ?? ''} onChange={(e) => set('reported_by', e.target.value)} className={INPUT} />
          </Field>
          <Field label="المورد / الورشة">
            <input type="text" value={values.vendor ?? ''} onChange={(e) => set('vendor', e.target.value)} className={INPUT} />
          </Field>
          <Field label="قراءة العداد عند الصيانة">
            <input type="number" min={0} dir="ltr" value={values.odometer_on_maintenance ?? ''} onChange={(e) => set('odometer_on_maintenance', Number(e.target.value))} className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="التكاليف">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="التكلفة التقديرية">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.estimated_cost ?? ''} onChange={(e) => set('estimated_cost', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="التكلفة الفعلية">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.actual_cost ?? ''} onChange={(e) => set('actual_cost', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="تكلفة القطع">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.parts_cost ?? ''} onChange={(e) => set('parts_cost', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="تكلفة العمالة">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.labor_cost ?? ''} onChange={(e) => set('labor_cost', Number(e.target.value))} className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="وصف المشكلة">
        <div className="space-y-4">
          <Field label="المشكلة المُبلَّغ عنها">
            <TEXTAREA_FIELD value={values.issue ?? ''} onChange={(e: any) => set('issue', e.target.value)} placeholder="وصف مختصر للمشكلة..." />
          </Field>
          <Field label="وصف العمل المطلوب">
            <TEXTAREA_FIELD value={values.description ?? ''} onChange={(e: any) => set('description', e.target.value)} placeholder="تفاصيل العمل أو الإصلاح..." />
          </Field>
        </div>
      </Card>

      <FormFooter saving={saving} onCancel={onDone} isEdit={isEdit} />
    </form>
  );
}

function TEXTAREA_FIELD({ value, onChange, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)] transition-colors resize-y min-h-[80px]"
    />
  );
}
