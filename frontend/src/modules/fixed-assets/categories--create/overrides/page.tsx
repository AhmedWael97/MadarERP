/**
 * Fixed Asset Category — create form override.
 * Mirrors reference fixed-assets/categories/create.blade.php
 *
 * ERPNext doctype: Asset Category
 *   asset_category_name      → name / name_ar
 *   madaar_name_en           → name_en (Custom Field)
 *   total_number_of_depreciations → useful life (years)
 *   frequency_of_depreciation    → months per period
 *   depreciation_method          → method
 *   madaar_depreciation_rate     → annual rate %
 *   madaar_description           → description
 *   accounts (child table)       → account links
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Check, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, extractFrappeError } from '@/modules/accounting/AccountForm';

const DEP_METHODS = [
  { v: 'Straight Line Method',       label: 'القسط الثابت' },
  { v: 'Written Down Value Method',  label: 'القسط المتناقص' },
  { v: 'Double Declining Balance Method', label: 'وحدات الإنتاج' },
];

interface CategoryDoc {
  asset_category_name?: string;
  madaar_name_en?: string;
  enable_cwip_accounting?: 0 | 1;
  depreciation_method?: string;
  total_number_of_depreciations?: number;
  frequency_of_depreciation?: number;
  madaar_depreciation_rate?: number;
  madaar_description?: string;
}

export default function Page() {
  const navigate = useNavigate();
  return (
    <RequirePerm doctype="Asset Category" action="read">
      <PageShell
        title="تصنيف أصول جديد"
        subtitle="إنشاء تصنيف جديد للأصول الثابتة مع إعدادات الإهلاك الافتراضية"
        actions={
          <button
            type="button"
            onClick={() => navigate('/fixed-assets/categories')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-sm"
          >
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body onDone={() => navigate('/fixed-assets/categories')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ onDone }: { onDone: () => void }) {
  const [values, setValues] = useState<CategoryDoc>({
    total_number_of_depreciations: 60,
    frequency_of_depreciation: 1,
    madaar_depreciation_rate: 20,
    depreciation_method: 'Straight Line Method',
    enable_cwip_accounting: 0,
  });
  const [depExpenseAcct, setDepExpenseAcct] = useState('');
  const [accDepAcct, setAccDepAcct] = useState('');
  const [assetAcct, setAssetAcct] = useState('');
  const [saving, setSaving] = useState(false);

  const { createDoc } = useFrappeCreateDoc();

  const { data: accounts } = useFrappeGetDocList<{ name: string; account_name?: string; account_number?: string }>(
    'Account',
    { fields: ['name', 'account_name', 'account_number'], limit: 400 },
  );

  function set<K extends keyof CategoryDoc>(key: K, val: CategoryDoc[K]) {
    setValues((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...values };
      // Build the accounts child table for ERPNext
      const accountRows: Record<string, unknown>[] = [];
      if (depExpenseAcct) accountRows.push({ account_type: 'Depreciation', account: depExpenseAcct });
      if (accDepAcct)     accountRows.push({ account_type: 'Accumulated Depreciation Account', account: accDepAcct });
      if (assetAcct)      accountRows.push({ account_type: 'Fixed Asset Account', account: assetAcct });
      if (accountRows.length) payload.accounts = accountRows;

      await createDoc('Asset Category', payload as any);
      toast.success('تم حفظ التصنيف');
      onDone();
    } catch (err: any) {
      toast.error(extractFrappeError(err) ?? 'تعذر الحفظ');
    } finally {
      setSaving(false);
    }
  }

  const acctOptions = (accounts ?? []).map((a) => ({
    value: a.name,
    label: `${a.account_number ? a.account_number + ' — ' : ''}${a.account_name ?? a.name}`,
  }));

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic data */}
      <Card title="بيانات التصنيف">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="الاسم بالعربية" required>
            <input
              type="text"
              required
              value={values.asset_category_name ?? ''}
              onChange={(e) => set('asset_category_name', e.target.value)}
              className={INPUT}
              placeholder="مثال: مركبات"
            />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input
              type="text"
              dir="ltr"
              value={values.madaar_name_en ?? ''}
              onChange={(e) => set('madaar_name_en', e.target.value)}
              className={INPUT}
              placeholder="e.g. Vehicles"
            />
          </Field>
          <Field label="العمر الافتراضي (أشهر)" required>
            <input
              type="number"
              required
              min={1}
              dir="ltr"
              value={values.total_number_of_depreciations ?? 60}
              onChange={(e) => set('total_number_of_depreciations', Number(e.target.value))}
              className={INPUT + ' font-mono'}
            />
          </Field>
          <Field label="نسبة الإهلاك السنوية %" required>
            <input
              type="number"
              required
              step="0.01"
              min={0}
              max={100}
              dir="ltr"
              value={values.madaar_depreciation_rate ?? 20}
              onChange={(e) => set('madaar_depreciation_rate', Number(e.target.value))}
              className={INPUT + ' font-mono'}
            />
          </Field>
          <Field label="طريقة الإهلاك" required>
            <select
              required
              value={values.depreciation_method ?? 'Straight Line Method'}
              onChange={(e) => set('depreciation_method', e.target.value)}
              className={INPUT}
            >
              {DEP_METHODS.map((m) => (
                <option key={m.v} value={m.v}>{m.label}</option>
              ))}
            </select>
          </Field>
          <Field label="تكرار الإهلاك (أشهر)">
            <input
              type="number"
              min={1}
              dir="ltr"
              value={values.frequency_of_depreciation ?? 1}
              onChange={(e) => set('frequency_of_depreciation', Number(e.target.value))}
              className={INPUT + ' font-mono'}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="وصف">
              <textarea
                rows={2}
                value={values.madaar_description ?? ''}
                onChange={(e) => set('madaar_description', e.target.value)}
                className={INPUT + ' resize-none'}
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!values.enable_cwip_accounting}
              onChange={(e) => set('enable_cwip_accounting', e.target.checked ? 1 : 0)}
              className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">تفعيل محاسبة الإنشاء (CWIP)</span>
          </label>
        </div>
      </Card>

      {/* Account links */}
      <Card title="ربط الحسابات المحاسبية" subtitle="اختياري — يُطبَّق كإعداد افتراضي عند إنشاء الأصول">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="حساب مصروف الإهلاك">
            <select value={depExpenseAcct} onChange={(e) => setDepExpenseAcct(e.target.value)} className={INPUT}>
              <option value="">— اختياري —</option>
              {acctOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="حساب مجمع الإهلاك">
            <select value={accDepAcct} onChange={(e) => setAccDepAcct(e.target.value)} className={INPUT}>
              <option value="">— اختياري —</option>
              {acctOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="حساب الأصل">
            <select value={assetAcct} onChange={(e) => setAssetAcct(e.target.value)} className={INPUT}>
              <option value="">— اختياري —</option>
              {acctOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-sm"
        >
          <X size={16} /> إلغاء
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
        >
          <Check size={16} />
          {saving ? 'جارٍ الحفظ...' : 'حفظ التصنيف'}
        </button>
      </div>
    </form>
  );
}
