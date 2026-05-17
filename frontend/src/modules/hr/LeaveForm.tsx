/** Leave Application create/edit. ERPNext doctype: Leave Application. */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, Footer, extractFrappeError } from '../accounting/AccountForm';

interface LeaveDoc {
  name?: string;
  employee?: string;
  leave_type?: string;
  from_date?: string;
  to_date?: string;
  half_day?: 0 | 1;
  description?: string;
  status?: 'Open' | 'Approved' | 'Rejected' | 'Cancelled';
}

export default function LeaveFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Leave Application" action="read">
      <PageShell
        title={isEdit ? 'تعديل طلب إجازة' : 'طلب إجازة جديد'}
        subtitle="بيانات الإجازة"
        actions={
          <button type="button" onClick={() => navigate('/hr/leaves')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/hr/leaves')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<LeaveDoc>({ status: 'Open', from_date: today, to_date: today });
  const { data: existing } = useFrappeGetDoc<LeaveDoc>('Leave Application', isEdit ? name : undefined, isEdit && name ? `la:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: employees } = useFrappeGetDocList<{ name: string; employee_name?: string }>('Employee', { fields: ['name', 'employee_name'], limit: 500 });
  const { data: leaveTypes } = useFrappeGetDocList<{ name: string }>('Leave Type', { fields: ['name'], limit: 50 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof LeaveDoc>(key: K, val: LeaveDoc[K]) { setValues((p) => ({ ...p, [key]: val })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) await updateDoc('Leave Application', name, cleaned);
      else await createDoc('Leave Application', cleaned);
      toast.success('تم الحفظ');
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card title="بيانات الإجازة">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="الموظف" required>
            <select required value={values.employee ?? ''} onChange={(e) => set('employee', e.target.value)} className={INPUT}>
              <option value="">— اختر —</option>
              {(employees ?? []).map((emp) => (<option key={emp.name} value={emp.name}>{emp.employee_name ?? emp.name}</option>))}
            </select>
          </Field>
          <Field label="نوع الإجازة" required>
            <select required value={values.leave_type ?? ''} onChange={(e) => set('leave_type', e.target.value)} className={INPUT}>
              <option value="">— اختر —</option>
              {(leaveTypes ?? []).map((lt) => (<option key={lt.name} value={lt.name}>{lt.name}</option>))}
            </select>
          </Field>
          <Field label="من تاريخ" required>
            <input type="date" required value={values.from_date ?? ''} onChange={(e) => set('from_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="إلى تاريخ" required>
            <input type="date" required value={values.to_date ?? ''} onChange={(e) => set('to_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الحالة">
            <select value={values.status ?? 'Open'} onChange={(e) => set('status', e.target.value as LeaveDoc['status'])} className={INPUT}>
              <option value="Open">قيد المراجعة</option>
              <option value="Approved">موافق</option>
              <option value="Rejected">مرفوض</option>
              <option value="Cancelled">ملغاة</option>
            </select>
          </Field>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!values.half_day} onChange={(e) => set('half_day', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]" />
              <span className="text-sm text-slate-600 dark:text-slate-400">نصف يوم</span>
            </label>
          </div>
          <div className="md:col-span-2">
            <Field label="السبب">
              <textarea rows={3} value={values.description ?? ''} onChange={(e) => set('description', e.target.value)} className={INPUT + ' resize-none'} placeholder="سبب طلب الإجازة..." />
            </Field>
          </div>
        </div>
        <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
      </Card>
    </form>
  );
}
