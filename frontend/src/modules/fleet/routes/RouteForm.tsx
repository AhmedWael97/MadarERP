import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, TEXTAREA, Card, Field, FormFooter, extractFrappeError } from '../FleetFormHelpers';

interface RouteDoc {
  name?: string;
  route_name?: string;
  route_code?: string;
  name_ar?: string;
  name_en?: string;
  is_active?: 0 | 1;
  is_night_route?: 0 | 1;
  origin?: string;
  destination?: string;
  distance_km?: number;
  estimated_duration?: string;
  standard_hours?: number;
  toll_fees?: number;
  contracted_price?: number;
  fuel_standard?: number;
  stops_text?: string;
}

export default function RouteFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Route" action="read">
      <PageShell
        title={isEdit ? `تعديل مسار: ${id ?? ''}` : 'إضافة مسار جديد'}
        subtitle="بيانات مسار النقل"
        actions={
          <button type="button" onClick={() => navigate('/fleet/routes')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/fleet/routes')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<RouteDoc>({ is_active: 1, is_night_route: 0 });

  const { data: existing } = useFrappeGetDoc<RouteDoc>('Madaar Route', isEdit ? name : undefined, isEdit && name ? `route:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof RouteDoc>(key: K, val: RouteDoc[K]) {
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
        await updateDoc('Madaar Route', name, cleaned);
        toast.success('تم تحديث المسار');
      } else {
        await createDoc('Madaar Route', cleaned);
        toast.success('تم حفظ المسار');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="البيانات الأساسية">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="اسم المسار" required>
            <input type="text" required value={values.route_name ?? ''} onChange={(e) => set('route_name', e.target.value)} className={INPUT} />
          </Field>
          <Field label="كود المسار">
            <input type="text" dir="ltr" value={values.route_code ?? ''} onChange={(e) => set('route_code', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الاسم بالعربية">
            <input type="text" value={values.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input type="text" dir="ltr" value={values.name_en ?? ''} onChange={(e) => set('name_en', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نقطة البداية" required>
            <input type="text" required value={values.origin ?? ''} onChange={(e) => set('origin', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نقطة النهاية" required>
            <input type="text" required value={values.destination ?? ''} onChange={(e) => set('destination', e.target.value)} className={INPUT} />
          </Field>
          <Field label="المسافة (كم)">
            <input type="number" min={0} step="0.1" dir="ltr" value={values.distance_km ?? ''} onChange={(e) => set('distance_km', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="الوقت المعياري (ساعة)">
            <input type="number" min={0} step="0.25" dir="ltr" value={values.standard_hours ?? ''} onChange={(e) => set('standard_hours', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="رسوم العبور">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.toll_fees ?? ''} onChange={(e) => set('toll_fees', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="السعر التعاقدي">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.contracted_price ?? ''} onChange={(e) => set('contracted_price', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="معيار الوقود (لتر)">
            <input type="number" min={0} step="0.1" dir="ltr" value={values.fuel_standard ?? ''} onChange={(e) => set('fuel_standard', Number(e.target.value))} className={INPUT} />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!values.is_active} onChange={(e) => set('is_active', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">مسار نشط</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!values.is_night_route} onChange={(e) => set('is_night_route', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">مسار ليلي</span>
          </label>
        </div>
      </Card>

      <Card title="المحطات والملاحظات">
        <textarea value={values.stops_text ?? ''} onChange={(e) => set('stops_text', e.target.value)} className={TEXTAREA} placeholder="أدخل المحطات المتوقفة في المسار..." />
      </Card>

      <FormFooter saving={saving} onCancel={onDone} isEdit={isEdit} />
    </form>
  );
}
