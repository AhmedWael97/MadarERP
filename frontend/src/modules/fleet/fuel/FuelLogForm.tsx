import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, FormFooter, extractFrappeError } from '../FleetFormHelpers';

interface FuelLogDoc {
  name?: string;
  vehicle?: string;
  date?: string;
  driver?: string;
  fuel_type?: string;
  quantity?: number;
  unit_price?: number;
  total_cost?: number;
  odometer?: number;
  station_vendor?: string;
  payment_method?: string;
  transaction_no?: string;
  reference?: string;
}

export default function FuelLogFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Fuel Log" action="read">
      <PageShell
        title={isEdit ? `تعديل سجل وقود: ${id ?? ''}` : 'تسجيل تعبئة وقود'}
        subtitle="سجل استهلاك الوقود"
        actions={
          <button type="button" onClick={() => navigate('/fleet/fuel')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/fleet/fuel')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<FuelLogDoc>({ date: today, payment_method: 'Cash' });

  const { data: existing } = useFrappeGetDoc<FuelLogDoc>('Madaar Fuel Log', isEdit ? name : undefined, isEdit && name ? `fuel:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: vehicles } = useFrappeGetDocList<{ name: string; vehicle_number?: string }>('Madaar Vehicle', { fields: ['name', 'vehicle_number'], limit: 300 });
  const { data: drivers } = useFrappeGetDocList<{ name: string; driver_name?: string }>('Madaar Driver Profile', { fields: ['name', 'driver_name'], limit: 300 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  const total = useMemo(() => (values.quantity ?? 0) * (values.unit_price ?? 0), [values.quantity, values.unit_price]);

  function set<K extends keyof FuelLogDoc>(key: K, val: FuelLogDoc[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries({ ...values, total_cost: total })) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) {
        await updateDoc('Madaar Fuel Log', name, cleaned);
        toast.success('تم تحديث سجل الوقود');
      } else {
        await createDoc('Madaar Fuel Log', cleaned);
        toast.success('تم حفظ سجل الوقود');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات التعبئة">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="المركبة" required>
            <select required value={values.vehicle ?? ''} onChange={(e) => set('vehicle', e.target.value)} className={INPUT}>
              <option value="">— اختر مركبة —</option>
              {(vehicles ?? []).map((v) => <option key={v.name} value={v.name}>{v.vehicle_number ?? v.name}</option>)}
            </select>
          </Field>
          <Field label="التاريخ" required>
            <input type="date" required value={values.date ?? today} onChange={(e) => set('date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="السائق">
            <select value={values.driver ?? ''} onChange={(e) => set('driver', e.target.value)} className={INPUT}>
              <option value="">— اختر سائق —</option>
              {(drivers ?? []).map((d) => <option key={d.name} value={d.name}>{d.driver_name ?? d.name}</option>)}
            </select>
          </Field>
          <Field label="نوع الوقود">
            <input type="text" value={values.fuel_type ?? ''} onChange={(e) => set('fuel_type', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الكمية (لتر)" required>
            <input type="number" required min={0} step="0.01" dir="ltr" value={values.quantity ?? ''} onChange={(e) => set('quantity', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="سعر اللتر" required>
            <input type="number" required min={0} step="0.001" dir="ltr" value={values.unit_price ?? ''} onChange={(e) => set('unit_price', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="الإجمالي (محسوب)">
            <input type="number" readOnly dir="ltr" value={total.toFixed(3)} className={`${INPUT} bg-slate-50 dark:bg-slate-800 cursor-not-allowed`} />
          </Field>
          <Field label="قراءة العداد (كم)">
            <input type="number" min={0} dir="ltr" value={values.odometer ?? ''} onChange={(e) => set('odometer', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="المحطة / المورد">
            <input type="text" value={values.station_vendor ?? ''} onChange={(e) => set('station_vendor', e.target.value)} className={INPUT} />
          </Field>
          <Field label="طريقة الدفع">
            <select value={values.payment_method ?? 'Cash'} onChange={(e) => set('payment_method', e.target.value)} className={INPUT}>
              <option value="Cash">نقد</option>
              <option value="Card">بطاقة</option>
              <option value="Voucher">قسيمة</option>
              <option value="Account">حساب</option>
            </select>
          </Field>
          <Field label="رقم المعاملة">
            <input type="text" dir="ltr" value={values.transaction_no ?? ''} onChange={(e) => set('transaction_no', e.target.value)} className={INPUT} />
          </Field>
          <Field label="المرجع">
            <input type="text" dir="ltr" value={values.reference ?? ''} onChange={(e) => set('reference', e.target.value)} className={INPUT} />
          </Field>
        </div>
      </Card>

      <FormFooter saving={saving} onCancel={onDone} isEdit={isEdit} />
    </form>
  );
}
