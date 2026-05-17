/**
 * Chart of Accounts — create / edit form override.
 * Matches reference Blade `accounting/chart-of-accounts/form.blade.php`.
 *
 * ERPNext doctype: Account. Map:
 *   code              → account_number
 *   parent            → parent_account     (Link → Account)
 *   name_ar           → account_name       (treated as Arabic)
 *   name_en           → madaar_name_en     (Custom Field)
 *   account_type      → root_type          (Asset/Liability/Equity/Income/Expense)
 *   nature            → madaar_nature      (Custom Field, debit/credit)
 *   currency          → account_currency
 *   opening_balance   → opening_balance    (handled via separate "Period Opening Voucher" in real ERPNext)
 *   description       → madaar_description (Custom Field, Small Text)
 *   is_parent         → is_group
 *   is_active         → disabled (inverse)
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

type RootType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
const ROOT_TYPES: Array<{ v: RootType; label: string }> = [
  { v: 'Asset', label: 'أصول' },
  { v: 'Liability', label: 'خصوم' },
  { v: 'Equity', label: 'حقوق ملكية' },
  { v: 'Income', label: 'إيرادات' },
  { v: 'Expense', label: 'مصروفات' },
];

interface AccountDoc {
  name?: string;
  account_name?: string;
  account_number?: string;
  parent_account?: string;
  root_type?: RootType;
  account_currency?: string;
  is_group?: 0 | 1;
  disabled?: 0 | 1;
  madaar_name_en?: string;
  madaar_nature?: 'debit' | 'credit';
  madaar_description?: string;
  madaar_opening_balance?: number;
}

export default function AccountFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Account" action="read">
      <PageShell
        title={isEdit ? 'تعديل حساب' : 'إضافة حساب جديد'}
        subtitle="أدخل بيانات الحساب المحاسبي"
        actions={
          <button type="button" onClick={() => navigate('/accounting/chart-of-accounts')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/accounting/chart-of-accounts')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<AccountDoc>({ is_group: 0, disabled: 0, madaar_nature: 'debit' });
  const { data: existing } = useFrappeGetDoc<AccountDoc>('Account', isEdit ? name : undefined, isEdit && name ? `account:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  const { data: parents } = useFrappeGetDocList<{ name: string; account_name?: string; account_number?: string }>('Account', {
    fields: ['name', 'account_name', 'account_number'],
    filters: [['is_group', '=', 1]],
    limit: 500,
    orderBy: { field: 'account_number', order: 'asc' },
  });
  const { data: currencies } = useFrappeGetDocList<{ name: string }>('Currency', { fields: ['name'], limit: 100 });

  function set<K extends keyof AccountDoc>(key: K, val: AccountDoc[K]) {
    setValues((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // ERPNext requires account_name (we feed it from the Arabic name).
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) {
        await updateDoc('Account', name, cleaned);
        toast.success('تحديث الحساب');
      } else {
        await createDoc('Account', cleaned);
        toast.success('تم الحفظ');
      }
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  const parentOptions = useMemo(
    () => (parents ?? []).map((p) => ({ value: p.name, label: `${p.account_number ?? '—'} — ${p.account_name ?? p.name}` })),
    [parents],
  );

  return (
    <form onSubmit={onSubmit}>
      <Card title="بيانات الحساب" subtitle="معلومات الحساب الأساسية">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="كود الحساب" required>
            <input type="text" required dir="ltr" placeholder="مثال: 1101" value={values.account_number ?? ''} onChange={(e) => set('account_number', e.target.value)} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="الحساب الأب">
            <select value={values.parent_account ?? ''} onChange={(e) => set('parent_account', e.target.value)} className={INPUT}>
              <option value="">— حساب رئيسي (بدون أب) —</option>
              {parentOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </Field>
          <Field label="الاسم بالعربية" required>
            <input type="text" required placeholder="مثال: النقدية" value={values.account_name ?? ''} onChange={(e) => set('account_name', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input type="text" dir="ltr" placeholder="e.g. Cash" value={values.madaar_name_en ?? ''} onChange={(e) => set('madaar_name_en', e.target.value)} className={INPUT} />
          </Field>
          <Field label="نوع الحساب" required>
            <select required value={values.root_type ?? ''} onChange={(e) => set('root_type', e.target.value as RootType)} className={INPUT}>
              <option value="">اختر النوع</option>
              {ROOT_TYPES.map((r) => (<option key={r.v} value={r.v}>{r.label}</option>))}
            </select>
          </Field>
          <Field label="طبيعة الحساب" required>
            <select required value={values.madaar_nature ?? 'debit'} onChange={(e) => set('madaar_nature', e.target.value as 'debit' | 'credit')} className={INPUT}>
              <option value="debit">مدين (Debit)</option>
              <option value="credit">دائن (Credit)</option>
            </select>
          </Field>
          <Field label="العملة">
            <select value={values.account_currency ?? ''} onChange={(e) => set('account_currency', e.target.value)} className={INPUT}>
              <option value="">العملة الافتراضية</option>
              {(currencies ?? []).map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
            </select>
          </Field>
          <Field label="الرصيد الافتتاحي">
            <input type="number" step="0.01" dir="ltr" placeholder="0.00" value={values.madaar_opening_balance ?? ''} onChange={(e) => set('madaar_opening_balance', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="الوصف">
            <textarea rows={2} placeholder="وصف اختياري للحساب" value={values.madaar_description ?? ''} onChange={(e) => set('madaar_description', e.target.value)} className={INPUT + ' resize-none'} />
          </Field>
        </div>

        <div className="flex items-center gap-6 mt-5 pt-5 border-t border-slate-100 dark:border-white/5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!values.is_group} onChange={(e) => set('is_group', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]" />
            <span className="text-sm text-slate-600 dark:text-slate-400">حساب رئيسي (له حسابات فرعية)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!values.disabled} onChange={(e) => set('disabled', e.target.checked ? 0 : 1)} className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]" />
            <span className="text-sm text-slate-600 dark:text-slate-400">نشط</span>
          </label>
        </div>

        <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
      </Card>
    </form>
  );
}

// ─── Shared building blocks ──────────────────────────────────────────────────

export const INPUT = 'w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)] transition-all';

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label}{required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

export function Footer({ onDone, saving, isEdit }: { onDone: () => void; saving: boolean; isEdit: boolean }) {
  return (
    <div className="flex justify-end items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-white/5">
      <button type="button" onClick={onDone} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
        <X size={16} /> إلغاء
      </button>
      <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all disabled:opacity-60">
        <Check size={16} /> {isEdit ? 'تحديث' : 'حفظ'}
      </button>
    </div>
  );
}

export function extractFrappeError(err: any): string | null {
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
