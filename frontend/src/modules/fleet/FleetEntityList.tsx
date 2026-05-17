/**
 * FleetEntityList — universal list for the 9 fleet doctypes:
 *   vehicles / drivers / trips / maintenance requests / accidents /
 *   violations / routes / fuel logs / contracts.
 *
 * All fleet lists share the same reference shape: page header + (optional
 * stats row) + filter bar + table + toolbar. Variant config picks the
 * doctype, columns to display, optional status badge map and date filter
 * field. This collapses ~9 hand-coded lists into one parametric file.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

export interface FleetEntityCfg {
  doctype: string;
  title: string;
  subtitle: string;
  basePath: string;
  newLabel: string;
  /** Searchable text field (often `name_ar` or the doctype's primary identifier). */
  searchField: string;
  /** Optional date field for the from/to filter. */
  dateField?: string;
  /** Columns to render in the table. */
  columns: Array<{
    fieldname: string;
    header: string;
    /** Status field — render as a colored badge using the badgeMap below. */
    isBadge?: boolean;
    numeric?: boolean;
    mono?: boolean;
    ltr?: boolean;
  }>;
  /** Maps doctype's `status` (or any field flagged isBadge) to Arabic label + tailwind class. */
  badgeMap?: Record<string, { label: string; cls: string }>;
}

export default function FleetEntityList({ cfg }: { cfg: FleetEntityCfg }) {
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

function Body({ cfg }: { cfg: FleetEntityCfg }) {
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (search.trim()) f.push([cfg.searchField, 'like', `%${search.trim()}%`]);
    if (cfg.dateField && from) f.push([cfg.dateField, '>=', from]);
    if (cfg.dateField && to) f.push([cfg.dateField, '<=', to]);
    return f as any;
  }, [search, from, to, cfg]);

  const fieldsToFetch = ['name', ...cfg.columns.map((c) => c.fieldname)];
  const { data: rows, isLoading } = useFrappeGetDocList<Record<string, unknown>>(cfg.doctype, {
    fields: fieldsToFetch,
    filters,
    limit: 100,
    orderBy: { field: 'modified', order: 'desc' },
  });

  const toolbarColumns: ToolbarColumn[] = useMemo(
    () => cfg.columns.map((c) => ({ id: c.fieldname, header: c.header })),
    [cfg],
  );
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(
    () => new Set(toolbarColumns.filter((c) => !hidden.has(c.id)).map((c) => c.id)),
    [toolbarColumns, hidden],
  );
  const hide = (id: string) => hidden.has(id);

  async function onDelete(name: string) {
    if (!confirm('حذف؟')) return;
    try {
      await deleteDoc(cfg.doctype, name);
      toast.success('تم');
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm"
            />
          </div>
          {cfg.dateField && (
            <>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
            </>
          )}
        </div>
      </div>

      <DataTableToolbar
        doctype={cfg.doctype}
        columns={toolbarColumns}
        rows={(rows ?? []) as Array<Record<string, unknown>>}
        visibleColumnIds={visibleIds}
        onVisibleColumnsChange={(next) => {
          const all = toolbarColumns.map((c) => c.id);
          setHidden(new Set(all.filter((id) => !next.has(id))));
        }}
      />

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {cfg.columns.filter((c) => !hide(c.fieldname)).map((c) => (
                  <th key={c.fieldname} className="px-5 py-3 text-start whitespace-nowrap">{c.header}</th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (
                <tr><td colSpan={cfg.columns.length + 1} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>
              )}
              {!isLoading && (rows ?? []).length === 0 && (
                <tr><td colSpan={cfg.columns.length + 1} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد سجلات</td></tr>
              )}
              {(rows ?? []).map((r) => (
                <tr key={String(r.name)} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  {cfg.columns.filter((c) => !hide(c.fieldname)).map((c) => {
                    const raw = r[c.fieldname];
                    const v = raw === null || raw === undefined ? '—' : String(raw);
                    if (c.isBadge && cfg.badgeMap) {
                      const badge = cfg.badgeMap[String(raw)] ?? { label: v, cls: 'bg-slate-100 text-slate-700' };
                      return (
                        <td key={c.fieldname} className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                        </td>
                      );
                    }
                    const cls = c.numeric ? 'text-sm font-mono' : c.mono ? 'text-sm font-mono' : 'text-sm';
                    const numericValue = c.numeric ? fmtNum(Number(raw ?? 0)) : v;
                    return (
                      <td key={c.fieldname} className={`px-5 py-3 ${cls}`} dir={c.ltr ? 'ltr' : undefined}>
                        {c.fieldname === 'name' ? (
                          <span className="font-mono font-semibold text-[color:var(--color-brand-600)]">{v}</span>
                        ) : (
                          c.numeric ? numericValue : v
                        )}
                      </td>
                    );
                  })}
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => navigate(`${cfg.basePath}/${encodeURIComponent(String(r.name))}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition" aria-label="edit"><Pencil size={16} /></button>
                      <button type="button" onClick={() => onDelete(String(r.name))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" aria-label="delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function fmtNum(n: number) {
  try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n); } catch { return String(n); }
}
