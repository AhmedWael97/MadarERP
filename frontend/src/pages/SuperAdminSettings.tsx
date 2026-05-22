import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, Globe, Bell, Shield, CheckCircle2 } from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';
import { FormCard } from '../components/erp/FormCard';
import { FormField, FIELD_INPUT_CLASS, FormSubmit } from '../components/erp/FormField';

export default function SuperAdminSettings() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    platform_name_ar: 'مدار',
    platform_name_en: 'Madaar',
    default_currency: 'EGP',
    trial_days: 14,
    default_max_users: 5,
    main_domain: 'madaar.app',
    support_email: 'support@madaar.app',
    allow_registration: true,
    require_email_verification: false,
    enable_subdomain_isolation: true,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production this would call a Frappe API to save platform settings
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <PageShell
      title={isAr ? 'إعدادات النظام' : 'System settings'}
      subtitle={isAr ? 'إعدادات المنصة على مستوى النظام' : 'Platform-level configuration'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform identity */}
        <FormCard color="brand" title={isAr ? 'هوية المنصة' : 'Platform identity'} icon={<Globe size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={isAr ? 'اسم المنصة (عربي)' : 'Platform name (Arabic)'}>
              <input value={form.platform_name_ar} onChange={(e) => setForm({ ...form, platform_name_ar: e.target.value })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'اسم المنصة (إنجليزي)' : 'Platform name (English)'}>
              <input value={form.platform_name_en} onChange={(e) => setForm({ ...form, platform_name_en: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'النطاق الرئيسي' : 'Main domain'} hint={isAr ? 'مثال: madaar.app' : 'e.g. madaar.app'}>
              <input value={form.main_domain} onChange={(e) => setForm({ ...form, main_domain: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'إيميل الدعم' : 'Support email'}>
              <input type="email" value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} dir="ltr" className={FIELD_INPUT_CLASS} />
            </FormField>
          </div>
        </FormCard>

        {/* Defaults */}
        <FormCard color="emerald" title={isAr ? 'الإعدادات الافتراضية' : 'Default settings'} icon={<Settings2 size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label={isAr ? 'العملة الافتراضية' : 'Default currency'}>
              <select value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value })} className={FIELD_INPUT_CLASS}>
                <option value="EGP">EGP — جنيه مصري</option>
                <option value="SAR">SAR — ريال سعودي</option>
                <option value="AED">AED — درهم إماراتي</option>
                <option value="USD">USD — دولار أمريكي</option>
                <option value="EUR">EUR — يورو</option>
              </select>
            </FormField>
            <FormField label={isAr ? 'أيام التجربة المجانية' : 'Trial days'}>
              <input type="number" min={0} max={365} value={form.trial_days} onChange={(e) => setForm({ ...form, trial_days: parseInt(e.target.value) || 0 })} className={FIELD_INPUT_CLASS} />
            </FormField>
            <FormField label={isAr ? 'الحد الافتراضي للمستخدمين' : 'Default max users'}>
              <input type="number" min={1} max={9999} value={form.default_max_users} onChange={(e) => setForm({ ...form, default_max_users: parseInt(e.target.value) || 5 })} className={FIELD_INPUT_CLASS} />
            </FormField>
          </div>
        </FormCard>

        {/* Access & security */}
        <FormCard color="violet" title={isAr ? 'الوصول والأمان' : 'Access & security'} icon={<Shield size={18} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { key: 'allow_registration' as const,         label: isAr ? 'السماح بالتسجيل الذاتي' : 'Allow self-registration' },
              { key: 'require_email_verification' as const, label: isAr ? 'تفعيل التحقق من الإيميل' : 'Require email verification' },
              { key: 'enable_subdomain_isolation' as const, label: isAr ? 'عزل الشركات بالنطاق الفرعي' : 'Enable subdomain isolation' },
            ]).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }))}
                  className="accent-violet-600 w-4 h-4"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </FormCard>

        {/* Notifications */}
        <FormCard color="amber" title={isAr ? 'الإشعارات' : 'Notifications'} icon={<Bell size={18} />}>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAr
              ? 'يتم إرسال إشعارات تلقائية عند انتهاء الاشتراكات، انضمام شركة جديدة، أو حدوث أخطاء في النظام إلى إيميل الدعم المُحدد أعلاه.'
              : 'Automatic notifications are sent on subscription expiry, new company onboarding, and system errors to the support email configured above.'}
          </p>
        </FormCard>

        {saved && (
          <p className="text-sm text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={14} />
            {isAr ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully'}
          </p>
        )}
        <FormSubmit>{isAr ? 'حفظ الإعدادات' : 'Save settings'}</FormSubmit>
      </form>
    </PageShell>
  );
}
