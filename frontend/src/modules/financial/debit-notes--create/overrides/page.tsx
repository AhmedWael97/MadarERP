/**
 * Debit Note (إشعار مدين) create form.
 * Mirrors reference: financial/debit-notes/create.blade.php
 *
 * A debit note records a reduction in the amount owed to a supplier.
 * In ERPNext this is modelled as a Purchase Invoice with is_return = 1,
 * but the reference UI shows a much simpler form:
 *   date | supplier | linked purchase invoice (optional)
 *   amount | account | reason
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useFrappeCreateDoc,
  useFrappeGetDocList,
} from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Check, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, extractFrappeError } from '@/modules/accounting/AccountForm';

interface DebitNoteDoc {
  posting_date?: string;
  supplier?: string;
  bill_no?: string;        // reference to original purchase invoice number
  total?: number;
  credit_to?: string;      // the payable account to debit
  remarks?: string;
  is_return?: 1;
  payment_type?: string;
}

export default function Page() {
  const navigate = useNavigate();
  return (
    <RequirePerm doctype="Purchase Invoice" action="read">
      <PageShell
        title="إشعار مدين جديد"
        subtitle="إنشاء إشعار مدين لأحد الموردين"
        actions={
          <button
            type="button"
            onClick={() => navigate('/financial/debit-notes')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-500 transition-all shadow-sm"
          >
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body onDone={() => navigate('/financial/debit-notes')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ onDone }: { onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<DebitNoteDoc>({
    posting_date: today,
    is_return: 1,
  });
  const [saving, setSaving] = useState(false);

  const { createDoc } = useFrappeCreateDoc();

  const { data: suppliers } = useFrappeGetDocList<{ name: string; supplier_name?: string }>(
    'Supplier',
    { fields: ['name', 'supplier_name'], limit: 300 },
  );
  const { data: purchaseInvoices } = useFrappeGetDocList<{ name: string; bill_no?: string }>(
    'Purchase Invoice',
    {
      fields: ['name', 'bill_no'],
      filters: values.supplier ? [['supplier', '=', values.supplier], ['is_return', '=', 0]] : [['is_return', '=', 0]],
      limit: 200,
    } as any,
  );
  const { data: accounts } = useFrappeGetDocList<{ name: string; account_name?: string; account_number?: string }>(
    'Account',
    {
      fields: ['name', 'account_name', 'account_number'],
      filters: [['account_type', 'in', ['Payable', 'Expense Account', 'Expenses Included In Valuation']]],
      limit: 300,
    } as any,
  );

  function set<K extends keyof DebitNoteDoc>(key: K, val: DebitNoteDoc[K]) {
    setValues((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        doctype: 'Purchase Invoice',
        is_return: 1,
        posting_date: values.posting_date,
        supplier: values.supplier,
        bill_no: values.bill_no,
        credit_to: values.credit_to,
        remarks: values.remarks,
        // Minimal items row required by ERPNext — amount driven by the note amount.
        items: [{ item_name: 'إشعار مدين', qty: 1, rate: values.total ?? 0 }],
      };
      await createDoc('Purchase Invoice', payload as any);
      toast.success('تم حفظ الإشعار المدين');
      onDone();
    } catch (err: any) {
      toast.error(extractFrappeError(err) ?? 'تعذر الحفظ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات الإشعار" subtitle="أدخل بيانات إشعار المدين">
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

          {/* Supplier */}
          <Field label="المورد" required>
            <select
              required
              value={values.supplier ?? ''}
              onChange={(e) => set('supplier', e.target.value)}
              className={INPUT}
            >
              <option value="">— اختر المورد —</option>
              {(suppliers ?? []).map((s) => (
                <option key={s.name} value={s.name}>
                  {s.supplier_name ?? s.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Linked purchase invoice (optional) */}
          <Field label="فاتورة المشتريات (اختياري)">
            <select
              value={values.bill_no ?? ''}
              onChange={(e) => set('bill_no', e.target.value)}
              className={INPUT}
            >
              <option value="">— —</option>
              {(purchaseInvoices ?? []).map((i) => (
                <option key={i.name} value={i.name}>
                  {i.name}{i.bill_no ? ` (${i.bill_no})` : ''}
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
              value={values.credit_to ?? ''}
              onChange={(e) => set('credit_to', e.target.value)}
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
                placeholder="سبب إصدار الإشعار المدين..."
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
