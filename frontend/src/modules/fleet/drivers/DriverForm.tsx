import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, TEXTAREA, Card, Field, FormFooter, extractFrappeError } from '../FleetFormHelpers';

interface DriverDoc {
  name?: string;
  driver_code?: string;
  driver_name?: string;
  name_ar?: string;
  national_id?: string;
  blood_type?: string;
  employee?: string;
  status?: string;
  hire_date?: string;
  employment_type?: string;
  branch?: string;
  phone?: string;
  mobile?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  address?: string;
  license_number?: string;
  license_type?: string;
  license_expiry?: string;
  assigned_vehicle?: string;
  notes?: string;
}

export default function DriverFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Driver Profile" action="read">
      <PageShell
        title={isEdit ? `تعديل سائق: ${id ?? ''}` : 'إضافة سائق جديد'}
        subtitle="بيانات السائق والرخصة"
        actions={
          <button type="button" onClick={() => navigate('/fleet/drivers')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/fleet/drivers')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<DriverDoc>({ status: 'Active', employment_type: 'Full Time' });

  const { data: existing } = useFrappeGetDoc<DriverDoc>('Madaar Driver Profile', isEdit ? name : undefined, isEdit && name ? `driver:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: vehicles } = useFrappeGetDocList<{ name: string; vehicle_number?: string }>('Madaar Vehicle', { fields: ['name', 'vehicle_number'], limit: 300 });
  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof DriverDoc>(key: K, val: DriverDoc[K]) {
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
        await updateDoc('Madaar Driver Profile', name, cleaned);
        toast.success('تم تحديث السائق');
      } else {
        await createDoc('Madaar Driver Profile', cleaned);
        toast.success('تم حفظ السائق');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card title="البيانات الأساسية">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="كود السائق">
            <input type="text" dir="ltr" value={values.driver_code ?? ''} onChange={(e) => set('driver_code', e.target.value)} className={INPUT} />
          </Field>
          <Field label="اسم السائق" required>
            <input type="text" required value={values.driver_name ?? ''} onChange={(e) => set('driver_name', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الاسم بالعربية">
            <input type="text" value={values.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} className={INPUT} />
          </Field>
          <Field label="رقم الهوية الوطنية">
            <input type="text" dir="ltr" value={values.national_id ?? ''} onChange={(e) => set('national_id', e.target.value)} className={INPUT} />
          </Field>
          <Field label="فصيلة الدم">
            <select value={values.blood_type ?? ''} onChange={(e) => set('blood_type', e.target.value)} className={INPUT}>
              <option value="">— اختر —</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </Field>
          <Field label="الحالة">
            <select value={values.status ?? 'Active'} onChange={(e) => set('status', e.target.value)} className={INPUT}>
              <option value="Active">نشط</option>
              <option value="On Leave">إجازة</option>
              <option value="Inactive">غير نشط</option>
              <option value="Suspended">موقوف</option>
            </select>
          </Field>
          <Field label="نوع التوظيف">
            <select value={values.employment_type ?? 'Full Time'} onChange={(e) => set('employment_type', e.target.value)} className={INPUT}>
              <option value="Full Time">دوام كامل</option>
              <option value="Part Time">دوام جزئي</option>
              <option value="Contractor">مقاول</option>
              <option value="External">خارجي</option>
            </select>
          </Field>
          <Field label="تاريخ التوظيف">
            <input type="date" value={values.hire_date ?? ''} onChange={(e) => set('hire_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الفرع">
            <input type="text" value={values.branch ?? ''} onChange={(e) => set('branch', e.target.value)} className={INPUT} />
          </Field>
        </div>
      </Card>

      {/* Contact */}
      <Card title="بيانات الاتصال">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="الهاتف">
            <input type="tel" dir="ltr" value={values.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الجوال">
            <input type="tel" dir="ltr" value={values.mobile ?? ''} onChange={(e) => set('mobile', e.target.value)} className={INPUT} />
          </Field>
          <Field label="جهة الطوارئ">
            <input type="text" value={values.emergency_contact ?? ''} onChange={(e) => set('emergency_contact', e.target.value)} className={INPUT} />
          </Field>
          <Field label="هاتف الطوارئ">
            <input type="tel" dir="ltr" value={values.emergency_phone ?? ''} onChange={(e) => set('emergency_phone', e.target.value)} className={INPUT} />
          </Field>
          <div className="md:col-span-2">
            <Field label="العنوان">
              <input type="text" value={values.address ?? ''} onChange={(e) => set('address', e.target.value)} className={INPUT} />
            </Field>
          </div>
        </div>
      </Card>

      {/* License */}
      <Card title="بيانات الرخصة">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="رقم الرخصة">
            <input type="text" dir="ltr" value={values.license_number ?? ''} onChange={(e) => set('license_number', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نوع الرخصة">
            <input type="text" value={values.license_type ?? ''} onChange={(e) => set('license_type', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تاريخ انتهاء الرخصة">
            <input type="date" value={values.license_expiry ?? ''} onChange={(e) => set('license_expiry', e.target.value)} className={INPUT} />
          </Field>
        </div>
      </Card>

      {/* Assignment */}
      <Card title="تخصيص المركبة">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="المركبة المخصصة">
            <select value={values.assigned_vehicle ?? ''} onChange={(e) => set('assigned_vehicle', e.target.value)} className={INPUT}>
              <option value="">— بدون تخصيص —</option>
              {(vehicles ?? []).map((v) => (
                <option key={v.name} value={v.name}>{v.vehicle_number ?? v.name}</option>
              ))}
            </select>
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
