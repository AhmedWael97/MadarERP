import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
  useFrappeGetCall,
} from 'frappe-react-sdk';
import {
  Building2, Package, Users, Settings2, ChevronLeft, ChevronRight, Save, CheckCircle2,
} from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';
import { FormCard } from '../components/erp/FormCard';
import { FormField, FIELD_INPUT_CLASS, FormSubmit, FormBackButton } from '../components/erp/FormField';
import { useTenantStore } from '../lib/store/tenantStore';

/* ─── Constants ───────────────────────────────────────────────────────────── */

const ALL_MODULES = [
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
];

const ACCOUNTING_FIELDS: Array<{ field: string; labelAr: string; section: string }> = [
  { field: 'default_receivable_account', labelAr: 'حساب العملاء (ذمم مدينة)',   section: 'sales' },
  { field: 'default_income_account',     labelAr: 'حساب المبيعات',              section: 'sales' },
  { field: 'default_discount_account',   labelAr: 'حساب الخصومات',              section: 'sales' },
  { field: 'default_tax_account',        labelAr: 'حساب الضريبة',               section: 'sales' },

  { field: 'default_payable_account',    labelAr: 'حساب الموردين (ذمم دائنة)',  section: 'purchases' },
  { field: 'default_expense_account',    labelAr: 'حساب المصروفات',             section: 'purchases' },

  { field: 'default_inventory_account',  labelAr: 'حساب المخزون',               section: 'cash' },
  { field: 'default_cost_of_goods_sold_account', labelAr: 'تكلفة البضاعة المباعة (COGS)', section: 'cash' },
  { field: 'default_cash_account',       labelAr: 'حساب النقدية',               section: 'cash' },
  { field: 'default_bank_account',       labelAr: 'حساب البنك',                 section: 'cash' },
  { field: 'retained_earnings_account',  labelAr: 'حساب الأرباح المحتجزة',      section: 'cash' },
  { field: 'exchange_gain_account',      labelAr: 'حساب أرباح فروق العملات',    section: 'cash' },
  { field: 'exchange_loss_account',      labelAr: 'حساب خسائر فروق العملات',   section: 'cash' },
  { field: 'round_off_account',          labelAr: 'حساب التقريب',               section: 'cash' },
  { field: 'write_off_account',          labelAr: 'حساب الإهلاك / الشطب',      section: 'cash' },
  { field: 'suspense_account',           labelAr: 'حساب التسويات',              section: 'cash' },
];

const STATUS_PILL: Record<string, string> = {
  trial:     'bg-blue-100 text-blue-700',
  active:    'bg-emerald-100 text-emerald-700',
  suspended: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-rose-100 text-rose-700',
  expired:   'bg-slate-100 text-slate-500',
};

/* ─── Main Component ─────────────────────────────────────────────────────── */

type Tab = 'overview' | 'modules' | 'accounting' | 'users';

export default function SuperAdminCompanyDetail() {
  const { name } = useParams<{ name: string }>();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [saved, setSaved] = useState(false);

  /* ── Tenant subscription record ── */
  const { data: tenant, mutate: mutateTenant } = useFrappeGetDoc(
    'Madaar Tenant Subscription',
    name ?? '',
    name ? `tenant-${name}` : null,
  );

  /* ── ERPNext Company record (for accounting settings) ── */
  const companyId = tenant?.tenant_company ?? name;
  const { data: erpCompany, mutate: mutateCompany } = useFrappeGetDoc(
    'Company',
    companyId ?? '',
    companyId ? `company-${companyId}` : null,
  );

  /* ── Accounts list for dropdowns ── */
  const { data: accountsResp } = useFrappeGetDocList('Account', {
    filters: [['company', '=', companyId ?? '']],
    fields: ['name', 'account_name', 'account_type', 'root_type'],
    limit: 500,
    orderBy: { field: 'account_name', order: 'asc' },
  });
  const accounts: Array<{ name: string; account_name: string }> = accountsResp ?? [];

  /* ── Users list ── */
  const { data: usersResp } = useFrappeGetDocList('User', {
    filters: [['enabled', '=', 1]],
    fields: ['name', 'full_name', 'email', 'last_active', 'user_type'],
    limit: 200,
    orderBy: { field: 'creation', order: 'desc' },
  });
  const allUsers: Array<{ name: string; full_name?: string; email?: string; last_active?: string; user_type?: string }> = usersResp ?? [];

  /* ── Accounting form state ── */
  const [acctForm, setAcctForm] = useState<Record<string, string>>({});
  const [acctBools, setAcctBools] = useState({
    multi_currency_enabled: false,
    enable_cost_centers: false,
    cost_center_required: false,
    enable_project_dimension: false,
  });

  useEffect(() => {
    if (erpCompany) {
      const vals: Record<string, string> = {};
      ACCOUNTING_FIELDS.forEach(({ field }) => {
        vals[field] = (erpCompany as any)[field] ?? '';
      });
      setAcctForm(vals);
      setAcctBools({
        multi_currency_enabled:  !!(erpCompany as any).multi_currency_enabled,
        enable_cost_centers:     !!(erpCompany as any).enable_cost_centers,
        cost_center_required:    !!(erpCompany as any).cost_center_required,
        enable_project_dimension: !!(erpCompany as any).enable_project_dimension,
      });
    }
  }, [erpCompany]);

  /* ── Module form state ── */
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  useEffect(() => {
    if (tenant) {
      try {
        const raw = (tenant as any).enabled_modules;
        if (raw) setEnabledModules(JSON.parse(raw));
        else setEnabledModules(ALL_MODULES.filter((m) => m.isCore).map((m) => m.key));
      } catch {
        setEnabledModules(ALL_MODULES.filter((m) => m.isCore).map((m) => m.key));
      }
    }
  }, [tenant]);

  const { updateDoc: updateTenant, loading: savingTenant } = useFrappeUpdateDoc();
  const { updateDoc: updateCompany, loading: savingCompany } = useFrappeUpdateDoc();

  const [error, setError] = useState<string | null>(null);

  /* ── Open Company: stash tenant + enabled modules in the global store and
       jump to /dashboard. The sidebar will then hide every module the
       tenant doesn't have enabled. ── */
  const navigate = useNavigate();
  const setActiveTenant = useTenantStore((s) => s.setActiveTenant);
  function openCompany() {
    const companyName = (tenant as any)?.tenant_company || '';
    const label =
      (tenant as any)?.name_ar ||
      companyName ||
      name ||
      '';
    setActiveTenant(name ?? '', companyName, label, enabledModules);
    navigate('/dashboard');
  }

  async function saveAccountingConfig(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateCompany('Company', companyId ?? '', { ...acctForm, ...acctBools });
      await mutateCompany();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || String(err));
    }
  }

  async function saveModules(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateTenant('Madaar Tenant Subscription', name ?? '', {
        enabled_modules: JSON.stringify(enabledModules),
      });
      await mutateTenant();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || String(err));
    }
  }

  function toggleModule(key: string, isCore: boolean) {
    if (isCore) return;
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  const statusCls = STATUS_PILL[(tenant as any)?.subscription_status ?? ''] ?? STATUS_PILL.active;

  const TABS: Array<{ id: Tab; labelAr: string; icon: React.ReactNode }> = [
    { id: 'overview',   labelAr: 'نظرة عامة',         icon: <Building2 size={15} /> },
    { id: 'modules',    labelAr: 'الموديولات',          icon: <Package size={15} /> },
    { id: 'accounting', labelAr: 'إعدادات المحاسبة',   icon: <Settings2 size={15} /> },
    { id: 'users',      labelAr: 'المستخدمون',          icon: <Users size={15} /> },
  ];

  return (
    <PageShell
      title={(tenant as any)?.name_ar || name || ''}
      subtitle={(tenant as any)?.tenant_company || ''}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCompany}
            disabled={enabledModules.length === 0}
            title={
              enabledModules.length === 0
                ? (isAr ? 'فعّل وحدات أولاً من تبويب "الوحدات"' : 'Enable some modules first from the Modules tab')
                : (isAr ? 'افتح هذه الشركة وأرَ ما يراه مدير الشركة' : 'Open this company — see exactly what its admin sees')
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} className={isAr ? '' : 'rotate-180'} />
            {isAr ? 'فتح الشركة' : 'Open Company'}
          </button>
          <Link
            to={`/super-admin/companies/${encodeURIComponent(name ?? '')}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            {isAr ? 'تعديل' : 'Edit'}
          </Link>
          <FormBackButton to="/super-admin/companies">
            <ChevronLeft size={14} />
            {isAr ? 'رجوع' : 'Back'}
          </FormBackButton>
        </div>
      }
    >
      {/* Status badge + meta */}
      <div className="flex flex-wrap items-center gap-3 mb-6 -mt-2">
        {(tenant as any)?.subscription_status && (
          <span className={`text-xs px-2.5 py-1 rounded-xl font-bold ${statusCls}`}>
            {{ trial: 'تجريبي', active: 'نشط', suspended: 'معلّق', cancelled: 'ملغي', expired: 'منتهي' }[(tenant as any).subscription_status as string] ?? ''}
          </span>
        )}
        {(tenant as any)?.subscription_plan && (
          <span className="text-xs text-slate-500">باقة: <strong>{(tenant as any).subscription_plan}</strong></span>
        )}
        {(tenant as any)?.subdomain && (
          <span className="text-xs text-slate-500 font-mono" dir="ltr">{(tenant as any).subdomain}.madaar.app</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setError(null); setSaved(false); }}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
              activeTab === t.id
                ? 'border-[color:var(--color-brand-600)] text-[color:var(--color-brand-600)]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white',
            ].join(' ')}
          >
            {t.icon} {t.labelAr}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormCard color="brand" title="بيانات الشركة" icon={<Building2 size={18} />}>
            <dl className="space-y-3 text-sm">
              {[
                { l: 'الاسم بالعربية',  v: (tenant as any)?.name_ar },
                { l: 'Company ID',       v: (tenant as any)?.tenant_company },
                { l: 'النطاق الفرعي',   v: (tenant as any)?.subdomain ? `${(tenant as any).subdomain}.madaar.app` : '—' },
                { l: 'الإيميل',         v: (tenant as any)?.owner_email },
                { l: 'الهاتف',          v: (tenant as any)?.phone },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{l}</dt>
                  <dd className="font-semibold text-slate-800 dark:text-white text-end">{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </FormCard>

          <FormCard color="emerald" title="الاشتراك" icon={<Settings2 size={18} />}>
            <dl className="space-y-3 text-sm">
              {[
                { l: 'الباقة',           v: (tenant as any)?.subscription_plan },
                { l: 'الحالة',           v: (tenant as any)?.subscription_status },
                { l: 'تاريخ البداية',    v: (tenant as any)?.subscription_start_date },
                { l: 'تاريخ الانتهاء',  v: (tenant as any)?.subscription_end_date },
                { l: 'الرسوم الشهرية',  v: `${((tenant as any)?.monthly_amount ?? 0).toLocaleString()} ${(tenant as any)?.currency ?? ''}` },
                { l: 'الحد الأقصى للمستخدمين', v: (tenant as any)?.max_users ?? '—' },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{l}</dt>
                  <dd className="font-semibold text-slate-800 dark:text-white text-end">{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </FormCard>
        </div>
      )}

      {/* ── Modules Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'modules' && (
        <form onSubmit={saveModules} className="space-y-6">
          <FormCard color="violet" title="الموديولات المفعّلة" icon={<Package size={18} />}>
            <p className="text-xs text-slate-500 mb-4">
              اختر الموديولات المتاحة لهذه الشركة. الموديولات الأساسية مفعّلة دائماً.
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

          {error && <p className="text-sm text-rose-600">{error}</p>}
          {saved && <p className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> تم الحفظ بنجاح</p>}
          <FormSubmit loading={savingTenant}>حفظ الموديولات</FormSubmit>
        </form>
      )}

      {/* ── Accounting Tab ────────────────────────────────────────────────── */}
      {activeTab === 'accounting' && (
        <form onSubmit={saveAccountingConfig} className="space-y-6">
          {/* Sales accounts */}
          <FormCard color="emerald" title="حسابات المبيعات" icon={<Settings2 size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACCOUNTING_FIELDS.filter((f) => f.section === 'sales').map(({ field, labelAr }) => (
                <FormField key={field} label={labelAr}>
                  <select
                    value={acctForm[field] ?? ''}
                    onChange={(e) => setAcctForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    className={FIELD_INPUT_CLASS}
                    dir="ltr"
                  >
                    <option value="">— اختر الحساب —</option>
                    {accounts.map((a) => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </FormField>
              ))}
            </div>
          </FormCard>

          {/* Purchases accounts */}
          <FormCard color="amber" title="حسابات المشتريات" icon={<Settings2 size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACCOUNTING_FIELDS.filter((f) => f.section === 'purchases').map(({ field, labelAr }) => (
                <FormField key={field} label={labelAr}>
                  <select
                    value={acctForm[field] ?? ''}
                    onChange={(e) => setAcctForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    className={FIELD_INPUT_CLASS}
                    dir="ltr"
                  >
                    <option value="">— اختر الحساب —</option>
                    {accounts.map((a) => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </FormField>
              ))}
            </div>
          </FormCard>

          {/* Cash / Bank / Inventory accounts */}
          <FormCard color="blue" title="حسابات المخزون والنقدية" icon={<Settings2 size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACCOUNTING_FIELDS.filter((f) => f.section === 'cash').map(({ field, labelAr }) => (
                <FormField key={field} label={labelAr}>
                  <select
                    value={acctForm[field] ?? ''}
                    onChange={(e) => setAcctForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    className={FIELD_INPUT_CLASS}
                    dir="ltr"
                  >
                    <option value="">— اختر الحساب —</option>
                    {accounts.map((a) => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </FormField>
              ))}
            </div>
          </FormCard>

          {/* Options */}
          <FormCard color="violet" title="خيارات إضافية" icon={<Settings2 size={18} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                { key: 'multi_currency_enabled',  label: 'تفعيل العملات المتعددة' },
                { key: 'enable_cost_centers',     label: 'تفعيل مراكز التكلفة' },
                { key: 'cost_center_required',    label: 'مركز التكلفة إلزامي' },
                { key: 'enable_project_dimension', label: 'تفعيل المشاريع كبُعد تحليلي' },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={acctBools[key]}
                    onChange={(e) => setAcctBools((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="accent-violet-600 w-4 h-4"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </FormCard>

          {error && <p className="text-sm text-rose-600">{error}</p>}
          {saved && <p className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> تم حفظ الإعدادات بنجاح</p>}
          <FormSubmit loading={savingCompany}>
            <Save size={15} />
            حفظ إعدادات المحاسبة
          </FormSubmit>
        </form>
      )}

      {/* ── Users Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              الحد الأقصى: <strong>{(tenant as any)?.max_users ?? '∞'}</strong> مستخدم
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5">
                  <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">المستخدم</th>
                  <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">الإيميل</th>
                  <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">النوع</th>
                  <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase">آخر نشاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                {allUsers.map((u) => (
                  <tr key={u.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-white">{u.full_name || u.name}</td>
                    <td className="px-5 py-3 text-slate-500" dir="ltr">{u.email || u.name}</td>
                    <td className="px-5 py-3 text-slate-500">{u.user_type === 'System User' ? 'مستخدم النظام' : 'مستخدم الموقع'}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs" dir="ltr">{u.last_active || '—'}</td>
                  </tr>
                ))}
                {allUsers.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">لا يوجد مستخدمون</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}
