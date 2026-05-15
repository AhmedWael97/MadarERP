import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, FileText, List, FolderTree, BarChart3, Plus } from 'lucide-react';
import { PageShell } from './PageShell';
import { routes as generatedRoutes } from '../../_generated/pages.manifest';

interface Props {
  module: string;
  titleKey: string;
  defaultTitle: string;
}

const VIEW_ICON: Record<string, typeof List> = {
  list: List,
  tree: FolderTree,
  form: Plus,
  report: BarChart3,
  detail: FileText,
  dashboard: BarChart3,
};

const VIEW_LABEL_AR: Record<string, string> = {
  list: 'قائمة',
  tree: 'شجرة',
  form: 'إضافة جديد',
  report: 'تقرير',
  detail: 'تفاصيل',
  dashboard: 'لوحة',
};

/** Lists every generated route inside a module as a card grid in Arabic. */
export function ModuleHub({ module, titleKey, defaultTitle }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  // Filter the manifest to routes that belong to this module. Exclude:
  //   - legacy per-id edit pages (slug `…--<n>--edit`) — the generator now collapses
  //     these into a single `:id`-parameter route, but be defensive in case stale
  //     output sticks around.
  //   - the collapsed dynamic edit route itself (`…--$id--edit`) — there's nothing
  //     useful to link to without a concrete id.
  const pages = generatedRoutes.filter((r) => {
    if (r.module !== module) return false;
    if (r.slug.match(/--\d+--edit$/)) return false;
    if (r.slug.includes('$id')) return false;
    return true;
  });

  return (
    <PageShell title={t(titleKey, { defaultValue: defaultTitle })}>
      {pages.length === 0 ? (
        <p className="text-sm text-[color:var(--color-muted)]">{t('common.empty')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pages.map((p) => {
            const Icon = VIEW_ICON[p.viewType] ?? List;
            const kindLabel = VIEW_LABEL_AR[p.viewType] ?? '';
            return (
              <Link
                key={p.path}
                to={p.path}
                className="group flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4 shadow-[var(--shadow-card)] transition-all hover:border-[color:var(--color-primary)] hover:shadow-[var(--shadow-elev)]"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-input)] bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {t(p.titleKey, { defaultValue: isRTL ? p.titleArabic : p.titleEnglish })}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[color:var(--color-muted)]">
                    {kindLabel}
                  </div>
                </div>
                <Chevron
                  size={16}
                  className="shrink-0 text-[color:var(--color-muted)] transition-colors group-hover:text-[color:var(--color-primary)]"
                />
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
