/**
 * Bank Account — create / edit form override.
 * ERPNext doctype: Bank Account. Mirrors the reference Blade view
 * (`accounting/bank-accounts/form.blade.php`) with Arabic labels and the
 * same two-card structure as the receipt / payment voucher forms.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface BankAccountDoc {
  name?: string;
  account_name?: string;
  bank?: string;
  bank_account_no?: string;
  iban?: string;
  branch_code?: string;
  account?: string;            // GL Account (Link → Account)
  account_currency?: string;
  account_type?: string;       // Checking / Savings / …
  account_subtype?: string;
  company?: string;
  is_default?: 0 | 1;
  is_company_account?: 0 | 1;
  disabled?: 0 | 1;
}

const INPUT =
  'w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-all';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label}{required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  required,
  className,
  listId,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder: string;
  required?: boolean;
  className?: string;
  listId: string;
}) {
  return (
    <>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={className}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} label={opt.label} />
        ))}
      </datalist>
    </>
  );
}

export default function BankAccountFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Bank Account" action="read">
      <PageShell
        title={isEdit ? `تعديل الحساب البنكي: ${id ?? ''}` : 'حساب بنكي جديد'}
        subtitle="بيانات الحساب البنكي للشركة"
        actions={
          <button type="button" onClick={() => navigate('/treasury/banks')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/treasury/banks')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [doc, setDoc] = useState<BankAccountDoc>({ is_company_account: 1, is_default: 0, disabled: 0 });
  const { data: existing } = useFrappeGetDoc<BankAccountDoc>('Bank Account', isEdit ? name : undefined, isEdit && name ? `ba:${name}` : null);
  useEffect(() => { if (existing) setDoc((d) => ({ ...d, ...existing })); }, [existing]);

  // Reference lists.
  const { data: companies } = useFrappeGetDocList<{ name: string }>('Company', { fields: ['name'], limit: 50 });
  // Auto-select company when only one exists.
  useEffect(() => {
    if (!isEdit && companies?.length === 1 && !doc.company) {
      setDoc((d) => ({ ...d, company: companies[0].name }));
    }
  }, [companies, isEdit, doc.company]);

  const { data: banks } = useFrappeGetDocList<{ name: string; bank_name?: string }>('Bank', { fields: ['name', 'bank_name'], limit: 200 });
  const { data: currencies } = useFrappeGetDocList<{ name: string }>('Currency', { fields: ['name'], filters: [['enabled', '=', 1]], limit: 100 });
  const glFilters = useMemo(() => {
    const base: Array<[string, string, string | number]> = [
      ['is_group', '=', 0],
      ['disabled', '=', 0],
      ['root_type', '=', 'Asset'],
    ];
    if (doc.company) base.push(['company', '=', doc.company]);
    return base;
  }, [doc.company]);
  const { data: glAccounts } = useFrappeGetDocList<{ name: string; account_name?: string; account_number?: string; account_type?: string }>('Account', {
    fields: ['name', 'account_name', 'account_number', 'account_type'],
    filters: glFilters as any,
    limit: 500,
    orderBy: { field: 'account_number', order: 'asc' },
  });

  const companyOptions = useMemo<SelectOption[]>(() => (companies ?? []).map((c) => ({ value: c.name, label: c.name })), [companies]);
  const bankOptions = useMemo<SelectOption[]>(() => (banks ?? []).map((b) => ({ value: b.name, label: b.bank_name ?? b.name })), [banks]);
  const currencyOptions = useMemo<SelectOption[]>(() => (currencies ?? []).map((c) => ({ value: c.name, label: c.name })), [currencies]);
  const glOptions = useMemo<SelectOption[]>(
    () => (glAccounts ?? []).map((a) => ({
      value: a.name,
      label: a.account_number ? `${a.account_number} - ${a.account_name ?? a.name}` : (a.account_name ?? a.name),
    })),
    [glAccounts],
  );

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof BankAccountDoc>(key: K, val: BankAccountDoc[K]) {
    setDoc((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc)) {
      if (v === '' || v === null || v === undefined) continue;
      payload[k] = v;
    }
    try {
      if (isEdit && name) {
        await updateDoc('Bank Account', name, payload);
        toast.success('تم التحديث');
      } else {
        await createDoc('Bank Account', payload);
        toast.success('تم الحفظ');
      }
      onDone();
    } catch (err: any) {
      const msg = err?.exc_type === 'ValidationError' ? err.exc : err?.message ?? 'تعذر الحفظ';
      toast.error(typeof msg === 'string' ? msg : 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* ── Section 1: identity ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-l from-violet-600 to-purple-700">
          <h3 className="text-base font-bold text-white">بيانات الحساب البنكي</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="اسم الحساب" required>
              <input
                type="text"
                required
                value={doc.account_name ?? ''}
                onChange={(e) => set('account_name', e.target.value)}
                placeholder="مثال: الحساب الجاري - الراجحي"
                className={INPUT}
              />
            </Field>
            <Field label="الشركة" required>
              <SearchableSelect
                required
                value={doc.company ?? ''}
                onChange={(v) => set('company', v)}
                placeholder="— اختر الشركة —"
                options={companyOptions}
                className={INPUT}
                listId="bank-company-options"
              />
            </Field>
            <Field label="البنك" required>
              <SearchableSelect
                required
                value={doc.bank ?? ''}
                onChange={(v) => set('bank', v)}
                placeholder="— اختر البنك —"
                options={bankOptions}
                className={INPUT}
                listId="bank-bank-options"
              />
            </Field>
            <Field label="رقم الحساب">
              <input
                type="text"
                dir="ltr"
                value={doc.bank_account_no ?? ''}
                onChange={(e) => set('bank_account_no', e.target.value)}
                className={INPUT + ' font-mono'}
              />
            </Field>

            <Field label="IBAN">
              <input type="text" dir="ltr" value={doc.iban ?? ''} onChange={(e) => set('iban', e.target.value)} className={INPUT + ' font-mono'} />
            </Field>
            <Field label="كود الفرع">
              <input type="text" dir="ltr" value={doc.branch_code ?? ''} onChange={(e) => set('branch_code', e.target.value)} className={INPUT} />
            </Field>
            <Field label="نوع الحساب">
              <SearchableSelect
                value={doc.account_type ?? ''}
                onChange={(v) => set('account_type', v)}
                placeholder="— اختر —"
                options={[
                  { value: 'Checking', label: 'جاري' },
                  { value: 'Savings', label: 'توفير' },
                  { value: 'Loan', label: 'قرض' },
                  { value: 'Investment', label: 'استثمار' },
                  { value: 'Other', label: 'أخرى' },
                ]}
                className={INPUT}
                listId="bank-account-type-options"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ── Section 2: GL mapping ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-l from-emerald-600 to-emerald-800">
          <h3 className="text-base font-bold text-white">ربط الحساب المحاسبي</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="الحساب المحاسبي (GL)" required>
              <SearchableSelect
                required
                value={doc.account ?? ''}
                onChange={(v) => set('account', v)}
                placeholder="— اختر الحساب —"
                options={glOptions}
                className={INPUT}
                listId="bank-gl-options"
              />
            </Field>
            <Field label="العملة">
              <SearchableSelect
                value={doc.account_currency ?? ''}
                onChange={(v) => set('account_currency', v)}
                placeholder="— العملة الافتراضية —"
                options={currencyOptions}
                className={INPUT}
                listId="bank-currency-options"
              />
            </Field>
          </div>

          <div className="flex items-center gap-6 pt-3 border-t border-slate-100 dark:border-white/5">
            <label className="inline-flex items-center cursor-pointer gap-2">
              <input type="checkbox" checked={!!doc.is_company_account} onChange={(e) => set('is_company_account', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded border-slate-300 text-violet-500 focus:ring-violet-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">حساب الشركة</span>
            </label>
            <label className="inline-flex items-center cursor-pointer gap-2">
              <input type="checkbox" checked={!!doc.is_default} onChange={(e) => set('is_default', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded border-slate-300 text-violet-500 focus:ring-violet-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">حساب افتراضي</span>
            </label>
            <label className="inline-flex items-center cursor-pointer gap-2">
              <input type="checkbox" checked={!doc.disabled} onChange={(e) => set('disabled', e.target.checked ? 0 : 1)} className="w-4 h-4 rounded border-slate-300 text-violet-500 focus:ring-violet-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">نشط</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onDone} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all">
          إلغاء
        </button>
        <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl transition-all shadow-sm">
          {saving ? '…' : (isEdit ? 'حفظ التغييرات' : 'حفظ الحساب')}
        </button>
      </div>
    </form>
  );
}
