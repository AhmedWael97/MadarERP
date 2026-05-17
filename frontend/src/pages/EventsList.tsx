import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTable } from '@/components/erp/DataTable';
import { ErrorPanel } from '@/components/erp/ErrorPanel';
import { eventsSectionByKey } from '@/lib/events/registry';

/**
 * Generic list page for any Events section — DataTable derives columns from
 * the DocType's `in_list_view` fields, so we don't need to maintain per-doctype
 * column lists in the SPA.
 */
export default function EventsList() {
  const { section: key = '' } = useParams<{ section: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const Back = isRTL ? ArrowRight : ArrowLeft;

  const section = eventsSectionByKey(key);

  if (!section) {
    return (
      <PageShell title={t('common.error')}>
        <ErrorPanel
          error={{ message: `Unknown events section "${key}".`, exc: 'NotFound' }}
        />
      </PageShell>
    );
  }

  const title = t(section.titleKey, { defaultValue: section.defaultTitle });
  const subtitle = t(section.descKey, { defaultValue: section.defaultDesc });

  const actions = (
    <>
      <button
        type="button"
        onClick={() => navigate('/events')}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-app px-4 py-2 text-sm font-medium hover:bg-[color:var(--color-card)]"
      >
        <Back size={16} />
        {t('action.back', { defaultValue: 'Back' })}
      </button>
      <Link
        to={`/events/${section.key}/create`}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] bg-[color:var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={16} />
        {t('action.create')}
      </Link>
    </>
  );

  return (
    <PageShell title={title} subtitle={subtitle} actions={actions}>
      <DataTable doctype={section.doctype} />
    </PageShell>
  );
}
