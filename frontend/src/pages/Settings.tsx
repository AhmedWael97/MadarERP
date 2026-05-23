import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import {
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
  type SettingsGroupKey,
  type SettingsSection,
} from '@/lib/settings/registry';

type SettingsGroupWithSections = {
  key: SettingsGroupKey;
  titleKey: string;
  defaultTitle: string;
  sections: SettingsSection[];
};

/**
 * The settings hub — categorized cards for every ERPNext + Frappe settings
 * doctype the UI exposes. Each card links to /settings/<key> which renders
 * FormShell against the corresponding Single (or resolved-name) DocType.
 */
export default function Settings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo<SettingsGroupWithSections[]>(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return SETTINGS_GROUPS.map((group) => ({
        ...group,
        sections: SETTINGS_SECTIONS.filter((section) => section.group === group.key),
      }));
    }

    return SETTINGS_GROUPS.map((group) => ({
      ...group,
      sections: SETTINGS_SECTIONS.filter((section) => {
        if (section.group !== group.key) return false;
        const title = t(section.titleKey, { defaultValue: section.defaultTitle }).toLowerCase();
        const desc = t(section.descKey, { defaultValue: section.defaultDesc }).toLowerCase();
        return (
          title.includes(normalized) ||
          desc.includes(normalized) ||
          section.key.toLowerCase().includes(normalized) ||
          section.doctype.toLowerCase().includes(normalized) ||
          t(group.titleKey, { defaultValue: group.defaultTitle }).toLowerCase().includes(normalized)
        );
      }),
    })).filter((group) => group.sections.length > 0);
  }, [query, t]);

  const totalPages = SETTINGS_SECTIONS.length;
  const visiblePages = filteredGroups.reduce((count: number, group) => count + group.sections.length, 0);

  return (
    <PageShell
      title={t('pages:page.core.settings.title', { defaultValue: 'إعدادات النظام' })}
      subtitle={t('settings.hub.subtitle', {
        defaultValue: 'اضبط كل إعدادات ERPNext و Frappe من مكان واحد.',
      })}
    >
      <div className="space-y-6 lg:space-y-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-(--radius-card) border border-(--color-border) bg-card p-4 shadow-(--shadow-card)">
            <div className="text-xs font-semibold uppercase tracking-wider text-(--color-muted)">
              {t('settings.overview.totalPages', { defaultValue: 'إجمالي صفحات الإعدادات' })}
            </div>
            <div className="mt-2 text-2xl font-black text-(--color-primary)">{totalPages}</div>
          </div>
          <div className="rounded-(--radius-card) border border-(--color-border) bg-card p-4 shadow-(--shadow-card) sm:col-span-1 xl:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-(--color-muted)">
              {t('settings.overview.quickLinks', { defaultValue: 'انتقال سريع' })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {filteredGroups.map((group: (typeof filteredGroups)[number]) => (
                <a
                  key={group.key}
                  href={`#settings-group-${group.key}`}
                  className="rounded-full border border-(--color-border) bg-app px-3 py-1.5 text-sm text-(--color-muted) transition hover:border-(--color-primary) hover:text-(--color-primary)"
                >
                  {t(group.titleKey, { defaultValue: group.defaultTitle })}
                </a>
              ))}
            </div>
          </div>
          <label className="rounded-(--radius-card) border border-(--color-border) bg-card p-4 shadow-(--shadow-card) sm:col-span-2 xl:col-span-1">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--color-muted)">
              <Search size={14} />
              {t('settings.overview.search', { defaultValue: 'بحث في الإعدادات' })}
            </span>
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('settings.overview.searchPlaceholder', { defaultValue: 'اكتب اسم الصفحة أو الوصف' })}
                className="w-full rounded-(--radius-input) border border-(--color-border) bg-app px-3 py-2.5 pe-10 text-sm outline-none transition focus:border-(--color-primary)"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute inset-y-0 inset-e-0 flex items-center px-3 text-(--color-muted) hover:text-(--color-primary)"
                  aria-label={t('action.clear', { defaultValue: 'مسح' })}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
            <div className="mt-2 text-xs text-(--color-muted)">
              {t('settings.overview.visiblePages', { defaultValue: 'الصفحات الظاهرة' })}: {visiblePages}
            </div>
          </label>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="rounded-(--radius-card) border border-dashed border-(--color-border) bg-card p-8 text-center text-sm text-(--color-muted) shadow-(--shadow-card)">
            {t('settings.overview.noResults', { defaultValue: 'لا توجد صفحات تطابق البحث.' })}
          </div>
        ) : null}

        {filteredGroups.map((g: (typeof filteredGroups)[number]) => {
          if (g.sections.length === 0) return null;
          return (
            <GroupSection
              key={g.key}
              groupKey={g.key}
              title={t(g.titleKey, { defaultValue: g.defaultTitle })}
              sections={g.sections}
              Chevron={Chevron}
              isRTL={isRTL}
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
  isRTL: boolean;
}

function GroupSection({ groupKey, title, sections, Chevron, isRTL }: GroupSectionProps) {
  const { t } = useTranslation();
  return (
    <section id={`settings-group-${groupKey}`} className="scroll-mt-24">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.key}
              to={`/settings/${s.key}`}
              className={`group flex min-h-24 items-start gap-3 rounded-(--radius-card) border border-(--color-border) bg-card p-4 shadow-(--shadow-card) transition-all hover:border-(--color-primary) hover:shadow-(--shadow-elev) ${isRTL ? 'flex-row-reverse text-right' : ''}`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-(--radius-input) bg-(--color-primary)/10 text-(--color-primary)">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {t(s.titleKey, { defaultValue: s.defaultTitle })}
                </div>
                <div className="mt-0.5 line-clamp-2 text-xs text-(--color-muted)">
                  {t(s.descKey, { defaultValue: s.defaultDesc })}
                </div>
              </div>
              <Chevron
                size={16}
                className="mt-1 shrink-0 text-(--color-muted) transition-colors group-hover:text-(--color-primary)"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
