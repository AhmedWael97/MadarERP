/** Stock Reconciliation (adjustments) form. */
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useFrappeCreateDoc, useFrappeGetCall, useFrappeGetDoc, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { LineItemsTable } from '@/components/erp/LineItemsTable';
import { INPUT, Card, Field, Footer } from '../accounting/AccountForm';

export default function StockReconciliationFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Stock Reconciliation" action="read">
      <PageShell
        title={isEdit ? 'تعديل جرد' : 'جرد / تسوية مخزون جديد'}
        subtitle="بيانات الجرد والتسويات"
        actions={
          <button type="button" onClick={() => navigate('/inventory/adjustments')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/inventory/adjustments')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<Record<string, unknown>>({
    defaultValues: { posting_date: today, purpose: 'Stock Reconciliation' },
  });

  const { data: metaResp } = useFrappeGetCall<{ docs?: Array<{ fields: any[] }> }>(
    'frappe.desk.form.load.getdoctype',
    { doctype: 'Stock Reconciliation' },
    'meta:Stock Reconciliation',
  );
  const allFields: any[] = metaResp?.docs?.[0]?.fields ?? [];
  const itemsField = useMemo(() => allFields.find((f) => f.fieldname === 'items' && f.fieldtype === 'Table'), [allFields]);

  const { data: existing } = useFrappeGetDoc<Record<string, unknown>>(
    'Stock Reconciliation',
    isEdit ? name : undefined,
    isEdit && name ? `sr:${name}` : null,
  );
  useEffect(() => { if (existing) form.reset(existing); }, [existing]);

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  async function onSubmit(values: Record<string, unknown>) {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) await updateDoc('Stock Reconciliation', name, cleaned);
      else await createDoc('Stock Reconciliation', cleaned);
      toast.success('تم الحفظ');
      onDone();
    } catch (e: any) {
      toast.error(e?._server_messages ?? e?.message ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card title="بيانات الجرد">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="الغرض" required>
            <select required {...form.register('purpose', { required: true })} className={INPUT}>
              <option value="Stock Reconciliation">جرد وتسوية</option>
              <option value="Opening Stock">رصيد افتتاحي</option>
            </select>
          </Field>
          <Field label="التاريخ" required>
            <input type="date" required {...form.register('posting_date', { required: true })} className={INPUT} />
          </Field>
          <Field label="مرجع/سبب التسوية">
            <input type="text" {...form.register('reason')} className={INPUT} placeholder="—" />
          </Field>
          <div className="md:col-span-3">
            <Field label="ملاحظات">
              <textarea rows={2} {...form.register('remarks')} className={INPUT + ' resize-none'} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">الأصناف</h3>
        </div>
        <div className="p-4">
          {itemsField ? (
            <LineItemsTable parentDoctype="Stock Reconciliation" parentField={itemsField} childDoctype={itemsField.options} form={form as any} />
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">جاري تحميل جدول الأصناف...</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5">
          <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
        </div>
      </div>
    </form>
  );
}
