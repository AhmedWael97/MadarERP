/**
 * TreeOrTableList — hierarchical list with a Tree ↔ Table view toggle.
 *
 * Built for ERPNext tree DocTypes (Account, Cost Center, …) where the user
 * sometimes needs the parent/child hierarchy and other times prefers a flat
 * searchable list. Same column config drives both views.
 *
 * Tree mode walks the `parentField` Link to build a parent→children map,
 * indents the first column, and renders chevrons for expand/collapse.
 * Table mode is a flat sortable list with a search box.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, LayoutGrid, ListTree, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

export interface TreeOrTableCfg {
  doctype: string;
  title: string;
  subtitle: string;
  basePath: string;
  newLabel: string;
  /** Link field pointing back to the same doctype (e.g. `parent_account`). Required for tree mode. */
  parentField: string;
  /** Searchable text field used by the Table view. */
  searchField: string;
  /** Default view on first render. */
  defaultView?: 'tree' | 'table';
  columns: Array<{
    fieldname: string;
    header: string;
    isBadge?: boolean;
  }>;
  badgeMap?: Record<string, { label: string; cls: string }>;
  /**
   * When provided, the tree view's first cell renders these fields joined by
   * `separator` (default " — ") instead of just column[0].fieldname. Useful for
   * showing `{code} — {name}` inline on the hierarchy node.
   * Empty / null field values are filtered out before joining.
   */
  labelFields?: { fields: string[]; separator?: string };
}

interface TreeRow extends Record<string, unknown> {
  name: string;
  _depth: number;
  _hasChildren: boolean;
  _parent: string | null;
}

export default function TreeOrTableList({ cfg }: { cfg: TreeOrTableCfg }) {
  return (
    <RequirePerm doctype={cfg.doctype} action="read">
      <PageShell
        title={cfg.title}
        subtitle={cfg.subtitle}
        actions={
          <Link to={`${cfg.basePath}/create`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
            <Plus size={16} /> {cfg.newLabel}
          </Link>
        }
      >
        <Body cfg={cfg} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ cfg }: { cfg: TreeOrTableCfg }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [view, setView] = useState<'tree' | 'table'>(cfg.defaultView ?? 'tree');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // We always fetch the full list (filtered by search in table mode) so the
  // tree can build its parent map without paging surprises.
  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (view === 'table' && search.trim()) f.push([cfg.searchField, 'like', `%${search.trim()}%`]);
    return f as any;
  }, [view, search, cfg]);

  const fieldsToFetch = useMemo(() => {
    const set = new Set<string>(['name', cfg.parentField]);
    if (cfg.columns.find((c) => c.fieldname === 'is_group') === undefined) set.add('is_group');
    for (const c of cfg.columns) set.add(c.fieldname);
    if (cfg.labelFields) {
      for (const f of cfg.labelFields.fields) set.add(f);
    }
    return Array.from(set);
  }, [cfg]);

  const { data: rows, isLoading } = useFrappeGetDocList<Record<string, unknown>>(cfg.doctype, {
    fields: fieldsToFetch,
    filters,
    limit: view === 'tree' ? 5000 : 200,
    orderBy: view === 'tree' ? { field: 'lft', order: 'asc' } : { field: 'modified', order: 'desc' },
  });

  const { roots, childrenOf, depthOf } = useMemo(() => {
    const byName = new Map<string, TreeRow>();
    const children = new Map<string, TreeRow[]>();
    const roots: TreeRow[] = [];
    if (rows) {
      for (const r of rows) {
        const name = String(r.name);
        const parent = (r[cfg.parentField] as string) || null;
        byName.set(name, { ...r, name, _depth: 0, _hasChildren: false, _parent: parent });
      }
      for (const node of byName.values()) {
        if (node._parent && byName.has(node._parent)) {
          const list = children.get(node._parent) ?? [];
          list.push(node);
          children.set(node._parent, list);
          byName.get(node._parent)!._hasChildren = true;
        } else {
          roots.push(node);
        }
      }
      const setDepth = (n: TreeRow, d: number) => {
        n._depth = d;
        for (const c of children.get(n.name) ?? []) setDepth(c, d + 1);
      };
      for (const r of roots) setDepth(r, 0);
    }
    return { roots, childrenOf: children, depthOf: byName };
  }, [rows, cfg.parentField]);

  const visibleTreeRows = useMemo<TreeRow[]>(() => {
    const out: TreeRow[] = [];
    const walk = (n: TreeRow) => {
      out.push(n);
      if (!expanded.has(n.name)) return;
      for (const c of childrenOf.get(n.name) ?? []) walk(c);
    };
    for (const r of roots) walk(r);
    return out;
  }, [roots, childrenOf, expanded]);

  function toggleNode(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(Array.from(depthOf.keys())));
  }
  function collapseAll() {
    setExpanded(new Set());
  }

  async function onDelete(name: string) {
    if (!confirm(isAr ? 'حذف؟' : 'Delete?')) return;
    try {
      await deleteDoc(cfg.doctype, name);
      toast.success(isAr ? 'تم' : 'Done');
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  const visibleColumns = cfg.columns;
  const dataRows = view === 'tree' ? visibleTreeRows : (rows ?? []);

  return (
    <div className="space-y-6">
      {/* Toolbar — view toggle + (table-only) search + (tree-only) expand-all/collapse-all */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setView('tree')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'tree' ? 'bg-white dark:bg-slate-700 text-[color:var(--color-brand-600)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ListTree size={14} /> {isAr ? 'شجرة' : 'Tree'}
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'table' ? 'bg-white dark:bg-slate-700 text-[color:var(--color-brand-600)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={14} /> {isAr ? 'جدول' : 'Table'}
            </button>
          </div>

          {view === 'tree' && (
            <>
              <button type="button" onClick={expandAll} className="text-xs font-bold text-slate-500 hover:text-[color:var(--color-brand-600)] px-2 py-1.5">
                {isAr ? 'فتح الكل' : 'Expand all'}
              </button>
              <button type="button" onClick={collapseAll} className="text-xs font-bold text-slate-500 hover:text-[color:var(--color-brand-600)] px-2 py-1.5">
                {isAr ? 'طي الكل' : 'Collapse all'}
              </button>
            </>
          )}

          {view === 'table' && (
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'بحث...' : 'Search...'}
                className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {visibleColumns.map((c) => (
                  <th key={c.fieldname} className="px-5 py-3 text-start whitespace-nowrap">{c.header}</th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (
                <tr><td colSpan={visibleColumns.length + 1} className="px-5 py-12 text-center text-sm text-slate-400">{isAr ? 'جاري التحميل...' : 'Loading…'}</td></tr>
              )}
              {!isLoading && dataRows.length === 0 && (
                <tr><td colSpan={visibleColumns.length + 1} className="px-5 py-12 text-center text-sm text-slate-400">{isAr ? 'لا توجد سجلات' : 'No records'}</td></tr>
              )}
              {dataRows.map((r) => {
                const name = String(r.name);
                const depth = view === 'tree' ? Number((r as TreeRow)._depth ?? 0) : 0;
                const hasChildren = view === 'tree' && Boolean((r as TreeRow)._hasChildren);
                const isOpen = expanded.has(name);
                return (
                  <tr key={name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    {visibleColumns.map((c, idx) => {
                      const raw = r[c.fieldname];
                      const v = raw === null || raw === undefined || raw === '' ? '—' : String(raw);
                      let cell: React.ReactNode;
                      if (c.isBadge && cfg.badgeMap) {
                        const badge = cfg.badgeMap[String(raw)] ?? { label: v, cls: 'bg-slate-100 text-slate-700' };
                        cell = <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>;
                      } else if (c.fieldname === cfg.parentField && raw) {
                        cell = <span className="text-xs text-slate-500">{v}</span>;
                      } else {
                        cell = v;
                      }

                      // First column carries the indent + chevron in tree mode.
                      if (idx === 0 && view === 'tree') {
                        let treeLabel: React.ReactNode = cell;
                        if (cfg.labelFields) {
                          const sep = cfg.labelFields.separator ?? ' — ';
                          const parts = cfg.labelFields.fields
                            .map((f) => r[f])
                            .filter((v) => v !== null && v !== undefined && v !== '');
                          if (parts.length > 0) {
                            treeLabel = (
                              <span className="flex items-baseline gap-1">
                                {parts.map((part, pi) => (
                                  <span key={pi}>
                                    {pi === 0 ? (
                                      <span className="font-mono text-xs text-[color:var(--color-brand-600)] font-bold">
                                        {String(part)}
                                      </span>
                                    ) : (
                                      <span className="font-semibold">{String(part)}</span>
                                    )}
                                    {pi < parts.length - 1 && (
                                      <span className="text-slate-400 mx-0.5">{sep}</span>
                                    )}
                                  </span>
                                ))}
                              </span>
                            );
                          }
                        }
                        return (
                          <td key={c.fieldname} className="px-5 py-3">
                            <div className="flex items-center gap-1.5" style={{ paddingInlineStart: `${depth * 18}px` }}>
                              {hasChildren ? (
                                <button type="button" onClick={() => toggleNode(name)} className="p-0.5 text-slate-400 hover:text-[color:var(--color-brand-600)]">
                                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />}
                                </button>
                              ) : (
                                <span className="inline-block w-[18px]" />
                              )}
                              <span className={c.fieldname === 'name' ? 'font-mono font-semibold text-[color:var(--color-brand-600)]' : 'font-semibold'}>{treeLabel}</span>
                            </div>
                          </td>
                        );
                      }
                      return <td key={c.fieldname} className="px-5 py-3">{cell}</td>;
                    })}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => navigate(`${cfg.basePath}/${encodeURIComponent(name)}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition" aria-label="edit"><Pencil size={16} /></button>
                        <button type="button" onClick={() => onDelete(name)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" aria-label="delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
