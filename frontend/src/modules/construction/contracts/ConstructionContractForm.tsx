import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, TEXTAREA, Card, Field, FormFooter, extractFrappeError } from '../../fleet/FleetFormHelpers';

interface ContractDoc {
  name?: string;
  contract_number?: string;
  project?: string;
  date?: string;
  contract_type?: string;
  status?: string;
  client?: string;
  contract_value?: number;
  retention_percentage?: number;
  advance_percentage?: number;
  start_date?: string;
  end_date?: string;
  scope_of_work?: string;
}

export default function ConstructionContractFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Construction Contract" action="read">
      <PageShell
        title={isEdit ? `تعديل عقد: ${id ?? ''}` : 'إضافة عقد جديد'}
        subtitle="عقود مشاريع الإنشاء"
        actions={
          <button type="button" onClick={() => navigate('/construction/contracts')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/construction/contracts')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<ContractDoc>({ status: 'Draft', retention_percentage: 10, date: today });

  const { data: existing } = useFrappeGetDoc<ContractDoc>('Madaar Construction Contract', isEdit ? name : undefined, isEdit && name ? `contract:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: projects } = useFrappeGetDocList<{ name: string; name_ar?: string }>('Madaar Construction Project', { fields: ['name', 'name_ar'], limit: 200 });
  const { data: customers } = useFrappeGetDocList<{ name: string; customer_name?: string }>('Customer', { fields: ['name', 'customer_name'], limit: 300 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof ContractDoc>(key: K, val: ContractDoc[K]) {
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
        await updateDoc('Madaar Construction Contract', name, cleaned);
        toast.success('تم تحديث العقد');
      } else {
        await createDoc('Madaar Construction Contract', cleaned);
        toast.success('تم حفظ العقد');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات العقد">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="رقم العقد">
            <input type="text" dir="ltr" value={values.contract_number ?? ''} onChange={(e) => set('contract_number', e.target.value)} className={INPUT} />
          </Field>
          <Field label="المشروع" required>
            <select required value={values.project ?? ''} onChange={(e) => set('project', e.target.value)} className={INPUT}>
              <option value="">— اختر مشروع —</option>
              {(projects ?? []).map((p) => <option key={p.name} value={p.name}>{p.name_ar ?? p.name}</option>)}
            </select>
          </Field>
          <Field label="التاريخ">
            <input type="date" value={values.date ?? today} onChange={(e) => set('date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نوع العقد">
            <select value={values.contract_type ?? ''} onChange={(e) => set('contract_type', e.target.value)} className={INPUT}>
              <option value="">— اختر —</option>
              <option value="Fixed Price">سعر ثابت</option>
              <option value="Unit Rate">سعر وحدة</option>
              <option value="Cost Plus">التكلفة + هامش</option>
              <option value="Design & Build">تصميم وتنفيذ</option>
              <option value="Other">أخرى</option>
            </select>
          </Field>
          <Field label="الحالة">
            <select value={values.status ?? 'Draft'} onChange={(e) => set('status', e.target.value)} className={INPUT}>
              <option value="Draft">مسودة</option>
              <option value="Active">نشط</option>
              <option value="Completed">مكتمل</option>
              <option value="Terminated">منهي</option>
              <option value="Suspended">موقوف</option>
            </select>
          </Field>
          <Field label="العميل">
            <select value={values.client ?? ''} onChange={(e) => set('client', e.target.value)} className={INPUT}>
              <option value="">— بدون —</option>
              {(customers ?? []).map((c) => <option key={c.name} value={c.name}>{c.customer_name ?? c.name}</option>)}
            </select>
          </Field>
          <Field label="قيمة العقد">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.contract_value ?? ''} onChange={(e) => set('contract_value', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="نسبة الاستبقاء %">
            <input type="number" min={0} max={100} step="0.1" dir="ltr" value={values.retention_percentage ?? 10} onChange={(e) => set('retention_percentage', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="نسبة الدفعة المقدمة %">
            <input type="number" min={0} max={100} step="0.1" dir="ltr" value={values.advance_percentage ?? ''} onChange={(e) => set('advance_percentage', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="تاريخ البداية">
            <input type="date" value={values.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تاريخ الانتهاء">
            <input type="date" value={values.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)} className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="نطاق العمل">
        <textarea value={values.scope_of_work ?? ''} onChange={(e) => set('scope_of_work', e.target.value)} className={TEXTAREA} style={{ minHeight: '160px' }} placeholder="وصف نطاق العمل المتفق عليه..." />
      </Card>

      <FormFooter saving={saving} onCancel={onDone} isEdit={isEdit} />
    </form>
  );
}
