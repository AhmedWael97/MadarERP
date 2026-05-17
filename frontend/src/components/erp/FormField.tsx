import { ReactNode } from 'react';

// Mirrors the reference's per-field markup found across every create.blade.php:
//   <div>
//     <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">…</label>
//     <input … class="w-full px-3 py-2 text-sm rounded-xl border …">
//   </div>
//
// Use Tailwind `md:col-span-2` etc. via the `span` prop when a field needs to
// span more grid columns (e.g. textarea description fields).

interface FormFieldProps {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  span?: 1 | 2 | 3 | 'full';
  children: ReactNode;
}

const SPAN_CLASS: Record<NonNullable<FormFieldProps['span']>, string> = {
  1: '',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  full: 'col-span-full',
};

export function FormField({ label, required, hint, error, span = 1, children }: FormFieldProps) {
  return (
    <div className={SPAN_CLASS[span]}>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
        {label}{required ? ' *' : ''}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/**
 * Apply this className to <input>/<select>/<textarea> to match the reference
 * field style exactly. Keep it separate from <FormField> so callers can use
 * any input element (e.g. a Select2-style component or a date picker) and
 * still inherit the design.
 */
export const FIELD_INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]';

/**
 * Reference primary submit button — emerald gradient with check icon.
 *   <FormSubmit>{t('save')}</FormSubmit>
 */
export function FormSubmit({
  children,
  loading = false,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || rest.disabled}
      className={[
        'inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm disabled:opacity-60',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {children}
    </button>
  );
}

/** Reference secondary "cancel" / "back" button — slate. */
export function FormCancel({
  children,
  className = '',
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={[
        'px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </a>
  );
}

/** Reference info banner inside a form card — blue tinted background. */
export function FormInfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 mb-4">
      <p className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <span>{children}</span>
      </p>
    </div>
  );
}

/** Reference "back" pill used in page-header actions. Slate. */
export function FormBackButton({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <a
      href={to}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-500 transition-all shadow-sm"
    >
      {children}
    </a>
  );
}
