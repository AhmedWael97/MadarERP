import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, TEXTAREA, Card, Field, FormFooter, extractFrappeError } from '../FleetFormHelpers';

interface VehicleDoc {
  name?: string;
  vehicle_number?: string;
  vehicle_code?: string;
  name_ar?: string;
  name_en?: string;
  license_plate?: string;
  internal_number?: string;
  status?: string;
  ownership_type?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  chassis_number?: string;
  engine_number?: string;
  fuel_type?: string;
  seating_capacity?: number;
  load_capacity?: number;
  current_odometer?: number;
  driver?: string;
  branch?: string;
  depot_id?: string;
  default_route?: string;
  gps_number?: string;
  sim_number?: string;
  purchase_date?: string;
  purchase_value?: number;
  insurance_value?: number;
  residual_value?: number;
  notes?: string;
}

export default function VehicleFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Vehicle" action="read">
      <PageShell
        title={isEdit ? `تعديل مركبة: ${id ?? ''}` : 'إضافة مركبة جديدة'}
        subtitle="بيانات المركبة والأسطول"
        actions={
          <button type="button" onClick={() => navigate('/fleet/vehicles')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/fleet/vehicles')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<VehicleDoc>({ status: 'Active', ownership_type: 'Owned', current_odometer: 0 });

  const { data: existing } = useFrappeGetDoc<VehicleDoc>('Madaar Vehicle', isEdit ? name : undefined, isEdit && name ? `vehicle:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: routes } = useFrappeGetDocList<{ name: string; route_name?: string }>('Madaar Route', { fields: ['name', 'route_name'], limit: 200 });
  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof VehicleDoc>(key: K, val: VehicleDoc[K]) {
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
        await updateDoc('Madaar Vehicle', name, cleaned);
        toast.success('تم تحديث المركبة');
      } else {
        await createDoc('Madaar Vehicle', cleaned);
        toast.success('تم حفظ المركبة');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card title="البيانات الأساسية">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="رقم المركبة" required>
            <input type="text" required value={values.vehicle_number ?? ''} onChange={(e) => set('vehicle_number', e.target.value)} className={INPUT} placeholder="VH-001" dir="ltr" />
          </Field>
          <Field label="الكود">
            <input type="text" value={values.vehicle_code ?? ''} onChange={(e) => set('vehicle_code', e.target.value)} className={INPUT} dir="ltr" />
          </Field>
          <Field label="رقم اللوحة" required>
            <input type="text" required value={values.license_plate ?? ''} onChange={(e) => set('license_plate', e.target.value)} className={INPUT} dir="ltr" />
          </Field>
          <Field label="الاسم بالعربية">
            <input type="text" value={values.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input type="text" dir="ltr" value={values.name_en ?? ''} onChange={(e) => set('name_en', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الرقم الداخلي">
            <input type="text" value={values.internal_number ?? ''} onChange={(e) => set('internal_number', e.target.value)} className={INPUT} dir="ltr" />
          </Field>
          <Field label="الحالة">
            <select value={values.status ?? 'Active'} onChange={(e) => set('status', e.target.value)} className={INPUT}>
              <option value="Active">نشطة</option>
              <option value="In Maintenance">في الصيانة</option>
              <option value="Out of Service">خارج الخدمة</option>
              <option value="Reserved">محجوزة</option>
              <option value="Sold">مباعة</option>
              <option value="Suspended">موقوفة</option>
            </select>
          </Field>
          <Field label="نوع الملكية">
            <select value={values.ownership_type ?? 'Owned'} onChange={(e) => set('ownership_type', e.target.value)} className={INPUT}>
              <option value="Owned">مملوكة</option>
              <option value="Finance Lease">تأجير تمويلي</option>
              <option value="Rented">مستأجرة</option>
              <option value="Contractor">مقاول</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* Specs */}
      <Card title="المواصفات الفنية">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="الماركة / الصانع">
            <input type="text" value={values.make ?? ''} onChange={(e) => set('make', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الموديل">
            <input type="text" value={values.model ?? ''} onChange={(e) => set('model', e.target.value)} className={INPUT} dir="ltr" />
          </Field>
          <Field label="سنة الصنع">
            <input type="number" min={1990} max={2099} value={values.year ?? ''} onChange={(e) => set('year', Number(e.target.value))} className={INPUT} dir="ltr" />
          </Field>
          <Field label="اللون">
            <input type="text" value={values.color ?? ''} onChange={(e) => set('color', e.target.value)} className={INPUT} />
          </Field>
          <Field label="رقم الهيكل (Chassis)">
            <input type="text" dir="ltr" value={values.chassis_number ?? ''} onChange={(e) => set('chassis_number', e.target.value)} className={INPUT} />
          </Field>
          <Field label="رقم المحرك">
            <input type="text" dir="ltr" value={values.engine_number ?? ''} onChange={(e) => set('engine_number', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نوع الوقود">
            <input type="text" value={values.fuel_type ?? ''} onChange={(e) => set('fuel_type', e.target.value)} className={INPUT} />
          </Field>
          <Field label="سعة المقاعد">
            <input type="number" min={0} value={values.seating_capacity ?? ''} onChange={(e) => set('seating_capacity', Number(e.target.value))} className={INPUT} dir="ltr" />
          </Field>
          <Field label="الحمولة (طن)">
            <input type="number" min={0} step="0.1" value={values.load_capacity ?? ''} onChange={(e) => set('load_capacity', Number(e.target.value))} className={INPUT} dir="ltr" />
          </Field>
        </div>
      </Card>

      {/* Assignment */}
      <Card title="التخصيص والتشغيل">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="قراءة العداد الحالية (كم)">
            <input type="number" min={0} value={values.current_odometer ?? 0} onChange={(e) => set('current_odometer', Number(e.target.value))} className={INPUT} dir="ltr" />
          </Field>
          <Field label="الفرع">
            <input type="text" value={values.branch ?? ''} onChange={(e) => set('branch', e.target.value)} className={INPUT} />
          </Field>
          <Field label="المستودع">
            <input type="text" value={values.depot_id ?? ''} onChange={(e) => set('depot_id', e.target.value)} className={INPUT} />
          </Field>
          <Field label="المسار الافتراضي">
            <select value={values.default_route ?? ''} onChange={(e) => set('default_route', e.target.value)} className={INPUT}>
              <option value="">— بدون —</option>
              {(routes ?? []).map((r) => (
                <option key={r.name} value={r.name}>{r.route_name ?? r.name}</option>
              ))}
            </select>
          </Field>
          <Field label="رقم GPS">
            <input type="text" dir="ltr" value={values.gps_number ?? ''} onChange={(e) => set('gps_number', e.target.value)} className={INPUT} />
          </Field>
          <Field label="رقم SIM">
            <input type="text" dir="ltr" value={values.sim_number ?? ''} onChange={(e) => set('sim_number', e.target.value)} className={INPUT} />
          </Field>
        </div>
      </Card>

      {/* Financial */}
      <Card title="البيانات المالية">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="تاريخ الشراء">
            <input type="date" value={values.purchase_date ?? ''} onChange={(e) => set('purchase_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="قيمة الشراء">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.purchase_value ?? ''} onChange={(e) => set('purchase_value', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="قيمة التأمين">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.insurance_value ?? ''} onChange={(e) => set('insurance_value', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="القيمة المتبقية">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.residual_value ?? ''} onChange={(e) => set('residual_value', Number(e.target.value))} className={INPUT} />
          </Field>
        </div>
      </Card>

      {/* Notes */}
      <Card title="ملاحظات">
        <textarea value={values.notes ?? ''} onChange={(e) => set('notes', e.target.value)} className={TEXTAREA} placeholder="ملاحظات إضافية..." />
      </Card>

      <FormFooter saving={saving} onCancel={onDone} isEdit={isEdit} />
    </form>
  );
}
