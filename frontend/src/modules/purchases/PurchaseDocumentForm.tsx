/**
 * PurchaseDocumentForm — shared form for the 3 purchase transaction doctypes:
 *   Purchase Invoice / Purchase Order / Purchase Invoice with is_return=1.
 *
 * Mirrors `SalesDocumentForm` with Supplier instead of Customer. The header
 * layout, line items table, totals card and footer are all the same — only
 * the doctype, customer→supplier field name, and a few Arabic labels change.
 */
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  useFrappeCreateDoc,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { LineItemsTable } from '@/components/erp/LineItemsTable';
import { INPUT, Card, Field, Footer } from '../accounting/AccountForm';

export type PurchaseVariant = 'invoice' | 'order' | 'return';

interface VariantConfig {
  doctype: string;
  titleNew: string;
  titleEdit: string;
  subtitle: string;
  listPath: string;
  isReturn?: boolean;
  dateField: 'posting_date' | 'transaction_date';
}

const VARIANTS: Record<PurchaseVariant, VariantConfig> = {
  invoice: { doctype: 'Purchase Invoice', titleNew: 'فاتورة مشتريات جديدة', titleEdit: 'تعديل فاتورة', subtitle: 'فاتورة المشتريات', listPath: '/purchases/invoices', dateField: 'posting_date' },
  order:   { doctype: 'Purchase Order',   titleNew: 'أمر شراء جديد',        titleEdit: 'تعديل أمر شراء', subtitle: 'أوامر الشراء',     listPath: '/purchases/orders',   dateField: 'transaction_date' },
  return:  { doctype: 'Purchase Invoice', titleNew: 'مرتجع مشتريات جديد',  titleEdit: 'تعديل مرتجع',   subtitle: 'مرتجعات المشتريات', listPath: '/purchases/returns', dateField: 'posting_date', isReturn: true },
};

export default function PurchaseDocumentForm({ variant, mode }: { variant: PurchaseVariant; mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const cfg = VARIANTS[variant];
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype={cfg.doctype} action="read">
      <PageShell
        title={isEdit ? cfg.titleEdit : cfg.titleNew}
        subtitle={cfg.subtitle}
        actions={
          <button type="button" onClick={() => navigate(cfg.listPath)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body cfg={cfg} mode={mode} name={id} onDone={() => navigate(cfg.listPath)} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ cfg, mode, name, onDone }: { cfg: VariantConfig; mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<Record<string, unknown>>({
    defaultValues: { [cfg.dateField]: today, is_return: cfg.isReturn ? 1 : 0 },
  });

  const { data: metaResp } = useFrappeGetCall<{ docs?: Array<{ fields: any[] }> }>(
    'frappe.desk.form.load.getdoctype',
    { doctype: cfg.doctype },
    `meta:${cfg.doctype}`,
  );
  const allFields: any[] = metaResp?.docs?.[0]?.fields ?? [];
  const itemsField = useMemo(() => allFields.find((f) => f.fieldname === 'items' && f.fieldtype === 'Table'), [allFields]);

  const { data: existing } = useFrappeGetDoc<Record<string, unknown>>(
    cfg.doctype,
    isEdit ? name : undefined,
    isEdit && name ? `pd:${cfg.doctype}:${name}` : null,
  );
  useEffect(() => { if (existing) form.reset(existing); }, [existing]);

  const { data: suppliers } = useFrappeGetDocList<{ name: string; supplier_name?: string; madaar_supplier_code?: string }>('Supplier', {
    fields: ['name', 'supplier_name', 'madaar_supplier_code'],
    limit: 200,
  });
  const { data: warehouses } = useFrappeGetDocList<{ name: string }>('Warehouse', { fields: ['name'], limit: 100 });
  const { data: costCenters } = useFrappeGetDocList<{ name: string }>('Cost Center', { fields: ['name'], limit: 100 });
  const { data: projects } = useFrappeGetDocList<{ name: string }>('Project', { fields: ['name'], limit: 200 });
  const { data: paymentTerms } = useFrappeGetDocList<{ name: string }>('Payment Terms Template', { fields: ['name'], limit: 100 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  async function onSubmit(values: Record<string, unknown>) {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    if (cfg.isReturn) cleaned.is_return = 1;
    try {
      if (isEdit && name) {
        await updateDoc(cfg.doctype, name, cleaned);
        toast.success('تحديث');
      } else {
        await createDoc(cfg.doctype, cleaned);
        toast.success('تم الحفظ');
      }
      onDone();
    } catch (e: any) {
      toast.error(extract(e) ?? 'تعذر الحفظ');
    }
  }

  const v = form.watch();
  const total = Number(v.total ?? 0);
  const discount = Number(v.discount_amount ?? 0);
  const tax = Number(v.total_taxes_and_charges ?? 0);
  const grand = Number(v.grand_total ?? total - discount + tax);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card title="بيانات الفاتورة">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Field label="اسم المورد" required>
            <select required {...form.register('supplier', { required: true })} className={INPUT}>
              <option value="">— اختر المورد —</option>
              {(suppliers ?? []).map((s) => (
                <option key={s.name} value={s.name}>
                  {s.madaar_supplier_code ? `${s.madaar_supplier_code} — ` : ''}{s.supplier_name ?? s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="المسلسل">
            <input type="text" value={String(form.watch('name') ?? 'تلقائي')} readOnly className={INPUT + ' bg-slate-100 cursor-not-allowed'} dir="ltr" />
          </Field>
          <Field label="إسم المشروع">
            <select {...form.register('project')} className={INPUT}>
              <option value="">— بدون —</option>
              {(projects ?? []).map((p) => (<option key={p.name} value={p.name}>{p.name}</option>))}
            </select>
          </Field>
          <Field label="شروط الدفع">
            <select {...form.register('payment_terms_template')} className={INPUT}>
              <option value="">— نقدي —</option>
              {(paymentTerms ?? []).map((p) => (<option key={p.name} value={p.name}>{p.name}</option>))}
            </select>
          </Field>
          <Field label="المخزن">
            <select {...form.register('set_warehouse')} className={INPUT}>
              <option value="">— المخازن —</option>
              {(warehouses ?? []).map((w) => (<option key={w.name} value={w.name}>{w.name}</option>))}
            </select>
          </Field>
          <Field label="التاريخ" required>
            <input type="date" required {...form.register(cfg.dateField, { required: true })} className={INPUT} />
          </Field>
          <Field label="مركز التكلفة">
            <select {...form.register('cost_center')} className={INPUT}>
              <option value="">— بدون —</option>
              {(costCenters ?? []).map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
            </select>
          </Field>
          <Field label="رقم فاتورة المورد">
            <input type="text" placeholder="رقم فاتورة المورد" {...form.register('bill_no')} className={INPUT} dir="ltr" />
          </Field>
          <div className="md:col-span-4">
            <Field label="ملاحظات">
              <textarea rows={2} placeholder="ملاحظات" {...form.register('remarks')} className={INPUT + ' resize-none'} />
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
            <LineItemsTable
              parentDoctype={cfg.doctype}
              parentField={itemsField}
              childDoctype={itemsField.options}
              form={form as any}
            />
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">جاري تحميل جدول الأصناف...</p>
          )}
        </div>
      </div>

      <Card title="الإجماليات">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Totals label="إجمالى الفاتورة" value={total} />
          <Totals label="إجمالي الخصم" value={discount} color="red" />
          <Totals label="إجمالي الضريبة" value={tax} color="slate" />
          <Totals label="الإجمالي النهائي" value={grand} color="brand" big />
        </div>
        <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
      </Card>
    </form>
  );
}

function Totals({ label, value, color = 'slate', big }: { label: string; value: number; color?: 'red' | 'brand' | 'slate'; big?: boolean }) {
  const txt = color === 'red' ? 'text-red-600' : color === 'brand' ? 'text-[color:var(--color-brand-600)]' : 'text-slate-800 dark:text-white';
  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 text-center border border-slate-100 dark:border-white/5">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`${big ? 'text-2xl' : 'text-lg'} font-bold ${txt} font-mono`} dir="ltr">{fmtNum(value)}</p>
    </div>
  );
}
function fmtNum(n: number) { try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); } catch { return String(n); } }
function extract(err: any): string | null {
  const sm = err?._server_messages ?? err?.response?.data?._server_messages;
  if (!sm) return null;
  try {
    const arr = typeof sm === 'string' ? JSON.parse(sm) : sm;
    return arr.map((s: any) => (typeof s === 'string' ? JSON.parse(s) : s)).map((m: any) => m.message ?? '').filter(Boolean).join('\n') || null;
  } catch { return null; }
}
