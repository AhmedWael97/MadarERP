import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFrappeGetCall, useFrappeGetDoc, useFrappeCreateDoc, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { Plus, Search, Building2, DollarSign, User as UserIcon, Save } from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';
import { FormCard } from '../components/erp/FormCard';
import { FormField, FIELD_INPUT_CLASS, FormSubmit, FormCancel, FormInfoBanner, FormBackButton } from '../components/erp/FormField';

interface TenantRow {
  name: string;
  tenant_company: string;
  name_ar: string;
  subscription_plan: string;
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired';
  subscription_start_date?: string;
  subscription_end_date?: string;
  owner_email?: string;
  phone?: string;
  monthly_amount?: number;
  currency?: string;
  current_users?: number;
}

const STATUS_PILL: Record<TenantRow['subscription_status'], { ar: string; en: string; cls: string }> = {
  trial:     { ar: 'تجريبي', en: 'Trial',    cls: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600' },
  active:    { ar: 'نشط',    en: 'Active',   cls: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' },
  suspended: { ar: 'معلق',   en: 'Suspended', cls: 'bg-red-100 dark:bg-red-500/10 text-red-600' },
  cancelled: { ar: 'ملغي',   en: 'Cancelled', cls: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600' },
  expired:   { ar: 'منتهي',  en: 'Expired',  cls: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600' },
};

/** /super-admin/companies — list page. */
export default function SuperAdminCompanies() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data } = useFrappeGetCall<{ message: { rows: TenantRow[]; total: number } }>(
    'madaar_core.api.list_tenant_subscriptions',
    { search, status: statusFilter, limit: 50, offset: 0 },
    `tenants-${search}-${statusFilter}`,
  );
  const rows = data?.message?.rows ?? [];

  return (
    <PageShell
      title={isAr ? 'إدارة الشركات' : 'Companies'}
      subtitle={isAr ? 'جميع الشركات المسجلة في النظام' : 'All tenant companies on the platform'}
      actions={
        <Link
          to="/super-admin/companies/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm"
        >
          <Plus size={16} />
          {isAr ? 'شركة جديدة' : 'New company'}
        </Link>
      }
    >
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'بحث…' : 'Search…'}
              className="w-full ps-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-white/5"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="">{isAr ? 'كل الحالات' : 'All statuses'}</option>
            <option value="trial">{isAr ? 'تجريبي' : 'Trial'}</option>
            <option value="active">{isAr ? 'نشط' : 'Active'}</option>
            <option value="suspended">{isAr ? 'معلق' : 'Suspended'}</option>
            <option value="cancelled">{isAr ? 'ملغي' : 'Cancelled'}</option>
            <option value="expired">{isAr ? 'منتهي' : 'Expired'}</option>
          </select>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5">
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'الشركة' : 'Company'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'الباقة' : 'Plan'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'الإيميل' : 'Email'}</th>
              <th className="px-5 py-3 text-end text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'الرسوم الشهرية' : 'Monthly'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'الحالة' : 'Status'}</th>
              <th className="px-5 py-3 text-end text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
            {rows.map((r) => {
              const pill = STATUS_PILL[r.subscription_status] ?? STATUS_PILL.active;
              return (
                <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <p className="font-bold text-slate-800 dark:text-white">{r.name_ar || r.tenant_company}</p>
                    <p className="text-[10px] text-slate-400">{r.tenant_company}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{r.subscription_plan || '—'}</td>
                  <td className="px-5 py-3 text-slate-500" dir="ltr">{r.owner_email || '—'}</td>
                  <td className="px-5 py-3 text-end font-bold">{(r.monthly_amount ?? 0).toLocaleString()} {r.currency ?? ''}</td>
                  <td className="px-5 py-3">
                    <span className={['text-[10px] px-2 py-0.5 rounded-lg font-bold', pill.cls].join(' ')}>
                      {isAr ? pill.ar : pill.en}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-end">
                    <Link to={`/super-admin/companies/${encodeURIComponent(r.name)}/edit`} className="text-xs text-[color:var(--color-brand-600)] font-bold hover:underline">
                      {isAr ? 'تعديل' : 'Edit'}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">{isAr ? 'لا توجد شركات بعد' : 'No companies yet'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

/** Create / edit form. Routed at /super-admin/companies/create AND /super-admin/companies/:name/edit. */
export function SuperAdminCompanyForm() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { name } = useParams<{ name?: string }>();
  const navigate = useNavigate();
  const isEdit = !!name;

  const { data: existing } = useFrappeGetDoc('Madaar Tenant Subscription', name ?? '', name ? `tenant-${name}` : null);
  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const { data: plansResp } = useFrappeGetCall<{ message: any[] }>('madaar_core.api.list_subscription_plans');
  const plans = plansResp?.message ?? [];

  const [form, setForm] = useState({
    tenant_company:           existing?.tenant_company           ?? '',
    name_ar:                  existing?.name_ar                  ?? '',
    owner_email:              existing?.owner_email              ?? '',
    phone:                    existing?.phone                    ?? '',
    subscription_plan:        existing?.subscription_plan        ?? '',
    subscription_status:      existing?.subscription_status      ?? 'trial',
    subscription_start_date:  existing?.subscription_start_date  ?? new Date().toISOString().slice(0, 10),
    subscription_end_date:    existing?.subscription_end_date    ?? '',
    monthly_amount:           existing?.monthly_amount           ?? 0,
    currency:                 existing?.currency                 ?? 'EGP',
    notes:                    existing?.notes                    ?? '',
    admin_name_ar: '',
    admin_email: '',
    admin_password: '',
  });
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload: any = { ...form };
      delete payload.admin_name_ar;
      delete payload.admin_email;
      delete payload.admin_password;
      if (isEdit) {
        await updateDoc('Madaar Tenant Subscription', name!, payload);
      } else {
        payload.doctype = 'Madaar Tenant Subscription';
        await createDoc('Madaar Tenant Subscription', payload);
      }
      navigate('/super-admin/companies');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || String(err));
    }
  }

  return (
    <PageShell
      title={isEdit ? (isAr ? `تعديل الشركة — ${form.name_ar || name}` : `Edit company — ${form.name_ar || name}`) : (isAr ? 'إنشاء شركة جديدة' : 'Create a new company')}
      subtitle={isAr ? 'إضافة شركة جديدة للنظام' : 'Add a new tenant company'}
      actions={<FormBackButton to="/super-admin/companies">{isAr ? 'رجوع' : 'Back'}</FormBackButton>}
    >
      <form onSubmit={submit} className="space-y-6">
        {/* ── Basic details ─────────────────────────────────────────────── */}
        <FormCard color="brand" title={isAr ? 'البيانات الأساسية' : 'Basic details'} icon={<Building2 size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={isAr ? 'الاسم بالعربية' : 'Name (Arabic)'} required>
              <input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} required className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الكود (Company ID)' : 'Company ID'} required hint={isAr ? 'يستخدم كمعرف فريد للشركة' : 'Unique identifier — used in URLs'}>
              <input value={form.tenant_company} onChange={(e) => setForm({ ...form, tenant_company: e.target.value })} required disabled={isEdit} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الإيميل' : 'Email'}>
              <input type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الهاتف' : 'Phone'}>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
          </div>
        </FormCard>

        {/* ── Subscription ──────────────────────────────────────────────── */}
        <FormCard color="emerald" title={isAr ? 'الاشتراك' : 'Subscription'} icon={<DollarSign size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={isAr ? 'الباقة' : 'Plan'}>
              <select value={form.subscription_plan} onChange={(e) => setForm({ ...form, subscription_plan: e.target.value })} className={FIELD_INPUT_CLASS}>
                <option value="">{isAr ? '— بدون باقة (تجريبي) —' : '— No plan (trial) —'}</option>
                {plans.map((p) => (
                  <option key={p.name} value={p.name}>
                    {isAr ? p.name_ar : p.name_en} — {Number(p.monthly_price ?? 0).toLocaleString()} {p.currency ?? 'EGP'} / {isAr ? 'شهر' : 'month'}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={isAr ? 'الحالة' : 'Status'} required>
              <select value={form.subscription_status} onChange={(e) => setForm({ ...form, subscription_status: e.target.value })} required className={FIELD_INPUT_CLASS}>
                <option value="trial">{isAr ? 'تجريبي' : 'Trial'}</option>
                <option value="active">{isAr ? 'نشط' : 'Active'}</option>
                <option value="suspended">{isAr ? 'معلق' : 'Suspended'}</option>
                <option value="cancelled">{isAr ? 'ملغي' : 'Cancelled'}</option>
                <option value="expired">{isAr ? 'منتهي' : 'Expired'}</option>
              </select>
            </FormField>
            <FormField label={isAr ? 'تاريخ البداية' : 'Start date'}>
              <input type="date" value={form.subscription_start_date} onChange={(e) => setForm({ ...form, subscription_start_date: e.target.value })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'تاريخ النهاية' : 'End date'}>
              <input type="date" value={form.subscription_end_date} onChange={(e) => setForm({ ...form, subscription_end_date: e.target.value })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الرسوم الشهرية' : 'Monthly amount'}>
              <input type="number" min={0} step="0.01" value={form.monthly_amount || ''} onChange={(e) => setForm({ ...form, monthly_amount: parseFloat(e.target.value) || 0 })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'العملة' : 'Currency'}>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={FIELD_INPUT_CLASS} />
            </FormField>
          </div>
        </FormCard>

        {/* ── Admin credentials (only on create) ────────────────────────── */}
        {!isEdit && (
          <FormCard color="blue" title={isAr ? 'بيانات مدير الشركة' : 'Company admin credentials'} icon={<UserIcon size={20} />}>
            <FormInfoBanner>
              {isAr
                ? 'سيتم إنشاء حساب مدير الشركة تلقائياً بالبيانات التالية. هذا الحساب سيُستخدم لتسجيل الدخول وإدارة الشركة.'
                : 'A company admin user will be created with the credentials below. This account is used to sign in and manage the tenant.'}
            </FormInfoBanner>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={isAr ? 'اسم المدير بالعربية' : 'Admin name (Arabic)'} required>
                <input value={form.admin_name_ar} onChange={(e) => setForm({ ...form, admin_name_ar: e.target.value })} required placeholder={isAr ? 'مثال: أحمد محمد' : 'e.g. Ahmed Mohamed'} className={FIELD_INPUT_CLASS} />
              </FormField>
              <FormField label={isAr ? 'إيميل المدير (لتسجيل الدخول)' : 'Admin email (for sign-in)'} required>
                <input type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} required dir="ltr" placeholder="admin@company.com" className={FIELD_INPUT_CLASS} />
              </FormField>
              <FormField label={isAr ? 'كلمة المرور' : 'Password'} required hint={isAr ? '8 أحرف على الأقل' : 'At least 8 characters'}>
                <input type="password" minLength={8} value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} required className={FIELD_INPUT_CLASS} />
              </FormField>
            </div>
          </FormCard>
        )}

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        <FormCard color="amber" title={isAr ? 'ملاحظات داخلية' : 'Internal notes'} icon={<Save size={20} />}>
          <FormField label={isAr ? 'ملاحظات' : 'Notes'} span="full">
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={FIELD_INPUT_CLASS} />
          </FormField>
        </FormCard>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex items-center gap-3">
          <FormSubmit loading={creating || updating}>
            {isEdit ? (isAr ? 'تحديث الشركة' : 'Update company') : (isAr ? 'إنشاء الشركة' : 'Create company')}
          </FormSubmit>
          <FormCancel href="/super-admin/companies">{isAr ? 'إلغاء' : 'Cancel'}</FormCancel>
        </div>
      </form>
    </PageShell>
  );
}
