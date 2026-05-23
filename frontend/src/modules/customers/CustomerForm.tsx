/**
 * Customer create / edit form — hand-coded to match the reference Madaar ERP
 * Blade view at `H:/coupons/Madaar ERP/Madaar ERP/resources/views/customers/form.blade.php`.
 *
 * Six tabs, in this order (reference labels in Arabic):
 *   1. البيانات العامة      — code, names, type, city, country, flags, group, account, discount
 *   2. بيانات تسويقية      — sales rep + notes
 *   3. وسائل الإتصال       — address, phone, mobile, email, postal code
 *   4. بيانات حكومية       — tax number + commercial register
 *   5. شروط الأجل          — credit limit + payment terms
 *   6. البيانات المالية    — opening + current balance
 *
 * Field mapping (reference field → Frappe target):
 *   code                  → madaar_customer_code  (custom)  + customer_name (mirror for naming)
 *   name_ar               → madaar_name_ar         (custom) + customer_name (default)
 *   name_en               → madaar_name_en         (custom)
 *   type                  → customer_type (Individual / Company)
 *   city                  → madaar_city           (custom)
 *   country               → madaar_country        (custom)
 *   is_taxable            → madaar_is_taxable     (custom)
 *   is_active             → disabled (inverse)
 *   add_as_supplier       → madaar_add_as_supplier (custom — server hook would create the matching Supplier)
 *   category_id           → madaar_customer_category
 *   account_id            → madaar_default_receivable_account (custom Link → Account)
 *   discount_percentage   → madaar_discount_percentage (custom Float)
 *   sales_rep_id          → madaar_sales_person (custom Link → Sales Person)
 *   notes                 → madaar_notes           (custom Small Text)
 *   address_ar            → madaar_address         (custom Data)
 *   phone                 → madaar_phone           (custom Data)
 *   mobile                → madaar_mobile          (custom Data)
 *   email                 → email_id (ERPNext native)
 *   postal_code           → madaar_postal_code     (custom Data)
 *   tax_number            → tax_id (ERPNext native)
 *   commercial_register   → madaar_commercial_register (custom Data)
 *   credit_limit          → madaar_credit_limit    (custom Currency)
 *   payment_term_id       → payment_terms (ERPNext native — Link → Payment Terms Template)
 *   opening_balance       → madaar_opening_balance (custom Currency)
 *   balance               → derived (account balance lookup, read-only)
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

interface CustomerDoc {
  name?: string;
  customer_name?: string;
  customer_type?: 'Individual' | 'Company';
  tax_id?: string;
  payment_terms?: string;
  disabled?: 0 | 1;
  // Madaar custom fields:
  madaar_customer_code?: string;
  madaar_name_ar?: string;
  madaar_name_en?: string;
  madaar_city?: string;
  madaar_country?: string;
  madaar_is_taxable?: 0 | 1;
  madaar_add_as_supplier?: 0 | 1;
  madaar_customer_category?: string;
  madaar_default_receivable_account?: string;
  madaar_discount_percentage?: number;
  madaar_sales_person?: string;
  madaar_notes?: string;
  madaar_address?: string;
  madaar_phone?: string;
  madaar_mobile?: string;
  madaar_email?: string;
  madaar_postal_code?: string;
  madaar_commercial_register?: string;
  madaar_credit_limit?: number;
  madaar_opening_balance?: number;
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

export default function CustomerFormPage({ mode }: { mode: Mode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';

  return (
    <RequirePerm doctype="Customer" action="read">
      <PageShell
        title={isEdit ? t('customer.form.edit_title', { defaultValue: 'تعديل عميل' }) : t('customer.form.create_title', { defaultValue: 'إنشاء عميل' })}
        subtitle={t('customer.form.subtitle', { defaultValue: 'العملاء' })}
        actions={
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm"
          >
            <ArrowRight size={16} />
            {t('action.back', { defaultValue: 'رجوع' })}
          </button>
        }
      >
        <CustomerFormBody mode={mode} name={id} onDone={() => navigate('/customers')} />
      </PageShell>
    </RequirePerm>
  );
}

function CustomerFormBody({ mode, name, onDone }: { mode: Mode; name?: string; onDone: () => void }) {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [values, setValues] = useState<CustomerDoc>({
    customer_type: 'Individual',
    madaar_is_taxable: 1,
    disabled: 0,
    madaar_country: 'مصر',
    madaar_discount_percentage: 0,
    madaar_opening_balance: 0,
  });

  const { data: existing } = useFrappeGetDoc<CustomerDoc>(
    'Customer',
    isEdit ? name : undefined,
    isEdit && name ? `customer:${name}` : null,
  );
  useEffect(() => {
    if (existing) setValues((v) => ({ ...v, ...existing }));
  }, [existing]);

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof CustomerDoc>(key: K, val: CustomerDoc[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // ERPNext naming: Customer.autoname is usually `field:customer_name` or `naming_series`.
    // We mirror name_ar → customer_name so the doc gets a sensible primary identifier.
    const payload: CustomerDoc = {
      ...values,
      customer_name: values.customer_name || values.madaar_name_ar || values.madaar_customer_code,
    };
    // Drop empties so Frappe doesn't barf on empty Link fields.
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) {
        await updateDoc('Customer', name, cleaned);
        toast.success(t('action.update', { defaultValue: 'تحديث' }));
      } else {
        await createDoc('Customer', cleaned);
        toast.success(t('action.save', { defaultValue: 'حفظ' }));
      }
      onDone();
    } catch (err: any) {
      const msg = extractFrappeError(err) ?? err?.message ?? 'Error';
      toast.error(msg);
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
        {/* Tab nav — pill style matching reference (active = bg-brand-500 white) */}
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
                {t(`customer.form.tab.${tab.id}`, { defaultValue: tab.label })}
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
              <Field label="كود العميل" required>
                <input
                  type="text"
                  required
                  placeholder="CUS-001"
                  value={values.madaar_customer_code ?? ''}
                  onChange={(e) => set('madaar_customer_code', e.target.value)}
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
                  value={values.customer_type ?? 'Individual'}
                  onChange={(e) => set('customer_type', e.target.value as 'Individual' | 'Company')}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                >
                  <option value="Individual">فرد</option>
                  <option value="Company">شركة</option>
                </select>
              </Field>
              <Field label="المدينة">
                <input
                  type="text"
                  value={values.madaar_city ?? ''}
                  onChange={(e) => set('madaar_city', e.target.value)}
                  placeholder="المدينة"
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
              <Field label="الدولة">
                <input
                  type="text"
                  value={values.madaar_country ?? ''}
                  onChange={(e) => set('madaar_country', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>

              <div className="md:col-span-4 flex flex-wrap items-center gap-6 py-3 border-t border-b border-slate-100 dark:border-white/5">
                <CheckboxField
                  label="عميل يخضع لضريبة"
                  checked={!!values.madaar_is_taxable}
                  onChange={(c) => set('madaar_is_taxable', c ? 1 : 0)}
                  color="brand"
                />
                <CheckboxField
                  label="نشط"
                  // is_active in reference == NOT disabled in ERPNext
                  checked={!values.disabled}
                  onChange={(c) => set('disabled', c ? 0 : 1)}
                  color="brand"
                />
                <CheckboxField
                  label="إضافة العميل كمورد (نفس الحساب)"
                  checked={!!values.madaar_add_as_supplier}
                  onChange={(c) => set('madaar_add_as_supplier', c ? 1 : 0)}
                  color="emerald"
                />
              </div>

              <LinkField
                label="مجموعة العملاء"
                doctype="Madaar Customer Category"
                value={values.madaar_customer_category ?? ''}
                onChange={(v) => set('madaar_customer_category', v)}
                emptyLabel="— بدون —"
              />
              <LinkField
                label="حساب أستاذ"
                doctype="Account"
                value={values.madaar_default_receivable_account ?? ''}
                onChange={(v) => set('madaar_default_receivable_account', v)}
                emptyLabel="— افتراضي —"
              />
              <Field label="نسبة الخصم %">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  dir="ltr"
                  value={values.madaar_discount_percentage ?? 0}
                  onChange={(e) => set('madaar_discount_percentage', Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <LinkField
                label="مندوب المبيعات"
                doctype="Sales Person"
                value={values.madaar_sales_person ?? ''}
                onChange={(v) => set('madaar_sales_person', v)}
                emptyLabel="— بدون —"
              />
              <Field label="ملاحظات" span={2}>
                <textarea
                  rows={3}
                  placeholder="ملاحظات تسويقية"
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
                <input
                  type="text"
                  dir="ltr"
                  placeholder="رقم الهاتف"
                  value={values.madaar_phone ?? ''}
                  onChange={(e) => set('madaar_phone', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
              <Field label="المحمول">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="رقم المحمول"
                  value={values.madaar_mobile ?? ''}
                  onChange={(e) => set('madaar_mobile', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
              <Field label="البريد الإلكتروني">
                <input
                  type="email"
                  dir="ltr"
                  placeholder="البريد الإلكتروني"
                  value={values.madaar_email ?? ''}
                  onChange={(e) => set('madaar_email', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
              <Field label="الرمز البريدي">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="الرمز البريدي"
                  value={values.madaar_postal_code ?? ''}
                  onChange={(e) => set('madaar_postal_code', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
            </div>
          )}

          {activeTab === 'government' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="الرقم الضريبي">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="الرقم الضريبي"
                  value={values.tax_id ?? ''}
                  onChange={(e) => set('tax_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
              <Field label="السجل التجاري">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="رقم السجل التجاري"
                  value={values.madaar_commercial_register ?? ''}
                  onChange={(e) => set('madaar_commercial_register', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
            </div>
          )}

          {activeTab === 'credit' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="حد الائتمان">
                <input
                  type="number"
                  step="0.01"
                  dir="ltr"
                  placeholder="0.00"
                  value={values.madaar_credit_limit ?? ''}
                  onChange={(e) => set('madaar_credit_limit', e.target.value === '' ? undefined : Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
              </Field>
              <LinkField
                label="شروط الدفع"
                doctype="Payment Terms Template"
                value={values.payment_terms ?? ''}
                onChange={(v) => set('payment_terms', v)}
                emptyLabel="— بدون —"
              />
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="الرصيد الافتتاحي">
                <input
                  type="number"
                  step="0.01"
                  dir="ltr"
                  value={values.madaar_opening_balance ?? 0}
                  onChange={(e) => set('madaar_opening_balance', Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
                />
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
            </div>
          )}
        </div>

        {/* Footer — red Cancel pill + gradient Submit, matching reference */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/20">
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 text-sm font-semibold rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-100 transition-all"
          >
            <X size={16} />
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] transition-all disabled:opacity-60"
          >
            <Check size={16} />
            {isEdit ? 'تحديث' : 'حفظ'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Small primitives — kept inline so the file is self-contained ─────────────

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
  const spanCls =
    span === 2
      ? 'md:col-span-2'
      : span === 3
        ? 'md:col-span-3'
        : span === 4
          ? 'md:col-span-4'
          : '';
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
  const ring =
    color === 'emerald'
      ? 'text-emerald-500 focus:ring-emerald-500'
      : 'text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]';
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`w-5 h-5 rounded border-slate-300 ${ring}`}
      />
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  );
}

/** Native <select> populated from Frappe via `useFrappeGetDocList`. Good enough for
 *  short master lists (categories, payment terms, sales persons). */
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
      >
        <option value="">{emptyLabel}</option>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        {/* If the doctype isn't installed on this site, show why instead of a silent empty list. */}
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
