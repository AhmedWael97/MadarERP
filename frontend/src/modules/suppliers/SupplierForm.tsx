/**
 * Supplier create / edit form — matches reference Blade
 *   `H:/coupons/Madaar ERP/Madaar ERP/resources/views/suppliers/form.blade.php`.
 *
 * Mirrors the Customer 6-tab structure with these differences:
 *   - General has no discount % or sales rep
 *   - Marketing has only notes
 *   - Credit has only payment_terms (no credit_limit)
 *   - Financial adds bank fields (bank_name, account_number, IBAN)
 *   - `add_as_customer` (instead of add_as_supplier)
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useFrappeCreateDoc,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Check, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

type Mode = 'create' | 'edit';

interface SupplierDoc {
  name?: string;
  supplier_name?: string;
  supplier_type?: 'Individual' | 'Company';
  tax_id?: string;
  payment_terms?: string;
  disabled?: 0 | 1;
  madaar_supplier_code?: string;
  madaar_name_ar?: string;
  madaar_name_en?: string;
  madaar_city?: string;
  madaar_country?: string;
  madaar_is_taxable?: 0 | 1;
  madaar_add_as_customer?: 0 | 1;
  madaar_supplier_category?: string;
  madaar_default_payable_account?: string;
  madaar_notes?: string;
  madaar_address?: string;
  madaar_phone?: string;
  madaar_mobile?: string;
  madaar_email?: string;
  madaar_postal_code?: string;
  madaar_commercial_register?: string;
  madaar_opening_balance?: number;
  madaar_bank_name?: string;
  madaar_bank_account_number?: string;
  madaar_bank_iban?: string;
}

const TABS = [
  { id: 'general', label: 'البيانات العامة' },
  { id: 'marketing', label: 'بيانات تسويقية' },
  { id: 'contact', label: 'وسائل الإتصال' },
  { id: 'government', label: 'بيانات حكومية' },
  { id: 'credit', label: 'شروط الأجل' },
  { id: 'financial', label: 'البيانات المالية' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function SupplierFormPage({ mode }: { mode: Mode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Supplier" action="read">
      <PageShell
        title={isEdit ? t('supplier.form.edit_title', { defaultValue: 'تعديل مورد' }) : t('supplier.form.create_title', { defaultValue: 'إنشاء مورد' })}
        subtitle={t('supplier.form.subtitle', { defaultValue: 'الموردين' })}
        actions={
          <button
            type="button"
            onClick={() => navigate('/suppliers')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm"
          >
            <ArrowRight size={16} />
            {t('action.back', { defaultValue: 'رجوع' })}
          </button>
        }
      >
        <SupplierFormBody mode={mode} name={id} onDone={() => navigate('/suppliers')} />
      </PageShell>
    </RequirePerm>
  );
}

function SupplierFormBody({ mode, name, onDone }: { mode: Mode; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [values, setValues] = useState<SupplierDoc>({
    supplier_type: 'Individual',
    madaar_is_taxable: 1,
    disabled: 0,
    madaar_country: 'مصر',
    madaar_opening_balance: 0,
  });

  const { data: existing } = useFrappeGetDoc<SupplierDoc>(
    'Supplier',
    isEdit ? name : undefined,
    isEdit && name ? `supplier:${name}` : null,
  );
  useEffect(() => {
    if (existing) setValues((v) => ({ ...v, ...existing }));
  }, [existing]);

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof SupplierDoc>(key: K, val: SupplierDoc[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: SupplierDoc = {
      ...values,
      // Frappe Supplier requires supplier_name; we mirror name_ar so the
      // primary identifier is human-readable.
      supplier_name: values.supplier_name || values.madaar_name_ar || values.madaar_supplier_code,
    };
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) {
        await updateDoc('Supplier', name, cleaned);
        toast.success('تحديث');
      } else {
        await createDoc('Supplier', cleaned);
        toast.success('تم الحفظ');
      }
      onDone();
    } catch (err: any) {
      toast.error(extractFrappeError(err) ?? err?.message ?? 'Error');
    }
  }

  const balanceColor =
    typeof (existing as any)?.balance === 'number'
      ? ((existing as any).balance as number) >= 0
        ? 'text-emerald-600'
        : 'text-red-600'
      : 'text-slate-600';

  return (
    <form onSubmit={onSubmit}>
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden mb-6">
        <div className="flex flex-wrap border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30 overflow-x-auto">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'px-5 py-3 text-sm font-bold transition-all whitespace-nowrap rounded-t-xl',
                  active
                    ? 'bg-[color:var(--color-brand-500)] text-white shadow-md'
                    : 'text-slate-500 hover:text-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-50,#ecfdf5)]/50',
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <Field label="المسلسل">
                <input
                  type="text"
                  value={existing?.name ?? 'تلقائي'}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm cursor-not-allowed"
                />
              </Field>
              <Field label="كود المورد" required>
                <input
                  type="text"
                  required
                  placeholder="SUP-001"
                  value={values.madaar_supplier_code ?? ''}
                  onChange={(e) => set('madaar_supplier_code', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
              <Field label="الإسم بالعربية" required>
                <input
                  type="text"
                  required
                  value={values.madaar_name_ar ?? ''}
                  onChange={(e) => set('madaar_name_ar', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
              <Field label="الإسم بالإنجليزية">
                <input
                  type="text"
                  dir="ltr"
                  value={values.madaar_name_en ?? ''}
                  onChange={(e) => set('madaar_name_en', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
              <Field label="النوع" required>
                <select
                  required
                  value={values.supplier_type ?? 'Individual'}
                  onChange={(e) => set('supplier_type', e.target.value as 'Individual' | 'Company')}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                >
                  <option value="Individual">فرد</option>
                  <option value="Company">شركة</option>
                </select>
              </Field>

              <div className="md:col-span-4 flex flex-wrap items-center gap-6 py-3 border-t border-b border-slate-100 dark:border-white/5">
                <CheckboxField
                  label="مورد يخضع لضريبة"
                  checked={!!values.madaar_is_taxable}
                  onChange={(c) => set('madaar_is_taxable', c ? 1 : 0)}
                />
                <CheckboxField
                  label="نشط"
                  checked={!values.disabled}
                  onChange={(c) => set('disabled', c ? 0 : 1)}
                />
                <CheckboxField
                  label="إضافة المورد كعميل (نفس الحساب)"
                  checked={!!values.madaar_add_as_customer}
                  onChange={(c) => set('madaar_add_as_customer', c ? 1 : 0)}
                  color="emerald"
                />
              </div>

              <LinkField
                label="مجموعة الموردين"
                doctype="Madaar Supplier Category"
                value={values.madaar_supplier_category ?? ''}
                onChange={(v) => set('madaar_supplier_category', v)}
                emptyLabel="— بدون —"
              />
              <LinkField
                label="حساب أستاذ"
                doctype="Account"
                value={values.madaar_default_payable_account ?? ''}
                onChange={(v) => set('madaar_default_payable_account', v)}
                emptyLabel="— افتراضي —"
              />
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="ملاحظات" span={2}>
                <textarea
                  rows={3}
                  placeholder="ملاحظات"
                  value={values.madaar_notes ?? ''}
                  onChange={(e) => set('madaar_notes', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="العنوان" span={2}>
                <input
                  type="text"
                  placeholder="العنوان"
                  value={values.madaar_address ?? ''}
                  onChange={(e) => set('madaar_address', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
              <Field label="رقم الهاتف">
                <input type="text" dir="ltr" value={values.madaar_phone ?? ''} onChange={(e) => set('madaar_phone', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
              <Field label="المحمول">
                <input type="text" dir="ltr" value={values.madaar_mobile ?? ''} onChange={(e) => set('madaar_mobile', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
              <Field label="البريد الإلكتروني">
                <input type="email" dir="ltr" value={values.madaar_email ?? ''} onChange={(e) => set('madaar_email', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
              <Field label="المدينة">
                <input type="text" value={values.madaar_city ?? ''} onChange={(e) => set('madaar_city', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
              <Field label="الدولة">
                <input type="text" value={values.madaar_country ?? ''} onChange={(e) => set('madaar_country', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
              <Field label="الرمز البريدي">
                <input type="text" dir="ltr" value={values.madaar_postal_code ?? ''} onChange={(e) => set('madaar_postal_code', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
            </div>
          )}

          {activeTab === 'government' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="الرقم الضريبي">
                <input type="text" dir="ltr" value={values.tax_id ?? ''} onChange={(e) => set('tax_id', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
              <Field label="السجل التجاري">
                <input type="text" dir="ltr" value={values.madaar_commercial_register ?? ''} onChange={(e) => set('madaar_commercial_register', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
            </div>
          )}

          {activeTab === 'credit' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <LinkField label="شروط الدفع" doctype="Payment Terms Template" value={values.payment_terms ?? ''} onChange={(v) => set('payment_terms', v)} emptyLabel="— بدون —" />
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="الرصيد الافتتاحي">
                <input type="number" step="0.01" dir="ltr" value={values.madaar_opening_balance ?? 0} onChange={(e) => set('madaar_opening_balance', Number(e.target.value))} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
              {isEdit && (existing as any)?.balance !== undefined && (
                <Field label="الرصيد الحالي">
                  <input
                    type="text"
                    disabled
                    dir="ltr"
                    value={fmtNum((existing as any).balance)}
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm cursor-not-allowed font-bold ${balanceColor}`}
                  />
                </Field>
              )}
              <Field label="اسم البنك">
                <input type="text" value={values.madaar_bank_name ?? ''} onChange={(e) => set('madaar_bank_name', e.target.value)} placeholder="اسم البنك" className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
              <Field label="رقم الحساب البنكي">
                <input type="text" dir="ltr" value={values.madaar_bank_account_number ?? ''} onChange={(e) => set('madaar_bank_account_number', e.target.value)} placeholder="رقم الحساب" className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
              <Field label="IBAN">
                <input type="text" dir="ltr" value={values.madaar_bank_iban ?? ''} onChange={(e) => set('madaar_bank_iban', e.target.value)} placeholder="رقم IBAN" className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
              </Field>
            </div>
          )}
        </div>

        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/20">
          <button type="button" onClick={onDone} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 text-sm font-semibold rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-100 transition-all">
            <X size={16} />
            إلغاء
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] transition-all disabled:opacity-60">
            <Check size={16} />
            {isEdit ? 'تحديث' : 'حفظ'}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  span = 1,
  children,
}: {
  label: string;
  required?: boolean;
  span?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}) {
  const spanCls = span === 2 ? 'md:col-span-2' : span === 3 ? 'md:col-span-3' : span === 4 ? 'md:col-span-4' : '';
  return (
    <div className={spanCls}>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  color = 'brand',
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  color?: 'brand' | 'emerald';
}) {
  const ring = color === 'emerald' ? 'text-emerald-500 focus:ring-emerald-500' : 'text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]';
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={`w-5 h-5 rounded border-slate-300 ${ring}`} />
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  );
}

function LinkField({
  label,
  doctype,
  value,
  onChange,
  emptyLabel,
}: {
  label: string;
  doctype: string;
  value: string;
  onChange: (v: string) => void;
  emptyLabel: string;
}) {
  const { data, error } = useFrappeGetDocList<{ name: string }>(doctype, {
    fields: ['name'],
    limit: 100,
    orderBy: { field: 'modified', order: 'desc' },
  });
  const options = useMemo(() => (data ?? []).map((d) => d.name), [data]);
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]">
        <option value="">{emptyLabel}</option>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        {error && (
          <option disabled value="">
            (cannot load {doctype})
          </option>
        )}
      </select>
    </Field>
  );
}

function fmtNum(n: number): string {
  try {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(n);
  }
}

function extractFrappeError(err: any): string | null {
  const sm = err?._server_messages ?? err?.response?.data?._server_messages;
  if (!sm) return null;
  try {
    const arr = typeof sm === 'string' ? JSON.parse(sm) : sm;
    const msgs = arr.map((s: any) => (typeof s === 'string' ? JSON.parse(s) : s));
    return msgs.map((m: any) => m.message ?? '').filter(Boolean).join('\n') || null;
  } catch {
    return null;
  }
}
