import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { FormShell } from '@/components/erp/FormShell';
import { ErrorPanel } from '@/components/erp/ErrorPanel';
import { eventsSectionByKey } from '@/lib/events/registry';

/**
 * Generic create / edit form for any Events section. URL forms:
 *   /events/<section>/create   →  new doc
 *   /events/<section>/<id>/edit → edit existing doc by name
 */
export default function EventsForm() {
  const params = useParams<{ section: string; id?: string }>();
  const sectionKey = params.section ?? '';
  const id = params.id;
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const Back = isRTL ? ArrowRight : ArrowLeft;

  const section = eventsSectionByKey(sectionKey);

  if (!section) {
    return (
      <PageShell title={t('common.error')}>
        <ErrorPanel
          error={{ message: `Unknown events section "${sectionKey}".`, exc: 'NotFound' }}
        />
      </PageShell>
    );
  }

  const isEdit = Boolean(id);
  const titleBase = t(section.titleKey, { defaultValue: section.defaultTitle });
  const title = isEdit
    ? `${titleBase} — ${id}`
    : `${t('action.create')} — ${titleBase}`;

  const listPath = `/events/${section.key}`;
  const actions = (
    <button
      type="button"
      onClick={() => navigate(listPath)}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-app px-4 py-2 text-sm font-medium hover:bg-[color:var(--color-card)]"
    >
      <Back size={16} />
      {t('action.back', { defaultValue: 'Back' })}
    </button>
  );

  return (
    <PageShell title={title} actions={actions}>
      <FormShell
        doctype={section.doctype}
        name={id}
        onSuccess={() => navigate(listPath)}
      />
    </PageShell>
  );
}
