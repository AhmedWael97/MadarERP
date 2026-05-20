import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, TEXTAREA, Card, Field, FormFooter, extractFrappeError } from '../FleetFormHelpers';

interface TripDoc {
  name?: string;
  vehicle?: string;
  driver?: string;
  route?: string;
  trip_date?: string;
  trip_type?: string;
  customer?: string;
  contract?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  start_odometer?: number;
  end_odometer?: number;
  distance_km?: number;
  fuel_issued?: number;
  passengers_count?: number;
  cost_estimate?: number;
  revenue_value?: number;
  toll_cost?: number;
  load_details?: string;
  purpose?: string;
  remarks?: string;
}

export default function TripFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Trip" action="read">
      <PageShell
        title={isEdit ? `تعديل رحلة: ${id ?? ''}` : 'إضافة رحلة جديدة'}
        subtitle="بيانات الرحلة والتتبع"
        actions={
          <button type="button" onClick={() => navigate('/fleet/trips')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/fleet/trips')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<TripDoc>({ status: 'Planned', trip_date: today });

  const { data: existing } = useFrappeGetDoc<TripDoc>('Madaar Trip', isEdit ? name : undefined, isEdit && name ? `trip:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: vehicles } = useFrappeGetDocList<{ name: string; vehicle_number?: string }>('Madaar Vehicle', { fields: ['name', 'vehicle_number'], limit: 300 });
  const { data: drivers } = useFrappeGetDocList<{ name: string; driver_name?: string }>('Madaar Driver Profile', { fields: ['name', 'driver_name'], limit: 300 });
  const { data: routes } = useFrappeGetDocList<{ name: string; route_name?: string }>('Madaar Route', { fields: ['name', 'route_name'], limit: 200 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof TripDoc>(key: K, val: TripDoc[K]) {
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
        await updateDoc('Madaar Trip', name, cleaned);
        toast.success('تم تحديث الرحلة');
      } else {
        await createDoc('Madaar Trip', cleaned);
        toast.success('تم حفظ الرحلة');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات الرحلة">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="التاريخ" required>
            <input type="date" required value={values.trip_date ?? today} onChange={(e) => set('trip_date', e.target.value)} className={INPUT} />
          </Field>
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
          <Field label="المسار">
            <select value={values.route ?? ''} onChange={(e) => set('route', e.target.value)} className={INPUT}>
              <option value="">— اختر مسار —</option>
              {(routes ?? []).map((r) => <option key={r.name} value={r.name}>{r.route_name ?? r.name}</option>)}
            </select>
          </Field>
          <Field label="نوع الرحلة">
            <input type="text" value={values.trip_type ?? ''} onChange={(e) => set('trip_type', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الحالة">
            <select value={values.status ?? 'Planned'} onChange={(e) => set('status', e.target.value)} className={INPUT}>
              <option value="Planned">مخططة</option>
              <option value="In Progress">جارية</option>
              <option value="Completed">مكتملة</option>
              <option value="Cancelled">ملغاة</option>
            </select>
          </Field>
          <Field label="العميل">
            <input type="text" value={values.customer ?? ''} onChange={(e) => set('customer', e.target.value)} className={INPUT} />
          </Field>
          <Field label="المرجع / العقد">
            <input type="text" value={values.contract ?? ''} onChange={(e) => set('contract', e.target.value)} className={INPUT} dir="ltr" />
          </Field>
        </div>
      </Card>

      <Card title="توقيت ومسافة">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="تاريخ البداية">
            <input type="date" value={values.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تاريخ النهاية">
            <input type="date" value={values.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="وقت البداية">
            <input type="time" dir="ltr" value={values.start_time ?? ''} onChange={(e) => set('start_time', e.target.value)} className={INPUT} />
          </Field>
          <Field label="وقت النهاية">
            <input type="time" dir="ltr" value={values.end_time ?? ''} onChange={(e) => set('end_time', e.target.value)} className={INPUT} />
          </Field>
          <Field label="عداد البداية (كم)">
            <input type="number" min={0} dir="ltr" value={values.start_odometer ?? ''} onChange={(e) => set('start_odometer', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="عداد النهاية (كم)">
            <input type="number" min={0} dir="ltr" value={values.end_odometer ?? ''} onChange={(e) => set('end_odometer', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="المسافة المقطوعة (كم)">
            <input type="number" min={0} step="0.1" dir="ltr" value={values.distance_km ?? ''} onChange={(e) => set('distance_km', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="عدد الركاب">
            <input type="number" min={0} dir="ltr" value={values.passengers_count ?? ''} onChange={(e) => set('passengers_count', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="وقود مصروف (لتر)">
            <input type="number" min={0} step="0.1" dir="ltr" value={values.fuel_issued ?? ''} onChange={(e) => set('fuel_issued', Number(e.target.value))} className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="التكاليف والإيرادات">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="التكلفة التقديرية">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.cost_estimate ?? ''} onChange={(e) => set('cost_estimate', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="قيمة الإيراد">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.revenue_value ?? ''} onChange={(e) => set('revenue_value', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="رسوم العبور">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.toll_cost ?? ''} onChange={(e) => set('toll_cost', Number(e.target.value))} className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="تفاصيل إضافية">
        <div className="space-y-4">
          <Field label="الغرض من الرحلة">
            <input type="text" value={values.purpose ?? ''} onChange={(e) => set('purpose', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تفاصيل الحمولة">
            <textarea value={values.load_details ?? ''} onChange={(e) => set('load_details', e.target.value)} className={TEXTAREA} placeholder="وصف الحمولة أو البضاعة..." />
          </Field>
          <Field label="ملاحظات">
            <textarea value={values.remarks ?? ''} onChange={(e) => set('remarks', e.target.value)} className={TEXTAREA} placeholder="ملاحظات..." />
          </Field>
        </div>
      </Card>

      <FormFooter saving={saving} onCancel={onDone} isEdit={isEdit} />
    </form>
  );
}
