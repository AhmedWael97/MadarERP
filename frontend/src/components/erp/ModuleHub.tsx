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

const VIEW_LABEL_EN: Record<string, string> = {
  list: 'List',
  tree: 'Tree',
  form: 'Create',
  report: 'Report',
  detail: 'Detail',
  dashboard: 'Dashboard',
};

/**
 * Card grid of routes inside a module — the inner content of <ModuleHub>.
 * Visual mirror of the reference's `<x-stat-card>`-style hover surface: a
 * white (or slate-900 dark) rounded-2xl card with a coloured icon disc and
 * an animated chevron on the trailing edge.
 */
export function ModuleHubCards({ module, currentPath }: { module: string; currentPath?: string }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  const pages = generatedRoutes.filter((r) => {
    if (r.module !== module) return false;
    if (r.slug.match(/--\d+--edit$/)) return false;
    if (r.slug.includes('$id')) return false;
    if (currentPath && r.path === currentPath) return false;
    return true;
  });

  if (pages.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 px-6 py-12 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.empty')}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {pages.map((p) => {
        const Icon = VIEW_ICON[p.viewType] ?? List;
        const kindLabel = isRTL
          ? VIEW_LABEL_AR[p.viewType] ?? ''
          : VIEW_LABEL_EN[p.viewType] ?? '';
        return (
          <Link
            key={p.path}
            to={p.path}
            className="group flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[color:var(--color-brand-200)] dark:hover:border-[color:var(--color-brand-500)]/30"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-brand-100)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-800 dark:text-white">
                {t(p.titleKey, { defaultValue: isRTL ? p.titleArabic : p.titleEnglish })}
              </div>
              <div className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                {kindLabel}
              </div>
            </div>
            <Chevron
              size={16}
              className="shrink-0 text-slate-300 dark:text-slate-600 transition-colors group-hover:text-[color:var(--color-brand-500)]"
            />
          </Link>
        );
      })}
    </div>
  );
}

/** Lists every generated route inside a module as a card grid. */
export function ModuleHub({ module, titleKey, defaultTitle }: Props) {
  const { t } = useTranslation();
  return (
    <PageShell title={t(titleKey, { defaultValue: defaultTitle })}>
      <ModuleHubCards module={module} />
    </PageShell>
  );
}
