/**
 * Stock Entry create/edit — shared for /inventory/movements and /inventory/transfers.
 * ERPNext doctype: Stock Entry. The variant chooses the default `stock_entry_type`:
 *   movements → "Material Receipt" / "Material Issue" / "Manufacture" / etc.
 *   transfers → "Material Transfer" (between warehouses)
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

export type StockEntryVariant = 'movement' | 'transfer';

const VARIANTS: Record<StockEntryVariant, { title: string; subtitle: string; listPath: string; defaultType: string; allowedTypes: string[] }> = {
  movement: {
    title: 'حركة مخزون',
    subtitle: 'استلام / صرف / تصنيع',
    listPath: '/inventory/movements',
    defaultType: 'Material Receipt',
    // ERPNext's full set, minus Material Transfer (that's its own variant).
    allowedTypes: ['Material Receipt', 'Material Issue', 'Material Consumption for Manufacture', 'Manufacture', 'Repack', 'Send to Subcontractor'],
  },
  transfer: {
    title: 'تحويل مخزون',
    subtitle: 'تحويل بين مخزنين',
    listPath: '/inventory/transfers',
    defaultType: 'Material Transfer',
    allowedTypes: ['Material Transfer', 'Material Transfer for Manufacture'],
  },
};

export default function StockEntryFormPage({ variant, mode }: { variant: StockEntryVariant; mode: 'create' | 'edit' }) {
  const cfg = VARIANTS[variant];
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Stock Entry" action="read">
      <PageShell
        title={isEdit ? `تعديل ${cfg.title}` : `${cfg.title} جديد`}
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

function Body({ cfg, mode, name, onDone }: { cfg: typeof VARIANTS['movement']; mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<Record<string, unknown>>({
    defaultValues: { posting_date: today, stock_entry_type: cfg.defaultType },
  });

  const { data: metaResp } = useFrappeGetCall<{ docs?: Array<{ fields: any[] }> }>(
    'frappe.desk.form.load.getdoctype',
    { doctype: 'Stock Entry' },
    'meta:Stock Entry',
  );
  const allFields: any[] = metaResp?.docs?.[0]?.fields ?? [];
  const itemsField = useMemo(() => allFields.find((f) => f.fieldname === 'items' && f.fieldtype === 'Table'), [allFields]);

  const { data: existing } = useFrappeGetDoc<Record<string, unknown>>(
    'Stock Entry',
    isEdit ? name : undefined,
    isEdit && name ? `se:${name}` : null,
  );
  useEffect(() => { if (existing) form.reset(existing); }, [existing]);

  const { data: warehouses } = useFrappeGetDocList<{ name: string }>('Warehouse', { fields: ['name'], limit: 200 });

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
      if (isEdit && name) await updateDoc('Stock Entry', name, cleaned);
      else await createDoc('Stock Entry', cleaned);
      toast.success('تم الحفظ');
      onDone();
    } catch (e: any) {
      toast.error(e?._server_messages ?? e?.message ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card title="بيانات الحركة">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="النوع" required>
            <select required {...form.register('stock_entry_type', { required: true })} className={INPUT}>
              {cfg.allowedTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </Field>
          <Field label="التاريخ" required>
            <input type="date" required {...form.register('posting_date', { required: true })} className={INPUT} />
          </Field>
          <Field label="رقم المرجع">
            <input type="text" dir="ltr" {...form.register('inspection_required')} className={INPUT} placeholder="—" />
          </Field>
          <Field label="من مخزن">
            <select {...form.register('from_warehouse')} className={INPUT}>
              <option value="">— بدون —</option>
              {(warehouses ?? []).map((w) => (<option key={w.name} value={w.name}>{w.name}</option>))}
            </select>
          </Field>
          <Field label="إلى مخزن">
            <select {...form.register('to_warehouse')} className={INPUT}>
              <option value="">— بدون —</option>
              {(warehouses ?? []).map((w) => (<option key={w.name} value={w.name}>{w.name}</option>))}
            </select>
          </Field>
          <div className="md:col-span-3">
            <Field label="البيان">
              <textarea rows={2} {...form.register('remarks')} className={INPUT + ' resize-none'} placeholder="ملاحظات الحركة" />
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
            <LineItemsTable parentDoctype="Stock Entry" parentField={itemsField} childDoctype={itemsField.options} form={form as any} />
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
