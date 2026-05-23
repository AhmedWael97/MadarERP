import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFrappeGetCall, useFrappeGetDoc, useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeDeleteDoc, useFrappePostCall } from 'frappe-react-sdk';
import { Plus, Search, Building2, DollarSign, User as UserIcon, Save, Globe, Package, Settings, AlertTriangle, Trash2, KeyRound } from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';
import { FormCard } from '../components/erp/FormCard';
import { FormField, FIELD_INPUT_CLASS, FormSubmit, FormCancel, FormInfoBanner, FormBackButton } from '../components/erp/FormField';

const CURRENCIES = [
  { code: 'EGP', nameAr: 'جنيه مصري' },
  { code: 'SAR', nameAr: 'ريال سعودي' },
  { code: 'AED', nameAr: 'درهم إماراتي' },
  { code: 'KWD', nameAr: 'دينار كويتي' },
  { code: 'BHD', nameAr: 'دينار بحريني' },
  { code: 'OMR', nameAr: 'ريال عماني' },
  { code: 'QAR', nameAr: 'ريال قطري' },
  { code: 'JOD', nameAr: 'دينار أردني' },
  { code: 'MAD', nameAr: 'درهم مغربي' },
  { code: 'USD', nameAr: 'دولار أمريكي' },
  { code: 'EUR', nameAr: 'يورو' },
  { code: 'GBP', nameAr: 'جنيه إسترليني' },
  { code: 'TRY', nameAr: 'ليرة تركية' },
];

const COUNTRIES = [
  'Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar',
  'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Morocco', 'Algeria',
  'Tunisia', 'Libya', 'Sudan', 'Iraq', 'Yemen', 'Palestine',
  'United States', 'United Kingdom', 'Germany', 'France', 'Turkey',
];

const COA_TEMPLATES = [
  { value: '',                            labelAr: '— افتراضي حسب الدولة —' },
  { value: 'Standard',                    labelAr: 'Standard' },
  { value: 'Standard with IFRS Accounts', labelAr: 'Standard with IFRS Accounts' },
];

const ALL_MODULES: Array<{ key: string; nameAr: string; isCore: boolean }> = [
  { key: 'accounting',    nameAr: 'الحسابات',             isCore: true  },
  { key: 'sales',         nameAr: 'المبيعات',             isCore: true  },
  { key: 'purchases',     nameAr: 'المشتريات',            isCore: true  },
  { key: 'inventory',     nameAr: 'المخزون',              isCore: true  },
  { key: 'treasury',      nameAr: 'الخزينة',              isCore: true  },
  { key: 'crm',           nameAr: 'إدارة العملاء',        isCore: false },
  { key: 'hr',            nameAr: 'الموارد البشرية',      isCore: false },
  { key: 'construction',  nameAr: 'المقاولات',            isCore: false },
  { key: 'fleet',         nameAr: 'الأسطول',              isCore: false },
  { key: 'logistics',     nameAr: 'الخدمات اللوجستية',   isCore: false },
  { key: 'ecommerce',     nameAr: 'المتجر الإلكتروني',   isCore: false },
  { key: 'restaurant',    nameAr: 'إدارة المطاعم',        isCore: false },
  { key: 'workshop',      nameAr: 'مراكز الصيانة',        isCore: false },
  { key: 'manufacturing', nameAr: 'التصنيع',              isCore: false },
  { key: 'tax',           nameAr: 'الضرائب',              isCore: false },
  { key: 'support',       nameAr: 'الدعم الفني',          isCore: false },
  { key: 'assets',        nameAr: 'الأصول الثابتة',       isCore: false },
  { key: 'events',        nameAr: 'الفعاليات',            isCore: false },
  { key: 'lms',           nameAr: 'منصة التعليم',         isCore: false },
  { key: 'pos',           nameAr: 'نقطة البيع (POS)',     isCore: false },
];

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
                  <td className="px-5 py-3 text-end flex items-center justify-end gap-3">
                    <Link to={`/super-admin/companies/${encodeURIComponent(r.name)}`} className="text-xs text-slate-500 font-bold hover:underline">
                      {isAr ? 'عرض' : 'View'}
                    </Link>
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
  // The Tenant Subscription's `tenant_company` is a Link to ERPNext Company —
  // we need to create the Company first or the insert throws
  // LinkValidationError. `create_company_with_subscription` does both in one
  // shot and filters out form-only fields (subdomain, max_users, etc.) that
  // don't exist on the subscription doctype.
  const { call: createCompanyWithSubscription, loading: creatingViaApi } = useFrappePostCall<{
    message: { ok: boolean; tenant_company: string; subscription: string; company_created: boolean };
  }>('madaar_core.api.create_company_with_subscription');
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const { data: plansResp } = useFrappeGetCall<{ message: any[] }>('madaar_core.api.list_subscription_plans');
  const plans = plansResp?.message ?? [];

  const [form, setForm] = useState({
    tenant_company:           existing?.tenant_company           ?? '',
    name_ar:                  existing?.name_ar                  ?? '',
    owner_email:              existing?.owner_email              ?? '',
    phone:                    existing?.phone                    ?? '',
    subdomain:                existing?.subdomain                ?? '',
    max_users:                existing?.max_users                ?? 5,
    subscription_plan:        existing?.subscription_plan        ?? '',
    subscription_status:      existing?.subscription_status      ?? 'trial',
    subscription_start_date:  existing?.subscription_start_date  ?? new Date().toISOString().slice(0, 10),
    subscription_end_date:    existing?.subscription_end_date    ?? '',
    monthly_amount:           existing?.monthly_amount           ?? 0,
    currency:                 existing?.currency                 ?? 'EGP',
    notes:                    existing?.notes                    ?? '',
    abbr:              existing?.abbr              ?? '',
    default_currency:  existing?.default_currency  ?? 'EGP',
    country:           existing?.country           ?? 'Egypt',
    chart_of_accounts: existing?.chart_of_accounts ?? '',
    fy_start_date:     existing?.fy_start_date     ?? `${new Date().getFullYear()}-01-01`,
    fy_end_date:       existing?.fy_end_date       ?? `${new Date().getFullYear()}-12-31`,
    name_en:              existing?.name_en              ?? '',
    city:                 existing?.city                 ?? '',
    tax_number:           existing?.tax_number           ?? '',
    mobile:               existing?.mobile               ?? '',
    commercial_register:  existing?.commercial_register  ?? '',
    admin_name_ar: '',
    admin_name_en: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    admin_password_confirmation: '',
  });

  // Parse modules from JSON string field on the doctype
  const [enabledModules, setEnabledModules] = useState<string[]>(() => {
    try {
      const raw = existing?.enabled_modules;
      if (!raw) return ALL_MODULES.filter((m) => m.isCore).map((m) => m.key);
      return JSON.parse(raw);
    } catch {
      return ALL_MODULES.filter((m) => m.isCore).map((m) => m.key);
    }
  });

  // Re-init when existing loads (async)
  useEffect(() => {
    if (existing) {
      setForm({
        tenant_company:           existing.tenant_company           ?? '',
        name_ar:                  existing.name_ar                  ?? '',
        owner_email:              existing.owner_email              ?? '',
        phone:                    existing.phone                    ?? '',
        subdomain:                existing.subdomain                ?? '',
        max_users:                existing.max_users                ?? 5,
        subscription_plan:        existing.subscription_plan        ?? '',
        subscription_status:      existing.subscription_status      ?? 'trial',
        subscription_start_date:  existing.subscription_start_date  ?? new Date().toISOString().slice(0, 10),
        subscription_end_date:    existing.subscription_end_date    ?? '',
        monthly_amount:           existing.monthly_amount           ?? 0,
        currency:                 existing.currency                 ?? 'EGP',
        notes:                    existing.notes                    ?? '',
        abbr:              existing.abbr              ?? '',
        default_currency:  existing.default_currency  ?? 'EGP',
        country:           existing.country           ?? 'Egypt',
        chart_of_accounts: existing.chart_of_accounts ?? '',
        fy_start_date:     existing.fy_start_date     ?? `${new Date().getFullYear()}-01-01`,
        fy_end_date:       existing.fy_end_date       ?? `${new Date().getFullYear()}-12-31`,
        name_en:              existing.name_en              ?? '',
        city:                 existing.city                 ?? '',
        tax_number:           existing.tax_number           ?? '',
        mobile:               existing.mobile               ?? '',
        commercial_register:  existing.commercial_register  ?? '',
        admin_name_ar: '',
        admin_name_en: '',
        admin_email: '',
        admin_phone: '',
        admin_password: '',
        admin_password_confirmation: '',
      });
      try {
        const raw = existing.enabled_modules;
        if (raw) setEnabledModules(JSON.parse(raw));
      } catch { /* keep default */ }
    }
  }, [existing]);

  function toggleModule(key: string, isCore: boolean) {
    if (isCore) return; // core modules cannot be disabled
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  // Delete company
  const { deleteDoc } = useFrappeDeleteDoc();
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Company users (edit mode only)
  const { data: usersData } = useFrappeGetCall<{ message: any[] }>(
    'madaar_core.api.get_company_users',
    { company: name },
    name ? `company-users-${name}` : null,
  );
  const companyUsers = usersData?.message ?? [];

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    const confirmName = form.name_ar || name!;
    if (deleteConfirm !== confirmName) return;
    setDeleteError(null);
    try {
      await deleteDoc('Madaar Tenant Subscription', name!);
      navigate('/super-admin/companies');
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || err?.message || String(err));
    }
  }

  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload: any = {
        ...form,
        enabled_modules: JSON.stringify(enabledModules),
      };
      delete payload.admin_name_ar;
      delete payload.admin_name_en;
      delete payload.admin_email;
      delete payload.admin_phone;
      delete payload.admin_password;
      delete payload.admin_password_confirmation;
      if (isEdit) {
        await updateDoc('Madaar Tenant Subscription', name!, payload);
      } else {
        // Two-step create lives behind a single whitelisted method on the
        // backend — it creates the ERPNext Company first (seeds CoA), then
        // the Madaar Tenant Subscription linked to it. Calling the regular
        // `createDoc('Madaar Tenant Subscription', ...)` was throwing
        // LinkValidationError because tenant_company → Company hadn't
        // been created yet.
        await createCompanyWithSubscription(payload);
      }
      navigate('/super-admin/companies');
    } catch (err: any) {
      // Surface the actual Frappe error if present — _server_messages is a
      // stringified array of stringified JSON objects, so unwrap one level.
      let msg: string | undefined;
      try {
        const sm = err?.response?.data?._server_messages;
        if (typeof sm === 'string') {
          const arr = JSON.parse(sm);
          if (Array.isArray(arr) && arr.length) {
            const first = typeof arr[0] === 'string' ? JSON.parse(arr[0]) : arr[0];
            msg = first?.message;
          }
        }
      } catch { /* fall through */ }
      setError(
        msg ||
        err?.response?.data?.exception ||
        err?.response?.data?.message ||
        err?.message ||
        String(err),
      );
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
            <FormField label={isAr ? 'الاسم بالإنجليزية' : 'Name (English)'}>
              <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} dir="ltr" placeholder="Company Name" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الكود (Company ID)' : 'Company ID'} required hint={isAr ? 'يستخدم كمعرف فريد للشركة' : 'Unique identifier — used in URLs'}>
              <input
                value={form.tenant_company}
                onChange={(e) => {
                  const tc = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    tenant_company: tc,
                    // auto-fill abbr from first 4 alphanumeric chars while abbr is still empty
                    ...(prev.abbr === '' ? { abbr: tc.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() } : {}),
                  }));
                }}
                required
                disabled={isEdit}
                className={FIELD_INPUT_CLASS}
              />
            </FormField>
            <FormField label={isAr ? 'الإيميل' : 'Email'}>
              <input type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الهاتف' : 'Phone'}>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'المدينة' : 'City'}>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الرقم الضريبي' : 'Tax number'} hint={isAr ? 'رقم التسجيل الضريبي (VAT/Tax ID)' : 'VAT / Tax registration number'}>
              <input value={form.tax_number} onChange={(e) => setForm({ ...form, tax_number: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الموبايل' : 'Mobile'}>
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'السجل التجاري' : 'Commercial register'}>
              <input value={form.commercial_register} onChange={(e) => setForm({ ...form, commercial_register: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'النطاق الفرعي (Subdomain)' : 'Subdomain'} hint={isAr ? 'مثال: company-name — سيظهر كـ company-name.madaar.app' : 'e.g. company-name → company-name.madaar.app'}>
              <div className="flex items-center gap-0">
                <input
                  value={form.subdomain}
                  onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  dir="ltr"
                  placeholder="company-name"
                  className={`${FIELD_INPUT_CLASS} rounded-e-none border-e-0`}
                />
                <span className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-e-xl text-slate-500 whitespace-nowrap">
                  .madaar.app
                </span>
              </div>
            </FormField>
            <FormField label={isAr ? 'الحد الأقصى للمستخدمين' : 'Max users'}>
              <input type="number" min={1} max={9999} value={form.max_users || ''} onChange={(e) => setForm({ ...form, max_users: parseInt(e.target.value) || 5 })} className={FIELD_INPUT_CLASS} />
            </FormField>
          </div>
        </FormCard>

        {/* ── ERPNext Company Setup ─────────────────────────────────────── */}
        <FormCard color="teal" title={isAr ? 'إعداد الشركة في النظام' : 'ERPNext company setup'} icon={<Globe size={20} />}>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {isAr
              ? 'هذه المعلومات تُستخدم لإنشاء الشركة في ERPNext وتحديد دليل الحسابات والسنة المالية تلقائياً. اختصار الشركة يُضاف لنهاية كل اسم حساب.'
              : 'Used to create the ERPNext Company record, auto-generate the chart of accounts, and configure the fiscal year. The abbreviation is appended to every account name.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={isAr ? 'اختصار الشركة (Abbr)' : 'Company abbreviation'} required hint={isAr ? 'مثال: MDD — يُلحق بكل أسماء الحسابات تلقائياً' : 'e.g. MDD — auto-appended to all account names'}>
              <input
                value={form.abbr}
                onChange={(e) => setForm({ ...form, abbr: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) })}
                required
                maxLength={5}
                placeholder="ABC"
                dir="ltr"
                className={FIELD_INPUT_CLASS}
              />
            </FormField>
            <FormField label={isAr ? 'العملة الافتراضية' : 'Default currency'} required>
              <select value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value })} required className={FIELD_INPUT_CLASS} dir="ltr">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.nameAr}</option>
                ))}
              </select>
            </FormField>
            <FormField label={isAr ? 'الدولة' : 'Country'} required>
              <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required className={FIELD_INPUT_CLASS}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
            <FormField label={isAr ? 'قالب دليل الحسابات' : 'Chart of accounts template'} hint={isAr ? 'اتركه فارغاً لاستخدام القالب الافتراضي للدولة' : 'Leave blank to use the country default'}>            
              <select value={form.chart_of_accounts} onChange={(e) => setForm({ ...form, chart_of_accounts: e.target.value })} className={FIELD_INPUT_CLASS} dir="ltr">
                {COA_TEMPLATES.map((t) => (
                  <option key={t.value} value={t.value}>{t.labelAr}</option>
                ))}
              </select>
            </FormField>
            <FormField label={isAr ? 'بداية السنة المالية' : 'Fiscal year start'} required>
              <input type="date" value={form.fy_start_date} onChange={(e) => setForm({ ...form, fy_start_date: e.target.value })} required className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'نهاية السنة المالية' : 'Fiscal year end'} required>
              <input type="date" value={form.fy_end_date} onChange={(e) => setForm({ ...form, fy_end_date: e.target.value })} required className={FIELD_INPUT_CLASS} />
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
              <FormField label={isAr ? 'اسم المدير بالإنجليزية' : 'Admin name (English)'}>
                <input value={form.admin_name_en} onChange={(e) => setForm({ ...form, admin_name_en: e.target.value })} dir="ltr" placeholder="Ahmed Mohamed" className={FIELD_INPUT_CLASS} />
              </FormField>
              <FormField label={isAr ? 'إيميل المدير (لتسجيل الدخول)' : 'Admin email (for sign-in)'} required>
                <input type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} required dir="ltr" placeholder="admin@company.com" className={FIELD_INPUT_CLASS} />
              </FormField>
              <FormField label={isAr ? 'هاتف المدير' : 'Admin phone'}>
                <input type="tel" value={form.admin_phone} onChange={(e) => setForm({ ...form, admin_phone: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
              </FormField>
              <FormField label={isAr ? 'كلمة المرور' : 'Password'} required hint={isAr ? '8 أحرف على الأقل' : 'At least 8 characters'}>
                <input type="password" minLength={8} value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} required className={FIELD_INPUT_CLASS} />
              </FormField>
              <FormField label={isAr ? 'تأكيد كلمة المرور' : 'Confirm password'} required>
                <input type="password" minLength={8} value={form.admin_password_confirmation} onChange={(e) => setForm({ ...form, admin_password_confirmation: e.target.value })} required className={FIELD_INPUT_CLASS} />
              </FormField>
            </div>
          </FormCard>
        )}

        {/* ── Modules ─────────────────────────────────────────────────────── */}
        <FormCard color="violet" title={isAr ? 'الموديولات المفعّلة' : 'Enabled modules'} icon={<Package size={20} />}>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {isAr ? 'اختر الموديولات التي ستكون متاحة لهذه الشركة. الموديولات الأساسية مفعّلة دائماً.' : 'Select modules available for this company. Core modules are always enabled.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ALL_MODULES.map((mod) => {
              const checked = enabledModules.includes(mod.key);
              return (
                <label
                  key={mod.key}
                  className={[
                    'flex items-center gap-2 p-2.5 rounded-xl border text-sm cursor-pointer select-none transition-colors',
                    mod.isCore
                      ? 'border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-700 opacity-80 cursor-not-allowed'
                      : checked
                        ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30 dark:border-violet-500 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 hover:border-violet-300',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={mod.isCore}
                    onChange={() => toggleModule(mod.key, mod.isCore)}
                    className="accent-violet-600"
                  />
                  <span>{mod.nameAr}</span>
                  {mod.isCore && <span className="ms-auto text-[9px] bg-violet-200 dark:bg-violet-700 text-violet-700 dark:text-violet-200 rounded-md px-1">أساسي</span>}
                </label>
              );
            })}
          </div>
        </FormCard>

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        <FormCard color="amber" title={isAr ? 'ملاحظات داخلية' : 'Internal notes'} icon={<Save size={20} />}>
          <FormField label={isAr ? 'ملاحظات' : 'Notes'} span="full">
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={FIELD_INPUT_CLASS} />
          </FormField>
        </FormCard>

        {/* ── Company users — password reset (edit only) ─────────────────── */}
        {isEdit && (
          <FormCard color="blue" title={isAr ? 'مستخدمي الشركة — تغيير كلمة المرور' : 'Company users — password reset'} icon={<KeyRound size={20} />}>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 mb-4">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {isAr
                  ? 'يمكنك تغيير كلمة المرور لأي مستخدم في الشركة من هنا. اضغط على "تغيير كلمة المرور" بجانب المستخدم المراد.'
                  : 'You can reset the password for any company user below. Click "Change password" next to the user.'}
              </p>
            </div>
            {companyUsers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                {isAr ? 'لا يوجد مستخدمين مسجلين لهذه الشركة' : 'No users registered for this company'}
              </p>
            ) : (
              <div className="space-y-4">
                {companyUsers.map((u: any) => (
                  <CompanyUserRow key={u.name} user={u} company={name!} isAr={isAr} />
                ))}
              </div>
            )}
          </FormCard>
        )}

        {/* ── Danger zone — delete company (edit only) ──────────────────── */}
        {isEdit && (
          <FormCard color="rose" title={isAr ? 'منطقة الخطر' : 'Danger zone'} icon={<AlertTriangle size={20} />}>
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20">
              <div className="flex items-start gap-3">
                <Trash2 className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">
                    {isAr ? 'حذف الشركة بالكامل' : 'Delete this company'}
                  </h4>
                  <p className="text-xs text-rose-600 dark:text-rose-400/80 mb-4">
                    {isAr
                      ? 'سيتم تعطيل جميع مستخدمي الشركة وحذف بيانات الشركة من النظام. هذا الإجراء لا يمكن التراجع عنه بسهولة.'
                      : 'All company users will be disabled and the company data removed from the system. This action cannot be easily undone.'}
                  </p>
                  <form onSubmit={handleDelete} className="flex items-end gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
                        {isAr ? 'اكتب اسم الشركة للتأكيد:' : 'Type the company name to confirm:'}{' '}
                        <span className="font-mono bg-rose-100 dark:bg-rose-500/10 px-1.5 py-0.5 rounded text-rose-700 dark:text-rose-300">
                          {form.name_ar || name}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder={form.name_ar || name}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-rose-300 dark:border-rose-500/30 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={deleteConfirm !== (form.name_ar || name!)}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-500 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                      {isAr ? 'حذف الشركة نهائياً' : 'Delete company permanently'}
                    </button>
                  </form>
                  {deleteError && <p className="text-xs text-rose-600 mt-2">{deleteError}</p>}
                </div>
              </div>
            </div>
          </FormCard>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex items-center gap-3">
          <FormSubmit loading={creating || creatingViaApi || updating}>
            {isEdit ? (isAr ? 'تحديث الشركة' : 'Update company') : (isAr ? 'إنشاء الشركة' : 'Create company')}
          </FormSubmit>
          <FormCancel href="/super-admin/companies">{isAr ? 'إلغاء' : 'Cancel'}</FormCancel>
        </div>
      </form>
    </PageShell>
  );
}

/** Per-user password-reset row (rendered inside the edit-mode users card). */
function CompanyUserRow({ user, company, isAr }: { user: any; company: string; isAr: boolean }) {
  const [show, setShow] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const { call, loading } = useFrappePostCall<{ message: string }>('madaar_core.api.reset_company_user_password');

  const userTypeLabels: Record<string, { ar: string; en: string }> = {
    super_admin:    { ar: 'سوبر أدمن', en: 'Super admin' },
    company_owner:  { ar: 'مالك الشركة', en: 'Company owner' },
    employee:       { ar: 'موظف', en: 'Employee' },
  };
  const typeLabel = userTypeLabels[user.user_type] ?? { ar: user.user_type, en: user.user_type };
  const initials = (user.name_ar ?? user.name ?? '?').slice(0, 1);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pwd !== pwdConfirm) {
      setMsg(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    try {
      await call({ company, user: user.name, new_password: pwd });
      setMsg(isAr ? '✓ تم تغيير كلمة المرور بنجاح' : '✓ Password changed successfully');
      setShow(false);
      setPwd('');
      setPwdConfirm('');
    } catch (err: any) {
      setMsg(err?.response?.data?.message || err?.message || String(err));
    }
  }

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/30 bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-white">{user.name_ar ?? user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${user.user_type === 'company_owner' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
            {isAr ? typeLabel.ar : typeLabel.en}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${user.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {user.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive')}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-700/30">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
        >
          <KeyRound size={14} />
          {show ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'تغيير كلمة المرور' : 'Change password')}
        </button>

        {show && (
          <form onSubmit={handleReset} className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'كلمة المرور الجديدة *' : 'New password *'}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder={isAr ? '8 أحرف على الأقل' : 'At least 8 chars'}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'تأكيد كلمة المرور *' : 'Confirm password *'}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                placeholder={isAr ? 'أعد كتابة كلمة المرور' : 'Repeat password'}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-all shadow-sm disabled:opacity-60"
              >
                <KeyRound size={14} />
                {isAr ? 'حفظ كلمة المرور' : 'Save password'}
              </button>
            </div>
            {msg && <p className="col-span-full text-xs mt-1 text-blue-600 dark:text-blue-400">{msg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
