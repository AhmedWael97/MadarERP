import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import {
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
  type SettingsGroupKey,
  type SettingsSection,
} from '@/lib/settings/registry';

/**
 * The settings hub — categorized cards for every ERPNext + Frappe settings
 * doctype the UI exposes. Each card links to /settings/<key> which renders
 * FormShell against the corresponding Single (or resolved-name) DocType.
 */
export default function Settings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  return (
    <PageShell
      title={t('pages:page.core.settings.title', { defaultValue: 'Settings' })}
      subtitle={t('settings.hub.subtitle', {
        defaultValue: 'Configure every ERPNext and Frappe module from one place.',
      })}
    >
      <div className="space-y-8">
        {SETTINGS_GROUPS.map((g) => {
          const sections = SETTINGS_SECTIONS.filter((s) => s.group === g.key);
          if (sections.length === 0) return null;
          return (
            <GroupSection
              key={g.key}
              groupKey={g.key}
              title={t(g.titleKey, { defaultValue: g.defaultTitle })}
              sections={sections}
              Chevron={Chevron}
            />
          );
        })}
      </div>
    </PageShell>
  );
}

interface GroupSectionProps {
  groupKey: SettingsGroupKey;
  title: string;
  sections: SettingsSection[];
  Chevron: typeof ChevronLeft;
}

function GroupSection({ title, sections, Chevron }: GroupSectionProps) {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.key}
              to={`/settings/${s.key}`}
              className="group flex items-start gap-3 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4 shadow-[var(--shadow-card)] transition-all hover:border-[color:var(--color-primary)] hover:shadow-[var(--shadow-elev)]"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-input)] bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {t(s.titleKey, { defaultValue: s.defaultTitle })}
                </div>
                <div className="mt-0.5 line-clamp-2 text-xs text-[color:var(--color-muted)]">
                  {t(s.descKey, { defaultValue: s.defaultDesc })}
                </div>
              </div>
              <Chevron
                size={16}
                className="mt-1 shrink-0 text-[color:var(--color-muted)] transition-colors group-hover:text-[color:var(--color-primary)]"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
