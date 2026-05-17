/**
 * HR > Employee — create/edit form override.
 * Mirrors reference `hr/employees/form.blade.php`. Reference has 3 sections:
 *   - Personal Info (name, national id, phone, email, DOB, gender, marital, address)
 *   - Employment (job title, department, hire date, employment status, manager)
 *   - Financial (basic salary, bank info)
 *
 * ERPNext doctype: Employee. Map:
 *   name_ar         → employee_name
 *   name_en         → madaar_name_en (Custom Field)
 *   national_id     → madaar_national_id (Custom Field)
 *   phone           → cell_number / madaar_phone
 *   email           → personal_email
 *   date_of_birth   → date_of_birth
 *   gender          → gender (Male/Female)
 *   marital_status  → marital_status
 *   address         → current_address
 *   job_title       → designation
 *   department_id   → department
 *   hire_date       → date_of_joining
 *   employment_status → status (Active/Left/Suspended/Inactive)
 *   manager_id      → reports_to
 *   basic_salary    → ctc / madaar_basic_salary
 *   bank_name       → bank_name
 *   bank_account    → bank_ac_no
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, BriefcaseBusiness, User, Wallet } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, Footer, extractFrappeError } from '../accounting/AccountForm';

interface EmpDoc {
  name?: string;
  employee_name?: string;
  designation?: string;
  department?: string;
  date_of_joining?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female';
  marital_status?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  status?: 'Active' | 'Inactive' | 'Suspended' | 'Left';
  cell_number?: string;
  personal_email?: string;
  current_address?: string;
  reports_to?: string;
  bank_name?: string;
  bank_ac_no?: string;
  ctc?: number;
  madaar_name_en?: string;
  madaar_national_id?: string;
  madaar_basic_salary?: number;
}

export default function EmployeeFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Employee" action="read">
      <PageShell
        title={isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
        subtitle="البيانات الشخصية والوظيفية والمالية"
        actions={
          <button type="button" onClick={() => navigate('/hr/employees')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/hr/employees')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<EmpDoc>({ status: 'Active', gender: 'Male' });
  const { data: existing } = useFrappeGetDoc<EmpDoc>('Employee', isEdit ? name : undefined, isEdit && name ? `emp:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: departments } = useFrappeGetDocList<{ name: string }>('Department', { fields: ['name'], limit: 200 });
  const { data: managers } = useFrappeGetDocList<{ name: string; employee_name?: string }>('Employee', { fields: ['name', 'employee_name'], limit: 500 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof EmpDoc>(key: K, val: EmpDoc[K]) { setValues((p) => ({ ...p, [key]: val })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) await updateDoc('Employee', name, cleaned);
      else await createDoc('Employee', cleaned);
      toast.success('تم الحفظ');
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title={<span className="inline-flex items-center gap-2"><User size={16} /> البيانات الشخصية</span> as any}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="الاسم بالعربية" required>
            <input type="text" required value={values.employee_name ?? ''} onChange={(e) => set('employee_name', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input type="text" dir="ltr" value={values.madaar_name_en ?? ''} onChange={(e) => set('madaar_name_en', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الرقم القومي">
            <input type="text" dir="ltr" value={values.madaar_national_id ?? ''} onChange={(e) => set('madaar_national_id', e.target.value)} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="الهاتف">
            <input type="text" dir="ltr" value={values.cell_number ?? ''} onChange={(e) => set('cell_number', e.target.value)} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="البريد الإلكتروني">
            <input type="email" dir="ltr" value={values.personal_email ?? ''} onChange={(e) => set('personal_email', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تاريخ الميلاد">
            <input type="date" value={values.date_of_birth ?? ''} onChange={(e) => set('date_of_birth', e.target.value)} className={INPUT} />
          </Field>
          <Field label="النوع">
            <select value={values.gender ?? 'Male'} onChange={(e) => set('gender', e.target.value as 'Male' | 'Female')} className={INPUT}>
              <option value="Male">ذكر</option>
              <option value="Female">أنثى</option>
            </select>
          </Field>
          <Field label="الحالة الاجتماعية">
            <select value={values.marital_status ?? ''} onChange={(e) => set('marital_status', e.target.value as EmpDoc['marital_status'])} className={INPUT}>
              <option value="">— بدون —</option>
              <option value="Single">أعزب</option>
              <option value="Married">متزوج</option>
              <option value="Divorced">مطلق</option>
              <option value="Widowed">أرمل</option>
            </select>
          </Field>
          <div className="md:col-span-3">
            <Field label="العنوان">
              <input type="text" value={values.current_address ?? ''} onChange={(e) => set('current_address', e.target.value)} className={INPUT} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title={<span className="inline-flex items-center gap-2"><BriefcaseBusiness size={16} /> البيانات الوظيفية</span> as any}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="المسمى الوظيفي">
            <input type="text" value={values.designation ?? ''} onChange={(e) => set('designation', e.target.value)} className={INPUT} />
          </Field>
          <Field label="القسم">
            <select value={values.department ?? ''} onChange={(e) => set('department', e.target.value)} className={INPUT}>
              <option value="">— بدون —</option>
              {(departments ?? []).map((d) => (<option key={d.name} value={d.name}>{d.name}</option>))}
            </select>
          </Field>
          <Field label="تاريخ التعيين">
            <input type="date" value={values.date_of_joining ?? ''} onChange={(e) => set('date_of_joining', e.target.value)} className={INPUT} />
          </Field>
          <Field label="حالة الموظف">
            <select value={values.status ?? 'Active'} onChange={(e) => set('status', e.target.value as EmpDoc['status'])} className={INPUT}>
              <option value="Active">نشط</option>
              <option value="Inactive">غير نشط</option>
              <option value="Suspended">موقوف</option>
              <option value="Left">منتهي الخدمة</option>
            </select>
          </Field>
          <Field label="المدير المباشر">
            <select value={values.reports_to ?? ''} onChange={(e) => set('reports_to', e.target.value)} className={INPUT}>
              <option value="">— بدون —</option>
              {(managers ?? []).filter((m) => m.name !== name).map((m) => (<option key={m.name} value={m.name}>{m.employee_name ?? m.name}</option>))}
            </select>
          </Field>
        </div>
      </Card>

      <Card title={<span className="inline-flex items-center gap-2"><Wallet size={16} /> البيانات المالية</span> as any}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="الراتب الأساسي">
            <input type="number" step="0.01" min={0} dir="ltr" placeholder="0.00" value={values.madaar_basic_salary ?? ''} onChange={(e) => set('madaar_basic_salary', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="اسم البنك">
            <input type="text" value={values.bank_name ?? ''} onChange={(e) => set('bank_name', e.target.value)} className={INPUT} />
          </Field>
          <Field label="رقم الحساب البنكي">
            <input type="text" dir="ltr" value={values.bank_ac_no ?? ''} onChange={(e) => set('bank_ac_no', e.target.value)} className={INPUT + ' font-mono'} />
          </Field>
        </div>

        <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
      </Card>
    </form>
  );
}
