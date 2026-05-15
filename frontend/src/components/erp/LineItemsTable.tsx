import { useMemo } from 'react';
import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import type { FieldDef } from './FormShell';

interface Props {
  /** Parent DocType — e.g. "Sales Invoice". */
  parentDoctype: string;
  /** The Table field on the parent. */
  parentField: FieldDef;
  /** Child DocType — from parentField.options. */
  childDoctype: string;
  /** Shared form instance (parent + all child tables share the same react-hook-form state). */
  form: UseFormReturn<any>;
  readOnly?: boolean;
}

const INTERNAL_FIELDS = new Set([
  'name', 'owner', 'creation', 'modified', 'modified_by',
  'docstatus', 'idx', 'parent', 'parentfield', 'parenttype',
  '_user_tags', '_comments', '_assign', '_liked_by',
]);

const NON_RENDERABLE_TYPES = new Set([
  'Section Break', 'Column Break', 'Tab Break', 'HTML', 'Heading',
  'Code', 'Markdown Editor', 'Image', 'Geolocation', 'Signature',
  'Read Only', 'Button', 'Fold',
]);

/**
 * Inline-editable child table — replaces the "child table not yet supported" placeholder
 * in FormShell. Uses `useFieldArray` so add/remove flows propagate cleanly through
 * react-hook-form into the final POST payload (Frappe accepts child rows on the parent
 * doc just as a nested array under the field name).
 */
export function LineItemsTable({ parentField, childDoctype, form, readOnly }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  const { fields: rows, append, remove } = useFieldArray({
    control: form.control,
    name: parentField.fieldname,
  });

  // Load child DocType meta. The frappe-react-sdk caches by SWR key so multiple tables
  // referencing the same child type only fetch once.
  const { data: metaResp, isLoading } = useFrappeGetCall<{
    docs?: Array<{ fields: FieldDef[] }>;
  }>('frappe.desk.form.load.getdoctype', { doctype: childDoctype }, `meta:${childDoctype}`);

  const childFields: FieldDef[] = metaResp?.docs?.[0]?.fields ?? [];

  // Choose which columns to show. Prefer fields flagged in_list_view; if none are
  // flagged (common for hand-rolled child doctypes) fall back to the first 6
  // rendered fields. INTERNAL_FIELDS + NON_RENDERABLE_TYPES + hidden are always excluded.
  const columns = useMemo<FieldDef[]>(() => {
    const renderable = childFields.filter(
      (f) =>
        !INTERNAL_FIELDS.has(f.fieldname) &&
        !NON_RENDERABLE_TYPES.has(f.fieldtype ?? '') &&
        !f.hidden &&
        f.fieldtype !== 'Table' &&
        f.fieldtype !== 'Table MultiSelect',
    );
    const flagged = renderable.filter((f) => f.in_list_view);
    return (flagged.length > 0 ? flagged : renderable.slice(0, 6));
  }, [childFields]);

  // Helper for the totals row — sums numeric columns the user would care about.
  const measureCols = columns.filter((c) =>
    ['Currency', 'Float', 'Int', 'Percent'].includes(c.fieldtype ?? ''),
  );

  function totalFor(col: FieldDef): number {
    const values = form.watch(parentField.fieldname) as Array<Record<string, unknown>> | undefined;
    if (!values) return 0;
    return values.reduce((acc, row) => acc + (Number(row?.[col.fieldname]) || 0), 0);
  }

  return (
    <div className="md:col-span-2">
      <div className="overflow-x-auto rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-[color:var(--color-card)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-app-bg)] text-xs uppercase text-[color:var(--color-muted)]">
            <tr>
              <th className="w-8 px-2 py-2 text-start font-medium">#</th>
              {columns.map((f) => (
                <th key={f.fieldname} className="px-2 py-2 text-start font-medium whitespace-nowrap">
                  {f.label || f.fieldname}
                  {f.reqd ? <em className="ms-1 not-italic text-[color:var(--color-rose-600)]">*</em> : null}
                </th>
              ))}
              {!readOnly && <th className="w-10 px-2 py-2" />}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-3 py-6 text-center text-[color:var(--color-muted)]"
                >
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-3 py-6 text-center text-[color:var(--color-muted)]"
                >
                  {t('common.empty')}
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row, idx) => (
                <tr key={row.id} className="border-t border-[color:var(--color-border)]">
                  <td className="px-2 py-1 align-middle text-xs text-[color:var(--color-muted)]">
                    {idx + 1}
                  </td>
                  {columns.map((f) => (
                    <td key={f.fieldname} className="px-2 py-1 align-middle">
                      <CellEditor
                        form={form}
                        path={`${parentField.fieldname}.${idx}.${f.fieldname}`}
                        field={f}
                        disabled={!!readOnly}
                      />
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="px-2 py-1 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="rounded p-1 text-[color:var(--color-muted)] hover:bg-[color:var(--color-rose-100)] hover:text-[color:var(--color-rose-600)]"
                        aria-label={t('action.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            {/* Totals row — sum every Currency/Float/Int/Percent column. */}
            {!isLoading && rows.length > 0 && measureCols.length > 0 && (
              <tr className="border-t-2 border-[color:var(--color-border)] bg-[color:var(--color-app-bg)] font-semibold">
                <td className="px-2 py-1.5 text-xs text-[color:var(--color-muted)]" />
                {columns.map((f, idx) => {
                  if (idx === 0) {
                    return (
                      <td key={f.fieldname} className="px-2 py-1.5 text-xs text-[color:var(--color-slate-700)]">
                        {t('common.total', { defaultValue: 'Total' })}
                      </td>
                    );
                  }
                  if (!measureCols.includes(f)) {
                    return <td key={f.fieldname} className="px-2 py-1.5" />;
                  }
                  return (
                    <td key={f.fieldname} className="px-2 py-1.5 text-sm text-[color:var(--color-slate-700)]">
                      {new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(totalFor(f))}
                    </td>
                  );
                })}
                {!readOnly && <td />}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => append({})}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-primary)] hover:bg-[color:var(--color-app-bg)]"
          >
            <Plus size={13} />
            {t('action.add_row', { defaultValue: 'Add row' })}
          </button>
        </div>
      )}
    </div>
  );
}

interface CellEditorProps {
  form: UseFormReturn<any>;
  path: string;
  field: FieldDef;
  disabled?: boolean;
}

/**
 * Inline cell editor for the child-table grid. Matches FormShell's FieldRow but
 * compact (no label, no description) and resilient to the smaller column width.
 */
function CellEditor({ form, path, field, disabled }: CellEditorProps) {
  const ft = field.fieldtype ?? 'Data';
  const baseClass =
    'w-full min-w-[6rem] rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-2 py-1 text-sm outline-none focus:ring-1 ring-primary disabled:opacity-60';

  const reg = form.register(path, {
    valueAsNumber: ft === 'Int' || ft === 'Float' || ft === 'Currency' || ft === 'Percent',
  });

  if (ft === 'Check') {
    return <input type="checkbox" {...reg} disabled={disabled} className="h-4 w-4" />;
  }
  if (ft === 'Date') return <input type="date" {...reg} disabled={disabled} className={baseClass} />;
  if (ft === 'Datetime') return <input type="datetime-local" {...reg} disabled={disabled} className={baseClass} />;
  if (ft === 'Time') return <input type="time" {...reg} disabled={disabled} className={baseClass} />;
  if (ft === 'Int' || ft === 'Float' || ft === 'Currency' || ft === 'Percent') {
    return (
      <input
        type="number"
        step={ft === 'Int' ? '1' : '0.01'}
        {...reg}
        disabled={disabled}
        className={`${baseClass} text-end`}
      />
    );
  }
  if (ft === 'Select') {
    const opts = (field.options ?? '').split('\n');
    return (
      <select {...reg} disabled={disabled} className={baseClass}>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o || '—'}
          </option>
        ))}
      </select>
    );
  }
  if (ft === 'Link') {
    return (
      <Controller
        control={form.control}
        name={path}
        render={({ field: ctrl }) => (
          <input
            type="text"
            value={String(ctrl.value ?? '')}
            onChange={(e) => ctrl.onChange(e.target.value)}
            placeholder={field.options ?? ''}
            disabled={disabled}
            className={baseClass}
          />
        )}
      />
    );
  }
  if (ft === 'Text' || ft === 'Small Text' || ft === 'Long Text') {
    return <textarea rows={1} {...reg} disabled={disabled} className={baseClass} />;
  }
  return <input type="text" {...reg} disabled={disabled} className={baseClass} />;
}
