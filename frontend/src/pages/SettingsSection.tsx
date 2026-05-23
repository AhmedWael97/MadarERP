import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { PageShell } from '@/components/erp/PageShell';
import { FormShell } from '@/components/erp/FormShell';
import { ErrorPanel } from '@/components/erp/ErrorPanel';
import { sectionByKey } from '@/lib/settings/registry';

/**
 * Renders one settings section. Resolves the DocType + record name from the URL
 * slug and delegates rendering to FormShell, which pulls live field metadata
 * from Frappe (`frappe.desk.form.load.getdoctype`).
 *
 * Single doctypes (the common case) use name = doctype. The Company section is
 * special — we resolve the active company name first, then edit that doc.
 */
export default function SettingsSection() {
  const { section: sectionKey = '' } = useParams<{ section: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const Back = isRTL ? ArrowRight : ArrowLeft;

  const section = sectionByKey(sectionKey);

  if (!section) {
    return (
      <PageShell title={t('common.error')}>
        <ErrorPanel
          error={{
            message: t('settings.section.unknown', {
              defaultValue: `قسم الإعدادات غير معروف: "${sectionKey}".`,
            }),
            exc: 'NotFound',
          }}
        />
      </PageShell>
    );
  }

  const title = t(section.titleKey, { defaultValue: section.defaultTitle });
  const subtitle = t(section.descKey, { defaultValue: section.defaultDesc });

  const backAction = (
    <button
      type="button"
      onClick={() => navigate('/settings')}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-(--radius-input) border border-(--color-border) bg-app px-4 py-2 text-sm font-medium hover:bg-card sm:w-auto"
    >
      <Back size={16} />
      {t('action.back', { defaultValue: 'رجوع' })}
    </button>
  );

  return (
    <PageShell title={title} subtitle={subtitle} actions={backAction}>
      {section.special === 'company' ? (
        <CompanySettingsForm />
      ) : section.isSingle ? (
        // Single doctype: Frappe stores exactly one record whose name equals the doctype.
        <FormShell doctype={section.doctype} name={section.doctype} />
      ) : (
        // Non-single, non-special — link to the list page in the corresponding module
        // since we don't know which record to edit by default.
        <NonSingleNotice doctype={section.doctype} sectionKey={section.key} />
      )}
    </PageShell>
  );
}

/**
 * Company is not a Frappe Single — there can be many companies. Pick the user's
 * default (frappe.defaults.get_defaults().company) and edit that one. If no
 * companies exist, show a hint pointing to the Company list page.
 */
function CompanySettingsForm() {
  const { t } = useTranslation();

  // frappe.defaults.get_defaults returns { message: { company: "...", ... } }.
  // Whitelisted and cheap — safe to call on every settings load.
  const { data: defaults, isLoading: defaultsLoading } = useFrappeGetCall<{
    message?: { company?: string };
  }>('frappe.defaults.get_defaults', undefined, 'frappe-defaults');

  const defaultCompany = defaults?.message?.company ?? null;

  // Fall back to the first Company doc if the user has no default set.
  const { data: list, isLoading: listLoading } = useFrappeGetCall<{
    message?: Array<{ name: string }>;
  }>(
    'frappe.client.get_list',
    {
      doctype: 'Company',
      fields: '["name"]',
      limit_page_length: 1,
    },
    !defaultsLoading && !defaultCompany ? 'company-fallback' : null,
  );

  const companyName = defaultCompany ?? list?.message?.[0]?.name ?? null;

  if (defaultsLoading || listLoading) {
    return (
      <div className="rounded-(--radius-card) border border-(--color-border) bg-card p-6 text-center text-sm text-(--color-muted) shadow-(--shadow-card)">
        {t('common.loading')}
      </div>
    );
  }

  if (!companyName) {
    return (
      <div className="rounded-(--radius-card) border border-dashed border-(--color-border) bg-card px-6 py-10 text-center text-sm text-(--color-muted) shadow-(--shadow-card)">
        <p className="mb-3">
          {t('settings.company.empty', {
            defaultValue: 'لا توجد شركة حتى الآن. أنشئ شركة لإدارة إعداداتها.',
          })}
        </p>
        <Link
          to="/companies"
          className="inline-flex items-center gap-1.5 rounded-(--radius-input) bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('action.create', { defaultValue: 'إضافة جديد' })}
        </Link>
      </div>
    );
  }

  return <FormShell doctype="Company" name={companyName} />;
}

function NonSingleNotice({ doctype, sectionKey }: { doctype: string; sectionKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-(--radius-card) border border-dashed border-(--color-border) bg-card px-6 py-10 text-center text-sm text-(--color-muted) shadow-(--shadow-card)">
      <p>
        {t('settings.nonSingle.hint', {
          defaultValue: 'هذا القسم يدير سجلات متعددة. افتح القائمة لإضافة أو تعديل السجلات.',
        })}
      </p>
      <p className="mt-2 text-xs">
        DocType: <code className="rounded bg-app px-1.5 py-0.5">{doctype}</code> ·{' '}
        <span className="opacity-70">القسم: {sectionKey}</span>
      </p>
    </div>
  );
}
