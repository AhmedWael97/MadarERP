import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, TEXTAREA, Card, Field, FormFooter, extractFrappeError } from '../../fleet/FleetFormHelpers';

interface ProjectDoc {
  name?: string;
  project_code?: string;
  name_ar?: string;
  name_en?: string;
  project_type?: string;
  status?: string;
  customer?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  manager?: string;
  contract_value?: number;
  estimated_budget?: number;
  retention_percentage?: number;
  advance_payment?: number;
  cost_center?: string;
  notes?: string;
}

export default function ConstructionProjectFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Madaar Construction Project" action="read">
      <PageShell
        title={isEdit ? `تعديل مشروع: ${id ?? ''}` : 'إنشاء مشروع إنشاء جديد'}
        subtitle="بيانات مشروع المقاولات"
        actions={
          <button type="button" onClick={() => navigate('/construction/projects')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/construction/projects')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<ProjectDoc>({ status: 'Planning', retention_percentage: 10 });

  const { data: existing } = useFrappeGetDoc<ProjectDoc>('Madaar Construction Project', isEdit ? name : undefined, isEdit && name ? `conprj:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: customers } = useFrappeGetDocList<{ name: string; customer_name?: string }>('Customer', { fields: ['name', 'customer_name'], limit: 300 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof ProjectDoc>(key: K, val: ProjectDoc[K]) {
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
        await updateDoc('Madaar Construction Project', name, cleaned);
        toast.success('تم تحديث المشروع');
      } else {
        await createDoc('Madaar Construction Project', cleaned);
        toast.success('تم حفظ المشروع');
      }
      onDone();
    } catch (e: any) { toast.error(extractFrappeError(e) ?? 'تعذر الحفظ'); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="البيانات الأساسية">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="كود المشروع">
            <input type="text" dir="ltr" value={values.project_code ?? ''} onChange={(e) => set('project_code', e.target.value)} className={INPUT} />
          </Field>
          <Field label="اسم المشروع بالعربية" required>
            <input type="text" required value={values.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} className={INPUT} />
          </Field>
          <Field label="اسم المشروع بالإنجليزية">
            <input type="text" dir="ltr" value={values.name_en ?? ''} onChange={(e) => set('name_en', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نوع المشروع">
            <select value={values.project_type ?? ''} onChange={(e) => set('project_type', e.target.value)} className={INPUT}>
              <option value="">— اختر —</option>
              <option value="Building">مباني</option>
              <option value="Roads">طرق</option>
              <option value="Infrastructure">بنية تحتية</option>
              <option value="Electrical">كهربائي</option>
              <option value="Mechanical">ميكانيكي</option>
              <option value="Finishing">تشطيبات</option>
              <option value="Other">أخرى</option>
            </select>
          </Field>
          <Field label="الحالة">
            <select value={values.status ?? 'Planning'} onChange={(e) => set('status', e.target.value)} className={INPUT}>
              <option value="Planning">تخطيط</option>
              <option value="In Progress">جاري</option>
              <option value="Completed">مكتمل</option>
              <option value="On Hold">معلق</option>
              <option value="Cancelled">ملغى</option>
            </select>
          </Field>
          <Field label="العميل">
            <select value={values.customer ?? ''} onChange={(e) => set('customer', e.target.value)} className={INPUT}>
              <option value="">— بدون —</option>
              {(customers ?? []).map((c) => <option key={c.name} value={c.name}>{c.customer_name ?? c.name}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="الموقع">
              <input type="text" value={values.location ?? ''} onChange={(e) => set('location', e.target.value)} className={INPUT} />
            </Field>
          </div>
          <Field label="تاريخ البداية">
            <input type="date" value={values.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تاريخ الانتهاء">
            <input type="date" value={values.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)} className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="البيانات المالية">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="قيمة العقد">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.contract_value ?? ''} onChange={(e) => set('contract_value', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="الميزانية التقديرية">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.estimated_budget ?? ''} onChange={(e) => set('estimated_budget', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="نسبة الاستبقاء %">
            <input type="number" min={0} max={100} step="0.1" dir="ltr" value={values.retention_percentage ?? 10} onChange={(e) => set('retention_percentage', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="دفعة مقدمة">
            <input type="number" min={0} step="0.01" dir="ltr" value={values.advance_payment ?? ''} onChange={(e) => set('advance_payment', Number(e.target.value))} className={INPUT} />
          </Field>
          <Field label="مركز التكلفة">
            <input type="text" value={values.cost_center ?? ''} onChange={(e) => set('cost_center', e.target.value)} className={INPUT} />
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
