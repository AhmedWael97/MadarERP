import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  /** The raw error from Frappe — often a multi-line traceback. */
  error?: unknown;
  /** Optional retry callback (e.g., from useFrappe* `mutate`). */
  onRetry?: () => void;
}

/**
 * Friendly error card used by DataTable, TreeView, FormShell, ReportShell etc.
 *
 * Tries to extract the human-readable message from a Frappe error (`_server_messages`
 * is a JSON-of-JSON string; `exc` carries the Python traceback). Falls back to the
 * raw message string. The full traceback is kept in a collapsible `<details>` so
 * support can grab it when needed but users aren't drowned in Python stack traces.
 */
export function ErrorPanel({ title, error, onRetry }: Props) {
  const { t } = useTranslation();
  const { headline, detail, isMissingDoctype } = parseError(error);

  return (
    <div className="rounded-[var(--radius-card)] border border-[color:var(--color-rose-600)]/20 bg-[color:var(--color-rose-600)]/5 p-5 text-sm shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--color-rose-600)]/10 text-[color:var(--color-rose-600)]">
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[color:var(--color-rose-700)]">
            {title ?? (isMissingDoctype ? t('error.missing_doctype', { defaultValue: 'This module is not installed yet' }) : t('common.error'))}
          </div>
          {headline && (
            <div className="mt-1 break-words text-[color:var(--color-slate-700)]">{headline}</div>
          )}
          {isMissingDoctype && (
            <div className="mt-2 text-xs text-[color:var(--color-muted)]">
              {t('error.missing_doctype_hint', {
                defaultValue:
                  'Ask an administrator to install the corresponding Madaar app on this tenant site (e.g., `bench --site … install-app madaar_construction`).',
              })}
            </div>
          )}
          {detail && (
            <details className="mt-3 text-xs text-[color:var(--color-muted)]">
              <summary className="cursor-pointer select-none">
                {t('error.details', { defaultValue: 'Show technical details' })}
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-[color:var(--color-app-bg)] p-2 text-[11px] leading-relaxed">
                {detail}
              </pre>
            </details>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-slate-700)] hover:bg-[color:var(--color-app-bg)]"
            >
              <RefreshCw size={13} />
              {t('action.refresh')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface Parsed {
  headline: string;
  detail: string;
  isMissingDoctype: boolean;
}

/** Best-effort extraction of "what went wrong" from a Frappe / Axios error. */
function parseError(err: unknown): Parsed {
  if (!err) return { headline: '', detail: '', isMissingDoctype: false };

  const anyErr = err as Record<string, any>;
  const rawMessage =
    anyErr?.message ??
    anyErr?.response?.data?.message ??
    String(err);

  // Frappe wraps user-facing errors in _server_messages — a string containing a
  // JSON array of stringified-JSON objects (yes, doubly-nested).
  let serverMsg: string | null = null;
  const sm =
    anyErr?._server_messages ??
    anyErr?.response?.data?._server_messages;
  if (sm) {
    try {
      const arr = typeof sm === 'string' ? JSON.parse(sm) : sm;
      const msgs = (arr as any[]).map((s) =>
        typeof s === 'string' ? JSON.parse(s) : s,
      );
      serverMsg = msgs.map((m: any) => m?.message ?? '').filter(Boolean).join('\n');
    } catch {
      /* leave serverMsg null */
    }
  }

  const exc: string =
    anyErr?.exc ??
    anyErr?.response?.data?.exc ??
    '';

  const text = (serverMsg || rawMessage || '').toString();

  // "DoesNotExistError" / "is not installed" → friendly "module not installed" hint.
  const isMissingDoctype =
    /DoesNotExistError|does not exist|is not installed|DocType.+not found/i.test(
      text + ' ' + exc,
    );

  return {
    headline: text.slice(0, 400),
    detail: exc || text,
    isMissingDoctype,
  };
}
