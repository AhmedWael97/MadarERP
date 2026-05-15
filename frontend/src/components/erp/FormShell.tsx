import { useEffect, useMemo, useState } from 'react';
import { useForm, FieldValues, DefaultValues, Controller } from 'react-hook-form';
import {
  useFrappeCreateDoc,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from 'frappe-react-sdk';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Printer, Send, Undo2 } from 'lucide-react';
import { ErrorPanel } from './ErrorPanel';
import { LineItemsTable } from './LineItemsTable';

export interface FieldDef {
  fieldname: string;
  label?: string;
  fieldtype?: string;
  reqd?: 0 | 1;
  options?: string;
  default?: unknown;
  read_only?: 0 | 1;
  hidden?: 0 | 1;
  in_list_view?: 0 | 1;
  description?: string;
}

interface Props<T extends FieldValues> {
  doctype: string;
  /** When editing, the docname. When creating, omit. */
  name?: string;
  /** Hint fields (typically from the page scan). IGNORED — we always trust DocType meta. */
  fields?: FieldDef[];
  defaultValues?: DefaultValues<T>;
  onSuccess?: (doc: Record<string, unknown>) => void;
}

const HIDDEN_FIELD_TYPES = new Set([
  'Section Break',
  'Column Break',
  'Tab Break',
  'HTML',
  'Heading',
  'Code',
  'Markdown Editor',
  'Image',
  'Geolocation',
  'Signature',
  'Read Only',
]);

// Internal/audit fields Frappe manages itself.
const INTERNAL_FIELDS = new Set([
  'name',
  'owner',
  'creation',
  'modified',
  'modified_by',
  'docstatus',
  'idx',
  'parent',
  'parentfield',
  'parenttype',
  '_user_tags',
  '_comments',
  '_assign',
  '_liked_by',
]);

export function FormShell<T extends FieldValues = FieldValues>({
  doctype,
  name,
  defaultValues,
  onSuccess,
}: Props<T>) {
  const { t } = useTranslation();
  const isEdit = Boolean(name);

  // Always fetch DocType meta — the scan's field hints are unreliable.
  const { data: metaResp, isLoading: metaLoading } = useFrappeGetCall<{
    docs?: Array<{
      fields: FieldDef[];
      istable?: 0 | 1;
      autoname?: string;
      is_submittable?: 0 | 1;
    }>;
  }>('frappe.desk.form.load.getdoctype', { doctype }, `meta:${doctype}`);

  // When editing, also fetch the current doc to pre-fill the form.
  const { data: existingDoc, mutate: refreshDoc } = useFrappeGetDoc<Record<string, unknown>>(
    doctype,
    name as string,
    isEdit ? `doc:${doctype}:${name}` : null,
  );

  const allFields: FieldDef[] = metaResp?.docs?.[0]?.fields ?? [];
  const isSubmittable = Number(metaResp?.docs?.[0]?.is_submittable ?? 0) === 1;
  const docstatus = Number((existingDoc?.docstatus as number | undefined) ?? 0);
  // 0 = Draft, 1 = Submitted, 2 = Cancelled
  const isSubmitted = docstatus === 1;
  const isCancelled = docstatus === 2;
  // Once submitted, header fields lock down. Cancelled docs are read-only too.
  const formReadOnly = isSubmitted || isCancelled;

  // Group fields into sections for readability.
  const sections = useMemo(() => groupBySection(allFields), [allFields]);

  // Initial form values: scan defaults + meta defaults, overridden by existing doc when editing.
  const initialValues = useMemo(() => {
    const v: Record<string, unknown> = { ...(defaultValues ?? {}) };
    for (const f of allFields) {
      if (f.default !== undefined && f.default !== '' && v[f.fieldname] === undefined) {
        v[f.fieldname] = f.default;
      }
    }
    if (existingDoc) {
      for (const k of Object.keys(existingDoc)) v[k] = existingDoc[k];
    }
    return v as DefaultValues<T>;
  }, [allFields, defaultValues, existingDoc]);

  const form = useForm<T>({ defaultValues: initialValues });
  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues]);

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const { call: submitCall, loading: submitting } = useFrappePostCall<{ message: unknown }>(
    'frappe.client.submit',
  );
  const { call: cancelCall, loading: cancelling } = useFrappePostCall<{ message: unknown }>(
    'frappe.client.cancel',
  );
  const saving = creating || updating;
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(values: T) {
    setSubmitError(null);
    try {
      // Strip empty optional fields so Frappe doesn't complain about empty strings on Link fields.
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v === '' || v === null || v === undefined) continue;
        cleaned[k] = v;
      }

      const doc = isEdit
        ? await updateDoc(doctype, name!, cleaned)
        : await createDoc(doctype, cleaned);
      toast.success(t('action.save'));
      onSuccess?.(doc as Record<string, unknown>);
    } catch (e: any) {
      const msg = extractFrappeError(e) ?? e?.message ?? t('common.error');
      setSubmitError(msg);
      toast.error(msg);
    }
  }

  /**
   * Submit a saved draft to docstatus=1. Frappe's `frappe.client.submit` accepts the
   * full doc dict, runs validate + before_submit + on_submit, and posts GL entries
   * (for transactional doctypes). We pass the current form values merged with the
   * existing doc to make sure the latest edits are persisted in the submit call.
   */
  async function handleSubmitDoc() {
    if (!isEdit || !name) return;
    setSubmitError(null);
    try {
      const values = form.getValues() as Record<string, unknown>;
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v === '' || v === null || v === undefined) continue;
        cleaned[k] = v;
      }
      // Persist edits first (no-op if nothing changed).
      await updateDoc(doctype, name, cleaned);
      // Then submit the saved doc. Pass the full doc dict — Frappe expects it.
      const fullDoc = { ...(existingDoc ?? {}), ...cleaned, doctype, name };
      await submitCall({ doc: fullDoc });
      toast.success(t('action.submit', { defaultValue: 'Submitted' }));
      void refreshDoc();
    } catch (e: any) {
      const msg = extractFrappeError(e) ?? e?.message ?? t('common.error');
      setSubmitError(msg);
      toast.error(msg);
    }
  }

  /** Cancel a submitted doc (docstatus 1 → 2). Reverses GL entries for transactional types. */
  async function handleCancelDoc() {
    if (!isEdit || !name) return;
    setSubmitError(null);
    try {
      await cancelCall({ doctype, name });
      toast.success(t('action.cancel_doc', { defaultValue: 'Cancelled' }));
      void refreshDoc();
    } catch (e: any) {
      const msg = extractFrappeError(e) ?? e?.message ?? t('common.error');
      setSubmitError(msg);
      toast.error(msg);
    }
  }

  /**
   * Open the print PDF in a new tab. Uses Frappe's standard `download_pdf` endpoint —
   * format defaults to "Standard" and lang follows the current locale, so Arabic-formatted
   * print formats render correctly.
   */
  function handlePrint() {
    if (!isEdit || !name) return;
    const params = new URLSearchParams({
      doctype,
      name,
      format: 'Standard',
      no_letterhead: '0',
      lang: i18nLang(),
    });
    const url = `/api/method/frappe.utils.print_format.download_pdf?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function i18nLang() {
    try {
      return (typeof document !== 'undefined' && document.documentElement.lang) || 'en';
    } catch {
      return 'en';
    }
  }

  if (metaLoading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 text-center text-sm text-[color:var(--color-muted)] shadow-[var(--shadow-card)]">
        {t('common.loading')}
      </div>
    );
  }

  if (allFields.length === 0) {
    return (
      <ErrorPanel
        // The meta call succeeded but returned no fields → either the DocType
        // doesn't exist on this site, or the user lacks read permission. Surface
        // both possibilities via the missing-DocType hint logic in ErrorPanel.
        error={{ message: `DocType "${doctype}" returned no field metadata. It may not be installed on this site, or you may lack read permission.`, exc: 'DoesNotExistError' }}
      />
    );
  }

  // Status badge — visible right of the title when the doc has been submitted/cancelled.
  // Driven by the same `docstatus` we use to decide button visibility.
  const statusBadge = (() => {
    if (!isEdit) return null;
    if (isCancelled) {
      return (
        <span className="rounded-full bg-[color:var(--color-rose-100)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-rose-700)]">
          {t('docstatus.cancelled', { defaultValue: 'Cancelled' })}
        </span>
      );
    }
    if (isSubmitted) {
      return (
        <span className="rounded-full bg-[color:var(--color-emerald-100)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-emerald-700)]">
          {t('docstatus.submitted', { defaultValue: 'Submitted' })}
        </span>
      );
    }
    return (
      <span className="rounded-full bg-[color:var(--color-amber-100)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-amber-700)]">
        {t('docstatus.draft', { defaultValue: 'Draft' })}
      </span>
    );
  })();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Doc header row — shown only when editing an existing doc. Carries the
          submission status badge so the user can see at a glance whether the
          form is editable. */}
      {isEdit && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-5 py-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[color:var(--color-muted)]">{doctype}</span>
            <span className="font-semibold">{name}</span>
            {statusBadge}
          </div>
        </div>
      )}

      {sections.map((section, sIdx) => (
        <fieldset
          key={sIdx}
          className="rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5 shadow-[var(--shadow-card)]"
          disabled={formReadOnly}
        >
          {section.label && (
            <legend className="px-2 text-xs font-semibold uppercase text-[color:var(--color-muted)]">
              {section.label}
            </legend>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {section.fields.map((f) => (
              <FieldRow
                key={f.fieldname}
                field={f}
                form={form}
                doctype={doctype}
                readOnly={formReadOnly}
              />
            ))}
          </div>
        </fieldset>
      ))}

      {submitError && (
        <div className="rounded-[var(--radius-card)] border border-[color:var(--color-rose-600)]/20 bg-[color:var(--color-rose-600)]/10 px-4 py-3 text-sm text-[color:var(--color-rose-600)]">
          {submitError}
        </div>
      )}

      {/* Action bar — Save / Submit / Cancel / Print, gated by docstatus + is_submittable.
          Always shown so users have one consistent place to act on the doc. */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* Print is available as soon as the doc has a name (i.e. has been saved at least once). */}
        {isEdit && (
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-2 text-sm font-medium text-[color:var(--color-slate-700)] hover:bg-[color:var(--color-app-bg)]"
            title={t('action.print')}
          >
            <Printer size={15} />
            {t('action.print')}
          </button>
        )}

        {/* Cancel-doc (docstatus 1 → 2) — submittable, currently submitted. */}
        {isEdit && isSubmittable && isSubmitted && (
          <button
            type="button"
            onClick={handleCancelDoc}
            disabled={cancelling}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[color:var(--color-rose-600)]/30 bg-[color:var(--color-rose-100)] px-4 py-2 text-sm font-medium text-[color:var(--color-rose-700)] hover:bg-[color:var(--color-rose-200)] disabled:opacity-60"
          >
            <Undo2 size={15} />
            {cancelling ? t('common.loading') : t('action.cancel_doc', { defaultValue: 'Cancel' })}
          </button>
        )}

        {/* Reset — only available while the form is editable. */}
        {!formReadOnly && (
          <button
            type="button"
            onClick={() => form.reset(initialValues)}
            className="rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-app px-4 py-2 text-sm font-medium hover:bg-[color:var(--color-card)]"
          >
            {t('action.reset', { defaultValue: 'Reset' })}
          </button>
        )}

        {/* Save — always available unless the doc is read-only (submitted/cancelled). */}
        {!formReadOnly && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-[var(--radius-input)] bg-[color:var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? t('common.loading') : t('action.save')}
          </button>
        )}

        {/* Submit — submittable doctype + doc exists + still a draft. */}
        {isEdit && isSubmittable && !isSubmitted && !isCancelled && (
          <button
            type="button"
            onClick={handleSubmitDoc}
            disabled={submitting || saving}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] bg-[color:var(--color-emerald-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--color-emerald-700)] disabled:opacity-60"
          >
            <Send size={15} />
            {submitting ? t('common.loading') : t('action.submit', { defaultValue: 'Submit' })}
          </button>
        )}
      </div>
    </form>
  );
}

interface FieldRowProps {
  field: FieldDef;
  form: ReturnType<typeof useForm<any>>;
  doctype: string;
  /** When true, every editor is disabled — used for submitted/cancelled docs. */
  readOnly?: boolean;
}

function FieldRow({ field, form, doctype, readOnly: parentReadOnly }: FieldRowProps) {
  const { t } = useTranslation();
  const ft = field.fieldtype ?? 'Data';

  if (field.hidden) return null;
  if (HIDDEN_FIELD_TYPES.has(ft)) return null;
  if (INTERNAL_FIELDS.has(field.fieldname)) return null;
  if (ft === 'Table' || ft === 'Table MultiSelect') {
    // Child tables. The `options` carries the child DocType name (e.g.
    // "Sales Invoice Item"). LineItemsTable fetches that meta and renders an
    // inline editable grid backed by the same react-hook-form instance.
    if (!field.options) {
      return (
        <div className="md:col-span-2 rounded-[var(--radius-input)] border border-dashed border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-muted)]">
          {field.label || field.fieldname}: missing child DocType options
        </div>
      );
    }
    return (
      <LineItemsTable
        parentDoctype={doctype}
        parentField={field}
        childDoctype={field.options}
        form={form}
        readOnly={parentReadOnly}
      />
    );
  }

  const reqd = !!field.reqd;
  const readOnly = !!field.read_only || !!parentReadOnly;
  const isLong = ft === 'Text' || ft === 'Small Text' || ft === 'Long Text' || ft === 'Text Editor';
  const span = isLong ? 'md:col-span-2 block' : 'block';
  const labelText = field.label || field.fieldname;
  const placeholder = field.description ?? '';
  const err = (form.formState.errors as Record<string, { message?: string }>)[field.fieldname]?.message;

  const commonProps = {
    className:
      'w-full rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-app px-3 py-2 text-sm outline-none focus:ring-2 ring-primary disabled:opacity-60',
    disabled: readOnly,
    placeholder,
  };

  return (
    <label className={span}>
      <span className="mb-1 inline-block text-xs font-medium text-[color:var(--color-muted)]">
        {labelText}
        {reqd && <em className="ms-1 not-italic text-[color:var(--color-rose-600)]">*</em>}
      </span>

      {(() => {
        const reg = form.register(field.fieldname, {
          required: reqd ? t('common.required') : false,
          valueAsNumber: ft === 'Int' || ft === 'Float' || ft === 'Currency' || ft === 'Percent',
        });

        if (ft === 'Check') {
          return <input type="checkbox" {...reg} className="h-4 w-4" disabled={readOnly} />;
        }
        if (ft === 'Text' || ft === 'Small Text' || ft === 'Long Text' || ft === 'Text Editor') {
          return <textarea rows={3} {...commonProps} {...reg} />;
        }
        if (ft === 'Select') {
          const opts = (field.options ?? '').split('\n').filter((o) => o !== undefined);
          return (
            <select {...commonProps} {...reg}>
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
              name={field.fieldname}
              control={form.control}
              rules={{ required: reqd ? t('common.required') : false }}
              render={({ field: ctrl }) => (
                <LinkPicker
                  doctype={field.options ?? ''}
                  value={(ctrl.value as string) ?? ''}
                  onChange={ctrl.onChange}
                  placeholder={placeholder}
                  disabled={readOnly}
                />
              )}
            />
          );
        }
        if (ft === 'Date') {
          return <input type="date" {...commonProps} {...reg} />;
        }
        if (ft === 'Datetime') {
          return <input type="datetime-local" {...commonProps} {...reg} />;
        }
        if (ft === 'Time') {
          return <input type="time" {...commonProps} {...reg} />;
        }
        if (ft === 'Password') {
          return <input type="password" {...commonProps} {...reg} />;
        }
        if (ft === 'Int' || ft === 'Float' || ft === 'Currency' || ft === 'Percent') {
          const step = ft === 'Int' ? '1' : '0.01';
          return <input type="number" step={step} {...commonProps} {...reg} />;
        }
        return <input type="text" {...commonProps} {...reg} />;
      })()}

      {field.description && !err && (
        <span className="mt-1 block text-xs text-[color:var(--color-muted)]">{field.description}</span>
      )}
      {err && <span className="mt-1 block text-xs text-[color:var(--color-rose-600)]">{err}</span>}
    </label>
  );
}

// --- helpers --------------------------------------------------------------

interface Section {
  label: string | null;
  fields: FieldDef[];
}

function groupBySection(fields: FieldDef[]): Section[] {
  const sections: Section[] = [{ label: null, fields: [] }];
  for (const f of fields) {
    if (f.fieldtype === 'Section Break') {
      sections.push({ label: f.label || null, fields: [] });
      continue;
    }
    sections[sections.length - 1].fields.push(f);
  }
  // Drop empty sections.
  return sections.filter((s) => s.fields.length > 0);
}

function extractFrappeError(err: any): string | null {
  const sm = err?._server_messages ?? err?.response?.data?._server_messages;
  if (!sm) return null;
  try {
    const arr = typeof sm === 'string' ? JSON.parse(sm) : sm;
    const msgs = arr.map((s: any) => (typeof s === 'string' ? JSON.parse(s) : s));
    return msgs.map((m: any) => m.message ?? '').filter(Boolean).join('\n') || null;
  } catch {
    return null;
  }
}

// --- LinkPicker: a Frappe-link-aware searchable input -----------------------

interface LinkPickerProps {
  doctype: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function LinkPicker({ doctype, value, onChange, placeholder, disabled }: LinkPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const swrKey = open && doctype ? `linksearch:${doctype}:${query}` : null;

  const { data } = useFrappeGetCall<{ message?: Array<{ value: string; description?: string }> }>(
    'frappe.client.get_list',
    {
      doctype,
      filters: query
        ? JSON.stringify([['name', 'like', `%${query}%`]])
        : '[]',
      fields: '["name"]',
      limit_page_length: 10,
    },
    swrKey,
  );

  const results: Array<{ name: string }> = (data?.message ?? []) as any;

  return (
    <div className="relative">
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled || !doctype}
        placeholder={placeholder ?? doctype}
        className="w-full rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-app px-3 py-2 text-sm outline-none focus:ring-2 ring-primary disabled:opacity-60"
      />
      {open && doctype && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] shadow-[var(--shadow-elev)]">
          {results.map((r) => (
            <li
              key={r.name}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-app"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(r.name);
                setOpen(false);
              }}
            >
              {r.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
