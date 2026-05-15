import { useMemo, useState } from 'react';
import { useFrappeGetCall, useFrappeGetDocList } from 'frappe-react-sdk';
import { useTranslation } from 'react-i18next';
import { resolveColumns, translateHeader, MetaField } from './columnMapping';
import { ErrorPanel } from './ErrorPanel';

export interface ColumnDef {
  /** Field name on the DocType, or a synthetic id for computed columns. */
  id: string;
  /** i18n key for the header. Falls back to id. */
  headerKey?: string;
  /** Explicit header label (overrides headerKey). For generated pages this carries the scanned column text. */
  header?: string;
  /** Optional custom cell renderer. */
  render?: (row: Record<string, unknown>) => React.ReactNode;
  /** Numeric width hint (in px). */
  width?: number;
}

interface Props {
  doctype: string;
  /** Hint columns (typically from the page scan). The component resolves each header to a real field. */
  columns?: ColumnDef[];
  filters?: Array<[string, string, unknown]> | Record<string, unknown>;
  orderBy?: { field: string; order: 'asc' | 'desc' };
  pageSize?: number;
}

const FALLBACK_FIELDS = ['name', 'modified'];

function isSyntheticCol(id: string) {
  return id.startsWith('__') || /^col_\d+$/.test(id);
}

function formatCellValue(value: unknown, fieldtype?: string, locale = 'en'): React.ReactNode {
  if (value === null || value === undefined || value === '') return '—';
  if (fieldtype === 'Currency' || fieldtype === 'Float') {
    const n = Number(value);
    if (!Number.isNaN(n)) {
      return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        maximumFractionDigits: 2,
      }).format(n);
    }
  }
  if (fieldtype === 'Date' || fieldtype === 'Datetime') {
    try {
      const d = new Date(value as string);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US');
      }
    } catch {
      /* fall through */
    }
  }
  if (fieldtype === 'Check') {
    return value ? '✓' : '—';
  }
  return value as React.ReactNode;
}

export function DataTable({ doctype, columns: passedColumns, filters, orderBy, pageSize = 20 }: Props) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);

  // Always fetch DocType meta — we need it to (a) resolve scanned headers to real fields,
  // (b) format cells correctly by fieldtype, (c) fall back when no columns are passed.
  // Note: `getdoctype` returns { docs: [...] } at the top level (not wrapped in `message`).
  const { data: metaResp, isLoading: metaLoading } = useFrappeGetCall<{
    docs?: Array<{ fields: MetaField[] }>;
  }>('frappe.desk.form.load.getdoctype', { doctype }, `meta:${doctype}`);

  const metaFields: MetaField[] = useMemo(
    () => metaResp?.docs?.[0]?.fields ?? [],
    [metaResp],
  );

  // Build the effective columns. Three cases:
  //   - Caller passed columns with real (non-synthetic) ids → use as-is.
  //   - Caller passed columns with synthetic ids (col_0...) but real headers → resolve each.
  //   - No columns passed → use DocType's in_list_view fields.
  const columns = useMemo<ColumnDef[]>(() => {
    if (passedColumns && passedColumns.length > 0) {
      const allSynthetic = passedColumns.every((c) => isSyntheticCol(c.id));
      if (!allSynthetic) return passedColumns;

      // Resolve each scanned header against meta.
      const resolved = resolveColumns(
        passedColumns.map((c) => ({ header: c.header ?? c.id })),
        metaFields,
      );
      return resolved.map<ColumnDef>((r, i) => ({
        id: r.field ?? `__placeholder_${i}`,
        header: r.header,
      }));
    }
    // No columns passed: use the doctype's standard list view.
    const listFields = metaFields.filter(
      (f) => f.in_list_view && f.fieldname && !['Section Break', 'Column Break', 'Tab Break'].includes(f.fieldtype ?? ''),
    );
    if (listFields.length > 0) {
      return [
        { id: 'name', header: 'ID' },
        ...listFields.slice(0, 6).map<ColumnDef>((f) => ({
          id: f.fieldname,
          header: f.label || f.fieldname,
        })),
      ];
    }
    return FALLBACK_FIELDS.map<ColumnDef>((f) => ({ id: f, header: f }));
  }, [passedColumns, metaFields]);

  const fieldsToFetch = useMemo(() => {
    const set = new Set<string>(['name']);
    for (const c of columns) if (!isSyntheticCol(c.id)) set.add(c.id);
    return Array.from(set);
  }, [columns]);

  // Build a quick fieldname -> fieldtype map for cell rendering.
  const fieldTypeByName = useMemo(() => {
    const m: Record<string, string> = {};
    for (const f of metaFields) if (f.fieldname && f.fieldtype) m[f.fieldname] = f.fieldtype;
    return m;
  }, [metaFields]);

  const { data, isLoading, error } = useFrappeGetDocList<Record<string, unknown>>(doctype, {
    fields: fieldsToFetch,
    filters: filters as any,
    orderBy: orderBy ? { field: orderBy.field, order: orderBy.order } : { field: 'modified', order: 'desc' },
    limit: pageSize,
    limit_start: page * pageSize,
  });

  if (error) {
    return <ErrorPanel error={error} />;
  }

  const loading = isLoading || metaLoading;

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] shadow-[var(--shadow-card)]">
      <table className="w-full text-sm">
        <thead className="bg-app text-xs uppercase text-[color:var(--color-muted)]">
          <tr>
            {columns.map((c) => {
              const raw = c.header ?? (c.headerKey ? t(c.headerKey) : c.id);
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
          {!loading && data?.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-[color:var(--color-muted)]">
                {t('common.empty')}
              </td>
            </tr>
          )}
          {!loading &&
            data?.map((row, i) => (
              <tr
                key={(row.name as string) ?? i}
                className="border-t border-[color:var(--color-border)] hover:bg-app"
              >
                {columns.map((c) => {
                  let cell: React.ReactNode;
                  if (c.render) cell = c.render(row);
                  else if (isSyntheticCol(c.id)) {
                    cell = c.id === '__row_index' ? page * pageSize + i + 1 : '—';
                  } else {
                    cell = formatCellValue(row[c.id], fieldTypeByName[c.id], i18n.language);
                  }
                  return (
                    <td key={c.id} className="px-3 py-2 align-top">
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-muted)]">
        <span>{data?.length ?? 0}</span>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded px-2 py-1 hover:bg-app disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            «
          </button>
          <button
            type="button"
            className="rounded px-2 py-1 hover:bg-app disabled:opacity-40"
            disabled={(data?.length ?? 0) < pageSize}
            onClick={() => setPage((p) => p + 1)}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
