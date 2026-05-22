import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFrappeGetCall, useFrappeGetDoc, useFrappeCreateDoc, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { Plus, Building2, DollarSign, ListChecks, Edit3 } from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';
import { FormCard } from '../components/erp/FormCard';
import { FormField, FIELD_INPUT_CLASS, FormSubmit, FormCancel, FormBackButton } from '../components/erp/FormField';

const AVAILABLE_MODULES: Array<{ key: string; nameAr: string; nameEn: string }> = [
  { key: 'accounting',    nameAr: 'الحسابات',           nameEn: 'Accounting' },
  { key: 'sales',         nameAr: 'المبيعات',           nameEn: 'Sales' },
  { key: 'purchases',     nameAr: 'المشتريات',          nameEn: 'Purchases' },
  { key: 'inventory',     nameAr: 'المخزون',            nameEn: 'Inventory' },
  { key: 'treasury',      nameAr: 'الخزينة',            nameEn: 'Treasury' },
  { key: 'crm',           nameAr: 'CRM',               nameEn: 'CRM' },
  { key: 'hr',            nameAr: 'الموارد البشرية',    nameEn: 'HR' },
  { key: 'construction',  nameAr: 'المقاولات',          nameEn: 'Construction' },
  { key: 'fleet',         nameAr: 'الأسطول',            nameEn: 'Fleet' },
  { key: 'logistics',     nameAr: 'اللوجستيك',          nameEn: 'Logistics' },
  { key: 'ecommerce',     nameAr: 'المتجر الإلكتروني',  nameEn: 'E-Commerce' },
  { key: 'restaurant',    nameAr: 'المطاعم',            nameEn: 'Restaurant' },
  { key: 'workshop',      nameAr: 'مراكز الصيانة',      nameEn: 'Workshop' },
  { key: 'manufacturing', nameAr: 'التصنيع',            nameEn: 'Manufacturing' },
  { key: 'tax',           nameAr: 'الضرائب',            nameEn: 'Tax' },
  { key: 'support',       nameAr: 'الدعم',              nameEn: 'Support' },
  { key: 'assets',        nameAr: 'الأصول الثابتة',     nameEn: 'Fixed Assets' },
  { key: 'events',        nameAr: 'الفعاليات',          nameEn: 'Events' },
  { key: 'lms',           nameAr: 'منصة التعليم',       nameEn: 'LMS' },
];

interface PlanRow {
  name: string;
  plan_code: string;
  name_en: string;
  name_ar: string;
  is_active: 0 | 1;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  trial_days: number;
  max_companies: number;
  max_users_per_company: number;
  max_branches: number;
  max_warehouses: number;
  modules?: string;
}

/** /super-admin/plans — list page. */
export default function SuperAdminPlans() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { data } = useFrappeGetCall<{ message: PlanRow[] }>('madaar_core.api.list_subscription_plans');
  const rows = data?.message ?? [];

  return (
    <PageShell
      title={isAr ? 'الباقات والأسعار' : 'Plans & pricing'}
      subtitle={isAr ? 'ضبط الباقات والحدود والموديولات المسموحة' : 'Configure plans, limits, and allowed modules'}
      actions={
        <Link to="/super-admin/plans/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm">
          <Plus size={16} />
          {isAr ? 'باقة جديدة' : 'New plan'}
        </Link>
      }
    >
      {/* Matching reference palette: rotating gradients per card */}
      {(() => {
        const PALETTES = [
          { bg: 'from-blue-600 to-indigo-700',    shadow: 'hover:shadow-blue-500/30',    sub: 'text-blue-200'   },
          { bg: 'from-violet-600 to-purple-700',  shadow: 'hover:shadow-violet-500/30',  sub: 'text-violet-200' },
          { bg: 'from-cyan-600 to-teal-700',      shadow: 'hover:shadow-cyan-500/30',    sub: 'text-cyan-200'   },
          { bg: 'from-amber-500 to-orange-600',   shadow: 'hover:shadow-amber-500/30',   sub: 'text-amber-200'  },
          { bg: 'from-emerald-600 to-teal-700',   shadow: 'hover:shadow-emerald-500/30', sub: 'text-emerald-200'},
          { bg: 'from-rose-600 to-red-700',       shadow: 'hover:shadow-rose-500/30',    sub: 'text-rose-200'   },
        ];
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rows.map((p, i) => {
              const c = PALETTES[i % PALETTES.length];
              const mods = (p.modules ?? '').split(',').map((m) => m.trim()).filter(Boolean);
              return (
                <Link
                  key={p.name}
                  to={`/super-admin/plans/${encodeURIComponent(p.name)}/edit`}
                  className={`group block rounded-2xl bg-gradient-to-br ${c.bg} p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${c.shadow} cursor-pointer h-[220px] flex flex-col justify-between`}
                >
                  {/* Top */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      {p.trial_days > 0 ? (
                        <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold text-white">
                          🎁 {isAr ? 'تجريبية' : 'Trial'}
                        </span>
                      ) : <span />}
                      <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold text-white">
                        {mods.length} {isAr ? 'موديول' : 'modules'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mb-1">{isAr ? p.name_ar : p.name_en}</h3>
                    {p.name_en && isAr && (
                      <p className={`text-xs opacity-70 ${c.sub}`}>{p.name_en}</p>
                    )}
                  </div>

                  {/* Bottom */}
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white">{Number(p.monthly_price ?? 0).toLocaleString()}</span>
                      <span className="text-xs text-white/70 font-bold">{p.currency ?? 'EGP'} / {isAr ? 'شهرياً' : 'mo'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[11px] text-white/50`}>
                        {Number(p.yearly_price ?? 0).toLocaleString()} {p.currency ?? 'EGP'} / {isAr ? 'سنوياً' : 'yr'}
                      </span>
                      <span className="text-xs text-white/60 group-hover:text-white transition flex items-center gap-1">
                        {isAr ? 'تعديل' : 'Edit'}
                        <Edit3 size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {rows.length === 0 && (
              <div className="col-span-full rounded-2xl bg-white/10 p-12 text-center text-sm text-white/60">
                {isAr ? 'لا توجد باقات بعد — أنشئ أول باقة' : 'No plans yet — create your first one'}
              </div>
            )}
          </div>
        );
      })()}
    </PageShell>
  );
}

/** Create / edit plan form. /super-admin/plans/create  +  /super-admin/plans/:name/edit. */
export function SuperAdminPlanForm() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { name } = useParams<{ name?: string }>();
  const navigate = useNavigate();
  const isEdit = !!name;

  const { data: existing } = useFrappeGetDoc<any>('Madaar Subscription Plan', name ?? '', name ? `plan-${name}` : null);
  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();

  const [form, setForm] = useState({
    plan_code:              '',
    name_ar:                '',
    name_en:                '',
    description_ar:         '',
    description_en:         '',
    is_active:              1,
    sort_order:             0,
    trial_days:             14,
    monthly_price:          0,
    yearly_price:           0,
    currency:               'EGP',
    billing_period:         'monthly',
    max_companies:          1,
    max_users_per_company:  5,
    max_branches:           1,
    max_warehouses:         1,
    max_invoices_per_month: -1,
    max_products:           -1,
    max_employees:          -1,
    max_storage_mb:         5000,
    modules:                '',
  });
  const [moduleSet, setModuleSet] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Hydrate when the existing doc loads.
  useEffect(() => {
    if (!existing) return;
    setForm((f) => ({ ...f, ...existing }));
    setModuleSet(new Set((existing.modules ?? '').split(',').map((m: string) => m.trim()).filter(Boolean)));
  }, [existing]);

  function toggleModule(key: string) {
    setModuleSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...form, modules: Array.from(moduleSet).sort().join(',') };
      if (isEdit) {
        await updateDoc('Madaar Subscription Plan', name!, payload);
      } else {
        await createDoc('Madaar Subscription Plan', { doctype: 'Madaar Subscription Plan', ...payload });
      }
      navigate('/super-admin/plans');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || String(err));
    }
  }

  return (
    <PageShell
      title={isEdit ? (isAr ? `تعديل الباقة — ${form.name_ar || name}` : `Edit plan — ${form.name_ar || name}`) : (isAr ? 'إنشاء باقة جديدة' : 'Create a new plan')}
      subtitle={isAr ? 'ضبط تفاصيل الباقة والموديولات المسموحة' : 'Configure plan details and allowed modules'}
      actions={<FormBackButton to="/super-admin/plans">{isAr ? 'رجوع' : 'Back'}</FormBackButton>}
    >
      <form onSubmit={submit} className="space-y-6">
        {/* ── Basic details ─────────────────────────────────────────────── */}
        <FormCard color="brand" title={isAr ? 'البيانات الأساسية' : 'Basic details'} icon={<Building2 size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={isAr ? 'كود الباقة' : 'Plan code'} required hint={isAr ? 'مثل starter, pro, enterprise' : 'e.g. starter, pro, enterprise'}>
              <input value={form.plan_code} onChange={(e) => setForm({ ...form, plan_code: e.target.value })} required disabled={isEdit} className={FIELD_INPUT_CLASS} dir="ltr" />
            </FormField>
            <FormField label={isAr ? 'ترتيب العرض' : 'Sort order'}>
              <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || '0', 10) })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'اسم الباقة بالعربية' : 'Name (Arabic)'} required>
              <input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} required className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'اسم الباقة بالإنجليزية' : 'Name (English)'} required>
              <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} required dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الوصف بالعربية' : 'Description (Arabic)'}>
              <textarea rows={2} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الوصف بالإنجليزية' : 'Description (English)'}>
              <textarea rows={2} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className={FIELD_INPUT_CLASS} dir="ltr" />
            </FormField>
          </div>
        </FormCard>

        {/* ── Pricing & limits ──────────────────────────────────────────── */}
        <FormCard color="amber" title={isAr ? 'الأسعار والحدود' : 'Pricing & limits'} icon={<DollarSign size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label={isAr ? 'السعر الشهري' : 'Monthly price'} required>
              <input type="number" step="0.01" min={0} value={form.monthly_price ?? 0} onChange={(e) => setForm({ ...form, monthly_price: parseFloat(e.target.value) || 0 })} required className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'السعر السنوي' : 'Yearly price'}>
              <input type="number" step="0.01" min={0} value={form.yearly_price ?? 0} onChange={(e) => setForm({ ...form, yearly_price: parseFloat(e.target.value) || 0 })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'العملة' : 'Currency'}>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'أيام التجربة' : 'Trial days'}>
              <input type="number" min={0} value={form.trial_days ?? 0} onChange={(e) => setForm({ ...form, trial_days: parseInt(e.target.value || '0', 10) })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'فترة الفوترة الافتراضية' : 'Default billing period'}>
              <select value={form.billing_period} onChange={(e) => setForm({ ...form, billing_period: e.target.value })} className={FIELD_INPUT_CLASS}>
                <option value="monthly">{isAr ? 'شهرية' : 'Monthly'}</option>
                <option value="yearly">{isAr ? 'سنوية' : 'Yearly'}</option>
              </select>
            </FormField>
            <FormField label={isAr ? 'نشطة' : 'Active'}>
              <label className="inline-flex items-center gap-2 mt-2">
                <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
                <span className="text-xs text-slate-600 dark:text-slate-400">{isAr ? 'الباقة نشطة ومتاحة' : 'Plan is active and available'}</span>
              </label>
            </FormField>
            <FormField label={isAr ? 'الحد الأقصى للمستخدمين' : 'Max users / company'} required>
              <input type="number" min={1} value={form.max_users_per_company ?? 0} onChange={(e) => setForm({ ...form, max_users_per_company: parseInt(e.target.value || '0', 10) })} required className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الحد الأقصى للفروع' : 'Max branches'} required>
              <input type="number" min={1} value={form.max_branches ?? 0} onChange={(e) => setForm({ ...form, max_branches: parseInt(e.target.value || '0', 10) })} required className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الحد الأقصى للمخازن' : 'Max warehouses'} required>
              <input type="number" min={1} value={form.max_warehouses ?? 0} onChange={(e) => setForm({ ...form, max_warehouses: parseInt(e.target.value || '0', 10) })} required className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'فواتير/شهر' : 'Invoices / month'} hint="-1 = unlimited">
              <input type="number" value={form.max_invoices_per_month ?? -1} onChange={(e) => setForm({ ...form, max_invoices_per_month: parseInt(e.target.value || '-1', 10) })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الحد الأقصى للمنتجات' : 'Max products'} hint="-1 = unlimited">
              <input type="number" value={form.max_products ?? -1} onChange={(e) => setForm({ ...form, max_products: parseInt(e.target.value || '-1', 10) })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الحد الأقصى للموظفين' : 'Max employees'} hint="-1 = unlimited">
              <input type="number" value={form.max_employees ?? -1} onChange={(e) => setForm({ ...form, max_employees: parseInt(e.target.value || '-1', 10) })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'مساحة التخزين (MB)' : 'Storage (MB)'}>
              <input type="number" min={0} value={form.max_storage_mb ?? 0} onChange={(e) => setForm({ ...form, max_storage_mb: parseInt(e.target.value || '0', 10) })} className={FIELD_INPUT_CLASS} />
            </FormField>
          </div>
        </FormCard>

        {/* ── Allowed modules ───────────────────────────────────────────── */}
        <FormCard color="emerald" title={isAr ? 'الموديولات المسموحة' : 'Allowed modules'} icon={<ListChecks size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AVAILABLE_MODULES.map((m) => {
              const checked = moduleSet.has(m.key);
              return (
                <label key={m.key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
                  <input type="checkbox" checked={checked} onChange={() => toggleModule(m.key)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-white">{isAr ? m.nameAr : m.nameEn}</p>
                    <p className="text-[10px] text-slate-400" dir="ltr">{m.key}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </FormCard>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex items-center gap-3">
          <FormSubmit loading={creating || updating}>
            {isEdit ? (isAr ? 'تحديث الباقة' : 'Update plan') : (isAr ? 'إنشاء الباقة' : 'Create plan')}
          </FormSubmit>
          <FormCancel href="/super-admin/plans">{isAr ? 'إلغاء' : 'Cancel'}</FormCancel>
        </div>
      </form>
    </PageShell>
  );
}
