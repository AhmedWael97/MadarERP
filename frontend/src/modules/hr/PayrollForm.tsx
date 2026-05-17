/** Salary Slip create/edit. ERPNext doctype: Salary Slip. */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, Footer, extractFrappeError } from '../accounting/AccountForm';

interface SlipDoc {
  name?: string;
  employee?: string;
  start_date?: string;
  end_date?: string;
  posting_date?: string;
  gross_pay?: number;
  total_deduction?: number;
  net_pay?: number;
}

export default function PayrollFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Salary Slip" action="read">
      <PageShell
        title={isEdit ? 'تعديل مسير راتب' : 'مسير راتب جديد'}
        subtitle="بيانات الراتب"
        actions={
          <button type="button" onClick={() => navigate('/hr/payroll')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/hr/payroll')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<SlipDoc>({ posting_date: today });
  const { data: existing } = useFrappeGetDoc<SlipDoc>('Salary Slip', isEdit ? name : undefined, isEdit && name ? `ss:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: employees } = useFrappeGetDocList<{ name: string; employee_name?: string }>('Employee', { fields: ['name', 'employee_name'], limit: 500 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof SlipDoc>(key: K, val: SlipDoc[K]) { setValues((p) => ({ ...p, [key]: val })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) await updateDoc('Salary Slip', name, cleaned);
      else await createDoc('Salary Slip', cleaned);
      toast.success('تم الحفظ');
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card title="بيانات الراتب">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="الموظف" required>
            <select required value={values.employee ?? ''} onChange={(e) => set('employee', e.target.value)} className={INPUT}>
              <option value="">— اختر —</option>
              {(employees ?? []).map((emp) => (<option key={emp.name} value={emp.name}>{emp.employee_name ?? emp.name}</option>))}
            </select>
          </Field>
          <Field label="من تاريخ" required>
            <input type="date" required value={values.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="إلى تاريخ" required>
            <input type="date" required value={values.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تاريخ الإصدار">
            <input type="date" value={values.posting_date ?? ''} onChange={(e) => set('posting_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="إجمالي الاستحقاقات">
            <input type="number" step="0.01" dir="ltr" value={values.gross_pay ?? ''} onChange={(e) => set('gross_pay', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="إجمالي الخصومات">
            <input type="number" step="0.01" dir="ltr" value={values.total_deduction ?? ''} onChange={(e) => set('total_deduction', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="صافي الراتب">
            <input type="number" step="0.01" dir="ltr" value={values.net_pay ?? ''} onChange={(e) => set('net_pay', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT + ' font-mono font-bold text-[color:var(--color-brand-600)]'} />
          </Field>
        </div>
        <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
      </Card>
    </form>
  );
}
