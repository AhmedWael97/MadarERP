import { useMemo, useState } from 'react';
import { useFrappeGetCall, useFrappeGetDocList } from 'frappe-react-sdk';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ColumnDef } from './DataTable';
import { resolveColumns, translateHeader, type MetaField } from './columnMapping';
import { ErrorPanel } from './ErrorPanel';

interface Props {
  doctype: string;
  columns?: ColumnDef[];
  /** Maximum rows fetched in one shot. Frappe tree DocTypes are typically < 5k. */
  pageSize?: number;
}

interface TreeRow extends Record<string, unknown> {
  name: string;
  __depth: number;
  __hasChildren: boolean;
  __isGroup: boolean;
  __parent: string | null;
}

/** Discover the parent Link field of a tree DocType. By Frappe convention it is
 * named `parent_<doctype_in_snake_case>` and points back to the same DocType. */
function findParentField(metaFields: MetaField[], doctype: string): string | null {
  const conventional = `parent_${doctype.toLowerCase().replace(/\s+/g, '_')}`;
  if (metaFields.some((f) => f.fieldname === conventional)) return conventional;
  // Fall back to any Link-to-self field that starts with `parent_`.
  const linkSelf = metaFields.find(
    (f) => (f.fieldtype === 'Link') && f.fieldname.startsWith('parent_'),
  );
  return linkSelf?.fieldname ?? null;
}

/** Choose a "name" label field — what we display for each row. Prefer the
 * doctype's own `*_name` field if present, otherwise fall back to `name`. */
function findLabelField(metaFields: MetaField[], doctype: string): string {
  const conventional = `${doctype.toLowerCase().replace(/\s+/g, '_')}_name`;
  if (metaFields.some((f) => f.fieldname === conventional)) return conventional;
  return 'name';
}

/** Visual chip used in the reference for `root_type` / category labels. */
function CategoryChip({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value);
  // Static class lookups keep Tailwind purge happy; fallback variant is slate.
  const VARIANTS: Record<string, string> = {
    Asset:
      'bg-[color:var(--color-violet-50)] text-[color:var(--color-violet-700)] border-[color:var(--color-violet-200)]',
    Liability:
      'bg-[color:var(--color-rose-100)] text-[color:var(--color-rose-700)] border-[color:var(--color-rose-200)]',
    Equity:
      'bg-[color:var(--color-amber-100)] text-[color:var(--color-amber-700)] border-[color:var(--color-amber-300)]',
    Income:
      'bg-[color:var(--color-emerald-100)] text-[color:var(--color-emerald-700)] border-[color:var(--color-emerald-200)]',
    Expense:
      'bg-[color:var(--color-orange-100)] text-[color:var(--color-orange-600)] border-[color:var(--color-orange-200)]',
  };
  const cls =
    VARIANTS[text] ??
    'bg-[color:var(--color-slate-100)] text-[color:var(--color-slate-700)] border-[color:var(--color-slate-200)]';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {text}
    </span>
  );
}

export function TreeView({ doctype, columns: passedColumns, pageSize = 500 }: Props) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Load DocType meta so we can resolve scanned column headers and pick parent/name fields.
  const { data: metaResp, isLoading: metaLoading } = useFrappeGetCall<{
    docs?: Array<{ fields: MetaField[] }>;
  }>('frappe.desk.form.load.getdoctype', { doctype }, `meta:${doctype}`);
  const metaFields: MetaField[] = useMemo(() => metaResp?.docs?.[0]?.fields ?? [], [metaResp]);

  const parentField = useMemo(() => findParentField(metaFields, doctype), [metaFields, doctype]);
  const labelField = useMemo(() => findLabelField(metaFields, doctype), [metaFields, doctype]);

  // Resolve scanned column headers (الكود / النوع / التصنيف / الرصيد …) to real field names.
  const columns = useMemo<ColumnDef[]>(() => {
    let cols: ColumnDef[];
    if (passedColumns && passedColumns.length > 0) {
      const allSynthetic = passedColumns.every((c) => c.id.startsWith('col_'));
      if (!allSynthetic) {
        cols = passedColumns;
      } else {
        const resolved = resolveColumns(
          passedColumns.map((c) => ({ header: c.header ?? c.id })),
          metaFields,
        );
        cols = resolved.map<ColumnDef>((r, i) => ({
          id: r.field ?? `__placeholder_${i}`,
          header: r.header,
        }));
      }
    } else if (labelField === 'name') {
      // DocTypes like Warehouse have no `<doctype>_name` field, so the label
      // field falls back to `name`. Emit a single column instead of two
      // identical-id columns — otherwise React sees duplicate keys in <tr>.
      cols = [{ id: 'name', header: 'Name' }];
    } else {
      cols = [{ id: 'name', header: 'ID' }, { id: labelField, header: 'Name' }];
    }
    // Belt-and-braces: dedupe by id (passedColumns can repeat too in edge cases).
    const seen = new Set<string>();
    return cols.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [passedColumns, metaFields, labelField]);

  // Fields we ask Frappe to return: every resolvable column + the parent link + is_group + lft.
  const fieldsToFetch = useMemo(() => {
    const set = new Set<string>(['name', labelField]);
    if (parentField) set.add(parentField);
    if (metaFields.some((f) => f.fieldname === 'is_group')) set.add('is_group');
    if (metaFields.some((f) => f.fieldname === 'lft')) set.add('lft');
    for (const c of columns) if (!c.id.startsWith('__')) set.add(c.id);
    return Array.from(set);
  }, [columns, labelField, parentField, metaFields]);

  const { data: rows, isLoading: rowsLoading, error } = useFrappeGetDocList<Record<string, unknown>>(
    doctype,
    {
      fields: fieldsToFetch,
      filters: [] as any,
      orderBy: metaFields.some((f) => f.fieldname === 'lft')
        ? { field: 'lft', order: 'asc' }
        : { field: 'name', order: 'asc' },
      limit: pageSize,
    },
  );

  // Build the tree (parent → children map) from the flat list.
  const tree = useMemo<{ roots: TreeRow[]; childrenOf: Map<string, TreeRow[]> }>(() => {
    if (!rows) return { roots: [], childrenOf: new Map() };
    const byName = new Map<string, TreeRow>();
    const childrenOf = new Map<string, TreeRow[]>();
    const roots: TreeRow[] = [];

    for (const r of rows) {
      const name = String(r.name);
      const parent = parentField ? ((r[parentField] as string) || null) : null;
      const isGroup = Number(r.is_group ?? 0) === 1;
      byName.set(name, {
        ...r,
        name,
        __depth: 0,
        __hasChildren: false,
        __isGroup: isGroup,
        __parent: parent || null,
      });
    }

    for (const node of byName.values()) {
      if (node.__parent && byName.has(node.__parent)) {
        const list = childrenOf.get(node.__parent) ?? [];
        list.push(node);
        childrenOf.set(node.__parent, list);
        byName.get(node.__parent)!.__hasChildren = true;
      } else {
        roots.push(node);
      }
    }

    // Assign depth via BFS so the table can indent.
    const assign = (node: TreeRow, depth: number) => {
      node.__depth = depth;
      for (const c of childrenOf.get(node.name) ?? []) assign(c, depth + 1);
    };
    for (const r of roots) assign(r, 0);

    return { roots, childrenOf };
  }, [rows, parentField]);

  // Flatten the tree to a visible row list according to `expanded`.
  const visible = useMemo<TreeRow[]>(() => {
    const out: TreeRow[] = [];
    const walk = (node: TreeRow) => {
      out.push(node);
      if (!expanded.has(node.name)) return;
      for (const c of tree.childrenOf.get(node.name) ?? []) walk(c);
    };
    for (const r of tree.roots) walk(r);
    return out;
  }, [tree, expanded]);

  function toggle(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (error) {
    return <ErrorPanel error={error} />;
  }

  const loading = rowsLoading || metaLoading;
  const isRTL = i18n.dir() === 'rtl';
  const Chevron = isRTL ? ChevronRight : ChevronRight; // chevron orientation handled by rotation classes

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] shadow-[var(--shadow-card)]">
      <table className="w-full text-sm">
        <thead className="bg-app text-xs uppercase text-[color:var(--color-muted)]">
          <tr>
            {columns.map((c) => {
              const raw = c.header ?? c.id;
              const display = translateHeader(raw, i18n.language);
              return (
                <th
                  key={c.id}
                  className="px-3 py-2 text-start font-medium"
                  style={c.width ? { width: c.width } : undefined}
                >
                  {display}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-[color:var(--color-muted)]">
                {t('common.loading')}
              </td>
            </tr>
          )}
          {!loading && visible.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-[color:var(--color-muted)]">
                {t('common.empty')}
              </td>
            </tr>
          )}
          {!loading &&
            visible.map((row) => (
              <tr key={row.name} className="border-t border-[color:var(--color-border)] hover:bg-app">
                {columns.map((c, idx) => {
                  // First column gets the chevron + indentation.
                  const isFirst = idx === 0;
                  // Synthetic columns we know about:
                  //   __level  → row depth+1
                  //   __actions → reserved blank for now
                  let cell: React.ReactNode;
                  if (c.id === '__level') cell = row.__depth + 1;
                  else if (c.id.startsWith('__')) cell = '—';
                  else if (c.id === 'root_type' || c.id === 'account_type')
                    cell = <CategoryChip value={row[c.id]} />;
                  else cell = (row[c.id] as React.ReactNode) ?? '—';

                  if (!isFirst) {
                    return (
                      <td key={c.id} className="px-3 py-2 align-middle">
                        {cell}
                      </td>
                    );
                  }
                  return (
                    <td key={c.id} className="px-3 py-2 align-middle">
                      <div
                        className="flex items-center gap-1.5"
                        style={{ paddingInlineStart: `${row.__depth * 16}px` }}
                      >
                        {row.__hasChildren ? (
                          <button
                            type="button"
                            aria-label="toggle"
                            onClick={() => toggle(row.name)}
                            className="grid h-5 w-5 place-items-center rounded text-[color:var(--color-muted)] hover:bg-[color:var(--color-app-bg)]"
                          >
                            {expanded.has(row.name) ? (
                              <ChevronDown size={14} />
                            ) : (
                              <Chevron size={14} className={isRTL ? 'rotate-180' : ''} />
                            )}
                          </button>
                        ) : (
                          <span className="inline-block h-5 w-5" />
                        )}
                        <span className={row.__isGroup ? 'font-semibold' : ''}>{String(cell ?? '—')}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>
      <div className="border-t border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-muted)]">
        {visible.length} / {rows?.length ?? 0}
      </div>
    </div>
  );
}
