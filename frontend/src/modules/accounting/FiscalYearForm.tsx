/**
 * Fiscal Year create / edit form override.
 * Matches reference `accounting/fiscal-years/form.blade.php`.
 *
 * ERPNext doctype: Fiscal Year. Map:
 *   name        → year (autoname'd by Frappe)
 *   start_date  → year_start_date
 *   end_date    → year_end_date
 *
 * ERPNext also auto-creates monthly periods inside Period Closing Voucher
 * configuration — we mirror that messaging in the info banner.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Info } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, Footer, extractFrappeError } from './AccountForm';

interface FiscalYearDoc {
  name?: string;
  year?: string;
  year_start_date?: string;
  year_end_date?: string;
  disabled?: 0 | 1;
}

export default function FiscalYearFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Fiscal Year" action="read">
      <PageShell
        title={isEdit ? 'تعديل سنة مالية' : 'إنشاء سنة مالية جديدة'}
        subtitle="سيتم إنشاء الفترات الشهرية تلقائياً"
        actions={
          <button type="button" onClick={() => navigate('/accounting/fiscal-years')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/accounting/fiscal-years')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<FiscalYearDoc>({});
  const { data: existing } = useFrappeGetDoc<FiscalYearDoc>('Fiscal Year', isEdit ? name : undefined, isEdit && name ? `fy:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof FiscalYearDoc>(key: K, val: FiscalYearDoc[K]) {
    setValues((p) => ({ ...p, [key]: val }));
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
        await updateDoc('Fiscal Year', name, cleaned);
        toast.success('تحديث');
      } else {
        await createDoc('Fiscal Year', cleaned);
        toast.success('تم إنشاء السنة المالية');
      }
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card title="بيانات السنة المالية">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="اسم السنة المالية" required>
            <input type="text" required placeholder="مثال: السنة المالية 2026" value={values.year ?? ''} onChange={(e) => set('year', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تاريخ البداية" required>
            <input type="date" required value={values.year_start_date ?? ''} onChange={(e) => set('year_start_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تاريخ النهاية" required>
            <input type="date" required value={values.year_end_date ?? ''} onChange={(e) => set('year_end_date', e.target.value)} className={INPUT} />
          </Field>
        </div>

        <div className="mt-5 p-4 bg-[color:var(--color-brand-50,#ecfdf5)] dark:bg-[color:var(--color-brand-500)]/5 border border-[color:var(--color-brand-100,#d1fae5)] dark:border-[color:var(--color-brand-500)]/10 rounded-xl">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-[color:var(--color-brand-500)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)]">ملاحظة</p>
              <p className="text-xs text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]/70 mt-1">
                سيتم إنشاء الفترات المحاسبية الشهرية تلقائياً بناءً على تاريخ البداية والنهاية. يمكنك فتح وإغلاق الفترات بشكل فردي لاحقاً.
              </p>
            </div>
          </div>
        </div>

        <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
      </Card>
    </form>
  );
}
