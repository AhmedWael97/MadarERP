/** شيك جديد — Create Madaar Cheque form matching reference */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Check, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, extractFrappeError } from '@/modules/accounting/AccountForm';

interface ChequeDoc {
  cheque_number?: string;
  direction?: 'Received' | 'Issued';
  cheque_date?: string;
  due_date?: string;
  bank_name?: string;
  amount?: number;
  party_type?: 'Customer' | 'Supplier';
  party?: string;
  remarks?: string;
}

export default function Page() {
  const navigate = useNavigate();
  return (
    <RequirePerm doctype="Madaar Cheque" action="read">
      <PageShell
        title="شيك جديد"
        subtitle="إضافة شيك مستلم أو صادر"
        actions={
          <button
            type="button"
            onClick={() => navigate('/financial/checks')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-500 transition-all shadow-sm"
          >
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body onDone={() => navigate('/financial/checks')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ onDone }: { onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<ChequeDoc>({
    cheque_date: today,
    direction: 'Received',
  });
  const [saving, setSaving] = useState(false);
  const { createDoc } = useFrappeCreateDoc();

  const { data: customers } = useFrappeGetDocList<{ name: string; customer_name?: string }>(
    'Customer',
    { fields: ['name', 'customer_name'], limit: 300 },
  );
  const { data: suppliers } = useFrappeGetDocList<{ name: string; supplier_name?: string }>(
    'Supplier',
    { fields: ['name', 'supplier_name'], limit: 300 },
  );

  function set<K extends keyof ChequeDoc>(key: K, val: ChequeDoc[K]) {
    setValues((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createDoc('Madaar Cheque', {
        cheque_number: values.cheque_number,
        direction: values.direction,
        cheque_date: values.cheque_date,
        due_date: values.due_date,
        bank_name: values.bank_name,
        amount: values.amount,
        party_type: values.party_type,
        party: values.party,
        remarks: values.remarks,
      } as any);
      toast.success('تم حفظ الشيك بنجاح');
      onDone();
    } catch (err: any) {
      toast.error(extractFrappeError(err) ?? 'تعذر الحفظ');
    } finally {
      setSaving(false);
    }
  }

  const parties = values.party_type === 'Customer' ? customers : values.party_type === 'Supplier' ? suppliers : [];
  const partyLabel = (p: { name: string; customer_name?: string; supplier_name?: string }) =>
    (values.party_type === 'Customer' ? p.customer_name : p.supplier_name) ?? p.name;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات الشيك" subtitle="أدخل بيانات الشيك">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Direction toggle */}
          <Field label="نوع الشيك" required>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 text-sm font-semibold">
              {(['Received', 'Issued'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('direction', d)}
                  className={`flex-1 px-4 py-2.5 transition-all ${
                    values.direction === d
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
                  }`}
                >
                  {d === 'Received' ? 'شيك مستلم' : 'شيك صادر'}
                </button>
              ))}
            </div>
          </Field>

          {/* Cheque Number */}
          <Field label="رقم الشيك" required>
            <input
              type="text"
              required
              placeholder="CHK-001"
              value={values.cheque_number ?? ''}
              onChange={(e) => set('cheque_number', e.target.value)}
              className={INPUT}
            />
          </Field>

          {/* Bank */}
          <Field label="اسم البنك" required>
            <input
              type="text"
              required
              placeholder="البنك الأهلي المصري..."
              value={values.bank_name ?? ''}
              onChange={(e) => set('bank_name', e.target.value)}
              className={INPUT}
            />
          </Field>

          {/* Cheque Date */}
          <Field label="تاريخ الإصدار" required>
            <input
              type="date"
              required
              value={values.cheque_date ?? today}
              onChange={(e) => set('cheque_date', e.target.value)}
              className={INPUT}
            />
          </Field>

          {/* Due Date */}
          <Field label="تاريخ الاستحقاق" required>
            <input
              type="date"
              required
              value={values.due_date ?? ''}
              onChange={(e) => set('due_date', e.target.value)}
              className={INPUT}
            />
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
              value={values.amount ?? ''}
              onChange={(e) => set('amount', e.target.value === '' ? undefined : Number(e.target.value))}
              className={INPUT + ' font-mono'}
            />
          </Field>

          {/* Party Type */}
          <Field label="نوع الجهة">
            <select
              value={values.party_type ?? ''}
              onChange={(e) => {
                set('party_type', e.target.value as 'Customer' | 'Supplier');
                set('party', undefined);
              }}
              className={INPUT}
            >
              <option value="">— اختر —</option>
              <option value="Customer">عميل</option>
              <option value="Supplier">مورد</option>
            </select>
          </Field>

          {/* Party */}
          <Field label={values.party_type === 'Customer' ? 'العميل' : values.party_type === 'Supplier' ? 'المورد' : 'الجهة'}>
            <select
              value={values.party ?? ''}
              onChange={(e) => set('party', e.target.value)}
              disabled={!values.party_type}
              className={INPUT}
            >
              <option value="">— اختر —</option>
              {(parties ?? []).map((p) => (
                <option key={p.name} value={p.name}>
                  {partyLabel(p as any)}
                </option>
              ))}
            </select>
          </Field>

          {/* Remarks */}
          <div className="md:col-span-3">
            <Field label="ملاحظات">
              <textarea
                rows={2}
                placeholder="ملاحظات إضافية..."
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
            {saving ? 'جارٍ الحفظ...' : 'حفظ الشيك'}
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
