/** Attendance create/edit. ERPNext doctype: Attendance. */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, Footer, extractFrappeError } from '../accounting/AccountForm';

interface AttDoc {
  name?: string;
  employee?: string;
  attendance_date?: string;
  status?: 'Present' | 'Absent' | 'On Leave' | 'Half Day' | 'Work From Home';
  shift?: string;
  in_time?: string;
  out_time?: string;
  late_entry?: 0 | 1;
  early_exit?: 0 | 1;
}

export default function AttendanceFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Attendance" action="read">
      <PageShell
        title={isEdit ? 'تعديل سجل حضور' : 'إضافة سجل حضور'}
        subtitle="بيانات الحضور والانصراف"
        actions={
          <button type="button" onClick={() => navigate('/hr/attendance')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/hr/attendance')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<AttDoc>({ status: 'Present', attendance_date: today });
  const { data: existing } = useFrappeGetDoc<AttDoc>('Attendance', isEdit ? name : undefined, isEdit && name ? `att:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: employees } = useFrappeGetDocList<{ name: string; employee_name?: string }>('Employee', { fields: ['name', 'employee_name'], limit: 500 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof AttDoc>(key: K, val: AttDoc[K]) { setValues((p) => ({ ...p, [key]: val })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) await updateDoc('Attendance', name, cleaned);
      else await createDoc('Attendance', cleaned);
      toast.success('تم الحفظ');
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card title="بيانات الحضور">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="الموظف" required>
            <select required value={values.employee ?? ''} onChange={(e) => set('employee', e.target.value)} className={INPUT}>
              <option value="">— اختر الموظف —</option>
              {(employees ?? []).map((emp) => (<option key={emp.name} value={emp.name}>{emp.employee_name ?? emp.name}</option>))}
            </select>
          </Field>
          <Field label="التاريخ" required>
            <input type="date" required value={values.attendance_date ?? ''} onChange={(e) => set('attendance_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الحالة" required>
            <select required value={values.status ?? 'Present'} onChange={(e) => set('status', e.target.value as AttDoc['status'])} className={INPUT}>
              <option value="Present">حاضر</option>
              <option value="Absent">غائب</option>
              <option value="On Leave">في إجازة</option>
              <option value="Half Day">نصف يوم</option>
              <option value="Work From Home">عمل من المنزل</option>
            </select>
          </Field>
          <Field label="الوردية">
            <input type="text" value={values.shift ?? ''} onChange={(e) => set('shift', e.target.value)} className={INPUT} />
          </Field>
          <Field label="وقت الحضور">
            <input type="time" value={values.in_time ?? ''} onChange={(e) => set('in_time', e.target.value)} className={INPUT} />
          </Field>
          <Field label="وقت الانصراف">
            <input type="time" value={values.out_time ?? ''} onChange={(e) => set('out_time', e.target.value)} className={INPUT} />
          </Field>
          <div className="flex items-center gap-6 md:col-span-2 pt-3 border-t border-slate-100 dark:border-white/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!values.late_entry} onChange={(e) => set('late_entry', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]" />
              <span className="text-sm text-slate-600 dark:text-slate-400">دخول متأخر</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!values.early_exit} onChange={(e) => set('early_exit', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]" />
              <span className="text-sm text-slate-600 dark:text-slate-400">انصراف مبكر</span>
            </label>
          </div>
        </div>
        <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
      </Card>
    </form>
  );
}
