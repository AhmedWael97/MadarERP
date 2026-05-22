/**
 * Credit Note (إشعار دائن) create form.
 * A credit note records a reduction in the amount owed by a customer.
 * In ERPNext this is modelled as a Sales Invoice with is_return = 1.
 * Reference: 054_إشعارات-دائنة.png
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Check, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, extractFrappeError } from '@/modules/accounting/AccountForm';

interface CreditNoteDoc {
  posting_date?: string;
  customer?: string;
  return_against?: string;
  total?: number;
  debit_to?: string;
  remarks?: string;
}

export default function Page() {
  const navigate = useNavigate();
  return (
    <RequirePerm doctype="Sales Invoice" action="read">
      <PageShell
        title="إشعار دائن جديد"
        subtitle="إنشاء إشعار دائن لأحد العملاء"
        actions={
          <button
            type="button"
            onClick={() => navigate('/financial/credit-notes')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-500 transition-all shadow-sm"
          >
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body onDone={() => navigate('/financial/credit-notes')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ onDone }: { onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<CreditNoteDoc>({
    posting_date: today,
  });
  const [saving, setSaving] = useState(false);
  const { createDoc } = useFrappeCreateDoc();

  const { data: customers } = useFrappeGetDocList<{ name: string; customer_name?: string }>(
    'Customer',
    { fields: ['name', 'customer_name'], limit: 300 },
  );

  const { data: salesInvoices } = useFrappeGetDocList<{ name: string }>(
    'Sales Invoice',
    {
      fields: ['name'],
      filters: values.customer
        ? [['customer', '=', values.customer], ['is_return', '=', 0], ['docstatus', '=', 1]]
        : [['is_return', '=', 0], ['docstatus', '=', 1]],
      limit: 200,
    } as any,
  );

  const { data: accounts } = useFrappeGetDocList<{ name: string; account_name?: string; account_number?: string }>(
    'Account',
    {
      fields: ['name', 'account_name', 'account_number'],
      filters: [['account_type', 'in', ['Receivable', 'Income Account']]],
      limit: 300,
    } as any,
  );

  function set<K extends keyof CreditNoteDoc>(key: K, val: CreditNoteDoc[K]) {
    setValues((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createDoc('Sales Invoice', {
        doctype: 'Sales Invoice',
        is_return: 1,
        posting_date: values.posting_date,
        customer: values.customer,
        return_against: values.return_against,
        debit_to: values.debit_to,
        remarks: values.remarks,
        items: [{ item_name: 'إشعار دائن', qty: -1, rate: values.total ?? 0 }],
      } as any);
      toast.success('تم حفظ الإشعار الدائن');
      onDone();
    } catch (err: any) {
      toast.error(extractFrappeError(err) ?? 'تعذر الحفظ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات الإشعار" subtitle="أدخل بيانات إشعار الدائن">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Date */}
          <Field label="التاريخ" required>
            <input
              type="date"
              required
              value={values.posting_date ?? today}
              onChange={(e) => set('posting_date', e.target.value)}
              className={INPUT}
            />
          </Field>

          {/* Customer */}
          <Field label="العميل" required>
            <select
              required
              value={values.customer ?? ''}
              onChange={(e) => {
                set('customer', e.target.value);
                set('return_against', undefined);
              }}
              className={INPUT}
            >
              <option value="">— اختر العميل —</option>
              {(customers ?? []).map((c) => (
                <option key={c.name} value={c.name}>
                  {c.customer_name ?? c.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Linked Sales Invoice (optional) */}
          <Field label="فاتورة المبيعات (اختياري)">
            <select
              value={values.return_against ?? ''}
              onChange={(e) => set('return_against', e.target.value)}
              className={INPUT}
            >
              <option value="">— —</option>
              {(salesInvoices ?? []).map((i) => (
                <option key={i.name} value={i.name}>
                  {i.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Amount */}
          <Field label="المبلغ" required>
            <input
              type="number"
              required
              step="0.01"
              min="0.01"
              dir="ltr"
              placeholder="0.00"
              value={values.total ?? ''}
              onChange={(e) => set('total', e.target.value === '' ? undefined : Number(e.target.value))}
              className={INPUT + ' font-mono'}
            />
          </Field>

          {/* Account */}
          <Field label="الحساب">
            <select
              value={values.debit_to ?? ''}
              onChange={(e) => set('debit_to', e.target.value)}
              className={INPUT}
            >
              <option value="">— اختياري —</option>
              {(accounts ?? []).map((a) => (
                <option key={a.name} value={a.name}>
                  {a.account_number ? `${a.account_number} — ` : ''}{a.account_name ?? a.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Reason */}
          <div className="md:col-span-3">
            <Field label="السبب">
              <textarea
                rows={2}
                placeholder="سبب إصدار الإشعار الدائن..."
                value={values.remarks ?? ''}
                onChange={(e) => set('remarks', e.target.value)}
                className={INPUT + ' resize-none'}
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-white/5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            <Check size={16} />
            {saving ? 'جارٍ الحفظ...' : 'حفظ الإشعار'}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            <X size={16} /> إلغاء
          </button>
        </div>
      </Card>
    </form>
  );
}
