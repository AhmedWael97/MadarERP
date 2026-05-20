/**
 * Receipt Voucher (سند قبض) create / edit form.
 * Matches reference: screenshots/059_سند-قبض-جديد.png
 * ERPNext doctype: Payment Entry (payment_type = "Receive")
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useFrappeCreateDoc,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Home } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

// ─── Field types ──────────────────────────────────────────────────────────────
interface PEDoc {
  name?: string;
  posting_date?: string;
  party_type?: string;
  party?: string;
  custom_payee_name?: string;
  paid_amount?: number;
  mode_of_payment?: string;
  paid_from?: string;
  bank_account?: string;
  paid_to?: string;
  reference_no?: string;
  remarks?: string;
  payment_type?: string;
}

// ─── Shared classes ───────────────────────────────────────────────────────────
const INPUT =
  'w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label}
        {required && <span className="text-red-500 mr-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Cookie helper for CSRF ───────────────────────────────────────────────────
function getCsrf(): string {
  const m = document.cookie.match(/(^|;\s*)X-Frappe-CSRF-Token=([^;]+)/);
  return m ? decodeURIComponent(m[2]) : '';
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export default function ReceiptVoucherFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';

  return (
    <RequirePerm doctype="Payment Entry" action="read">
      <PageShell
        title={isEdit ? `تعديل سند قبض: ${id ?? ''}` : 'سند قبض جديد'}
        subtitle="تسجيل سند قبض لاستلام مبلغ"
        actions={
          <button
            type="button"
            onClick={() => navigate('/financial/receipt-vouchers')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all"
          >
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/financial/receipt-vouchers')} />
      </PageShell>
    </RequirePerm>
  );
}

// ─── Form body ────────────────────────────────────────────────────────────────
function Body({
  mode,
  name,
  onDone,
}: {
  mode: 'create' | 'edit';
  name?: string;
  onDone: () => void;
}) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);

  const [doc, setDoc] = useState<PEDoc>({
    posting_date: today,
    payment_type: 'Receive',
    party_type: 'Customer',
    mode_of_payment: 'Cash',
  });
  const [submitting, setSubmitting] = useState(false);

  // Default company (used to auto-fill the party-side receivable account).
  const { data: defaults } = useFrappeGetCall<{ message: { default_company?: string } }>(
    'frappe.client.get_value',
    { doctype: 'Global Defaults', fieldname: 'default_company' },
    'gd:default_company',
  );
  const defaultCompany = defaults?.message?.default_company;
  const { data: companyDoc } = useFrappeGetDoc<{
    name: string;
    default_receivable_account?: string;
    default_payable_account?: string;
  }>('Company', defaultCompany, defaultCompany ? `co:${defaultCompany}` : null);

  const { data: existing } = useFrappeGetDoc<PEDoc>(
    'Payment Entry',
    isEdit ? name : undefined,
    isEdit && name ? `pe:${name}` : null,
  );
  useEffect(() => {
    if (existing) setDoc((d) => ({ ...d, ...existing }));
  }, [existing]);

  // Lists
  const { data: customers } = useFrappeGetDocList<{ name: string; customer_name?: string }>(
    'Customer',
    { fields: ['name', 'customer_name'], limit: 300 },
  );
  const { data: suppliers } = useFrappeGetDocList<{ name: string; supplier_name?: string }>(
    'Supplier',
    { fields: ['name', 'supplier_name'], limit: 300 },
  );
  const { data: mopList } = useFrappeGetDocList<{ name: string }>('Mode of Payment', {
    fields: ['name'],
    limit: 50,
  });
  const { data: accounts } = useFrappeGetDocList<{
    name: string;
    account_name?: string;
    account_number?: string;
    account_type?: string;
  }>('Account', {
    fields: ['name', 'account_name', 'account_number', 'account_type'],
    filters: [
      ['is_group', '=', 0],
      ['disabled', '=', 0],
    ],
    limit: 500,
    orderBy: { field: 'account_number', order: 'asc' },
  });
  const { data: bankAccounts } = useFrappeGetDocList<{ name: string; account?: string }>(
    'Bank Account',
    { fields: ['name', 'account'], limit: 100 },
  );

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating || submitting;

  function set<K extends keyof PEDoc>(key: K, val: PEDoc[K]) {
    setDoc((prev) => ({ ...prev, [key]: val }));
  }

  // Party options based on party_type
  const partyOptions =
    doc.party_type === 'Customer'
      ? (customers ?? []).map((c) => ({ value: c.name, label: c.customer_name ?? c.name }))
      : doc.party_type === 'Supplier'
        ? (suppliers ?? []).map((s) => ({ value: s.name, label: s.supplier_name ?? s.name }))
        : [];

  // Cash / treasury accounts
  const cashAccounts = (accounts ?? []).filter(
    (a) => a.account_type === 'Cash' || a.account_type === 'Bank',
  );

  // Auto-fill the party-side account (`paid_from` for Receive) from the
  // company default when the user picks a party type. Doesn't override if the
  // user has already chosen something. Receive: paid_from = receivable account.
  useEffect(() => {
    if (isEdit) return;
    if (doc.paid_from) return;
    if (doc.party_type === 'Customer' && companyDoc?.default_receivable_account) {
      setDoc((d) => ({ ...d, paid_from: companyDoc.default_receivable_account }));
    } else if (doc.party_type === 'Supplier' && companyDoc?.default_payable_account) {
      setDoc((d) => ({ ...d, paid_from: companyDoc.default_payable_account }));
    }
  }, [doc.party_type, companyDoc, isEdit, doc.paid_from]);

  async function save(andSubmit: boolean) {
    const amt = Number(doc.paid_amount ?? 0);
    const payload: Record<string, unknown> = {
      payment_type: 'Receive',
      posting_date: doc.posting_date,
      party_type: doc.party_type || undefined,
      party: doc.party || undefined,
      custom_payee_name: doc.custom_payee_name || undefined,
      paid_amount: amt,
      received_amount: amt,
      source_exchange_rate: 1,
      target_exchange_rate: 1,
      mode_of_payment: doc.mode_of_payment,
      paid_from: doc.paid_from || undefined,
      bank_account: doc.bank_account || undefined,
      paid_to: doc.paid_to || undefined,
      reference_no: doc.reference_no || undefined,
      remarks: doc.remarks || undefined,
    };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === undefined) delete payload[k];
    });

    try {
      let savedName: string;
      if (isEdit && name) {
        await updateDoc('Payment Entry', name, payload);
        savedName = name;
        toast.success('تم تحديث السند');
      } else {
        const res = await createDoc('Payment Entry', payload);
        savedName = (res as any)?.name ?? '';
        toast.success('تم حفظ السند');
      }

      if (andSubmit && savedName) {
        setSubmitting(true);
        try {
          const csrf = getCsrf();
          const r = await fetch('/api/method/frappe.client.submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Frappe-CSRF-Token': csrf,
            },
            body: `doc=${encodeURIComponent(
              JSON.stringify({ doctype: 'Payment Entry', name: savedName }),
            )}`,
          });
          if (!r.ok) throw new Error('Submit failed');
          toast.success('تم ترحيل السند');
        } catch {
          toast.error('تم الحفظ لكن تعذر الترحيل — راجع الإعدادات');
        } finally {
          setSubmitting(false);
        }
      }

      onDone();
    } catch (e: any) {
      const msg =
        e?.exc_type === 'ValidationError'
          ? e.exc
          : e?.message ?? 'تعذر الحفظ';
      toast.error(msg);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
      className="space-y-6"
    >
      {/* ── Section 1: Voucher Data ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-l from-indigo-700 to-indigo-900">
          <h3 className="text-base font-bold text-white">بيانات سند القبض</h3>
          <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
            •
          </span>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Row 1 */}
            <Field label="التاريخ" required>
              <input
                type="date"
                required
                value={doc.posting_date ?? today}
                onChange={(e) => set('posting_date', e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="نوع القبض">
              <select
                value={doc.party_type ?? 'Customer'}
                onChange={(e) => {
                  set('party_type', e.target.value);
                  set('party', '');
                }}
                className={INPUT}
              >
                <option value="Customer">عميل</option>
                <option value="Supplier">مورد</option>
                <option value="Employee">موظف</option>
                <option value="">إيراد آخر</option>
              </select>
            </Field>
            <Field label={doc.party_type === 'Supplier' ? 'المورد' : doc.party_type === 'Employee' ? 'الموظف' : 'العميل'}>
              <select
                value={doc.party ?? ''}
                onChange={(e) => set('party', e.target.value)}
                className={INPUT}
              >
                <option value="">— اختر —</option>
                {partyOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>

            {/* Row 2 */}
            <Field label="المستلم منه (إذا لم يكن عميل)">
              <input
                type="text"
                value={doc.custom_payee_name ?? ''}
                onChange={(e) => set('custom_payee_name', e.target.value)}
                placeholder="اسم المستلم منه"
                className={INPUT}
              />
            </Field>
            <Field label="المبلغ" required>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                dir="ltr"
                value={doc.paid_amount ?? ''}
                onChange={(e) => set('paid_amount', Number(e.target.value))}
                className={INPUT}
              />
            </Field>
            <Field label="طريقة الدفع" required>
              <select
                required
                value={doc.mode_of_payment ?? ''}
                onChange={(e) => set('mode_of_payment', e.target.value)}
                className={INPUT}
              >
                <option value="">— اختر —</option>
                {(mopList ?? []).length > 0
                  ? (mopList ?? []).map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))
                  : [
                      <option key="cash" value="Cash">نقداً</option>,
                      <option key="check" value="Cheque">شيك</option>,
                      <option key="transfer" value="Bank Transfer">تحويل بنكي</option>,
                    ]}
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* ── Section 2: Accounts ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-l from-emerald-600 to-emerald-800">
          <h3 className="text-base font-bold text-white">الحسابات</h3>
          <Home size={18} className="text-white/80" />
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="الخزينة / الحساب البنكي (إلى)" required>
              <select
                required
                value={doc.paid_to ?? ''}
                onChange={(e) => set('paid_to', e.target.value)}
                className={INPUT}
              >
                <option value="">— اختر الخزينة أو الحساب البنكي —</option>
                {cashAccounts.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.account_number
                      ? `${a.account_number} - ${a.account_name ?? a.name}`
                      : (a.account_name ?? a.name)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`حساب ${doc.party_type === 'Supplier' ? 'المورد' : 'العميل'} (من)`} required>
              <select
                required
                value={doc.paid_from ?? ''}
                onChange={(e) => set('paid_from', e.target.value)}
                className={INPUT}
              >
                <option value="">— اختر الحساب —</option>
                {(accounts ?? []).map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.account_number
                      ? `${a.account_number} - ${a.account_name ?? a.name}`
                      : (a.account_name ?? a.name)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="الحساب البنكي (اختياري)">
              <select
                value={doc.bank_account ?? ''}
                onChange={(e) => set('bank_account', e.target.value)}
                className={INPUT}
              >
                <option value="">— لا يوجد —</option>
                {(bankAccounts ?? []).map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="رقم مرجعي">
              <input
                type="text"
                dir="ltr"
                value={doc.reference_no ?? ''}
                onChange={(e) => set('reference_no', e.target.value)}
                className={INPUT}
              />
            </Field>
          </div>
          <Field label="البيان">
            <textarea
              value={doc.remarks ?? ''}
              onChange={(e) => set('remarks', e.target.value)}
              className={INPUT}
              style={{ minHeight: '100px', resize: 'vertical' }}
              placeholder="ملاحظات أو وصف السند..."
            />
          </Field>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all"
        >
          إلغاء
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save(true)}
          className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
        >
          {saving ? '…' : 'حفظ وترحيل'}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
        >
          {saving ? '…' : 'حفظ كمسودة'}
        </button>
      </div>
    </form>
  );
}
