/**
 * ImportDialog — modal that uploads a CSV and creates one Frappe doc per row.
 *
 * Expected CSV shape (matches the template the toolbar emits):
 *   header_label_1,header_label_2,header_label_3       ← first row: human labels (display only)
 *   fieldname_1,fieldname_2,fieldname_3                ← second row: Frappe fieldnames
 *   value,value,value                                   ← third row onwards: data
 *
 * The fieldname row is what makes auto-mapping work — users can rename headers
 * freely as long as that fieldname row stays intact.
 *
 * Insert strategy: one `frappe.client.insert` call per row (sequential to keep
 * the error report deterministic). For huge imports (>500 rows) the user will
 * want Frappe's native Data Import doctype instead — link surfaced in the
 * dialog footer.
 */
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFrappeCreateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, FileUp, X } from 'lucide-react';
import type { ToolbarColumn } from './DataTableToolbar';

interface Props {
  doctype: string;
  open: boolean;
  onClose: () => void;
  columns: ToolbarColumn[];
}

type ImportStatus = 'idle' | 'parsing' | 'importing' | 'done';

interface RowResult {
  row: number;
  ok: boolean;
  error?: string;
}

export function ImportDialog({ doctype, open, onClose, columns }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [results, setResults] = useState<RowResult[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const { createDoc } = useFrappeCreateDoc();

  function reset() {
    setStatus('idle');
    setResults([]);
    setProgress({ done: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('parsing');
    setResults([]);
    const text = await file.text();

    let rows: string[][];
    try {
      rows = parseCsv(stripBom(text));
    } catch (err: any) {
      toast.error(t('import.parseFailed', { defaultValue: 'تعذر قراءة الملف' }));
      setStatus('idle');
      return;
    }
    if (rows.length < 2) {
      toast.error(t('import.empty', { defaultValue: 'الملف فارغ أو ينقصه عمود البيانات' }));
      setStatus('idle');
      return;
    }

    // Auto-detect the fieldname row. Two supported shapes:
    //   1. header + fieldname + data rows  → fieldnames live at row 1
    //   2. fieldname + data rows           → fieldnames live at row 0
    // We pick row 1 when its tokens match the column field ids we know about;
    // otherwise fall back to row 0.
    const known = new Set(columns.map((c) => c.id));
    const row0 = rows[0].map((s) => s.trim());
    const row1 = rows[1].map((s) => s.trim());
    const row1MatchScore = row1.filter((s) => known.has(s)).length;
    const row0MatchScore = row0.filter((s) => known.has(s)).length;
    const usesTemplateLayout = row1MatchScore >= row0MatchScore && row1MatchScore > 0;
    const fieldnames = usesTemplateLayout ? row1 : row0;
    const dataRows = rows.slice(usesTemplateLayout ? 2 : 1).filter((r) => r.some((c) => c !== ''));

    if (fieldnames.every((f) => !known.has(f))) {
      // No overlap at all — caller probably uploaded a totally unrelated file.
      toast.error(
        t('import.noMappableColumns', {
          defaultValue: 'لا يوجد أعمدة قابلة للاستيراد. حمل القالب أولاً.',
        }),
      );
      setStatus('idle');
      return;
    }

    setStatus('importing');
    setProgress({ done: 0, total: dataRows.length });
    const out: RowResult[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const cells = dataRows[i];
      const payload: Record<string, unknown> = {};
      for (let c = 0; c < fieldnames.length; c++) {
        const field = fieldnames[c];
        if (!field || !known.has(field)) continue;
        const val = cells[c];
        if (val === undefined || val === '') continue;
        payload[field] = coerce(val);
      }
      try {
        await createDoc(doctype, payload);
        out.push({ row: i + 1, ok: true });
      } catch (err: any) {
        out.push({ row: i + 1, ok: false, error: extractError(err) });
      }
      setProgress({ done: i + 1, total: dataRows.length });
    }

    setResults(out);
    setStatus('done');
    const okCount = out.filter((r) => r.ok).length;
    if (okCount === out.length) {
      toast.success(t('import.allOk', { defaultValue: `تم استيراد ${okCount} سجل` }));
    } else {
      toast.error(
        t('import.partial', {
          defaultValue: `${okCount}/${out.length} سجل تم بنجاح — راجع الأخطاء`,
        }),
      );
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {t('import.title', { defaultValue: 'استيراد من CSV' })} — {doctype}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('import.subtitle', { defaultValue: 'حمل القالب أولاً، املأه، ثم ارفعه هنا' })}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {status === 'idle' && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl py-12 hover:border-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50,#ecfdf5)]/30 transition flex flex-col items-center gap-3"
            >
              <FileUp size={32} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t('import.dropOrClick', { defaultValue: 'اضغط لاختيار ملف CSV' })}
              </span>
              <span className="text-xs text-slate-400">.csv</span>
            </button>
          )}

          {status === 'parsing' && (
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
              {t('import.parsing', { defaultValue: 'جاري قراءة الملف...' })}
            </p>
          )}

          {status === 'importing' && (
            <div className="space-y-3 py-6">
              <p className="text-sm text-slate-700 dark:text-slate-300 text-center">
                {t('import.importing', { defaultValue: 'جاري الاستيراد' })} {progress.done} / {progress.total}
              </p>
              <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] transition-all"
                  style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard
                  label={t('import.success', { defaultValue: 'تم بنجاح' })}
                  value={results.filter((r) => r.ok).length}
                  icon={<CheckCircle2 size={20} />}
                  color="emerald"
                />
                <SummaryCard
                  label={t('import.failed', { defaultValue: 'فشل' })}
                  value={results.filter((r) => !r.ok).length}
                  icon={<AlertTriangle size={20} />}
                  color="red"
                />
              </div>
              {results.some((r) => !r.ok) && (
                <div className="border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-white/[0.02] px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t('import.errors', { defaultValue: 'الأخطاء' })}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-64 overflow-y-auto">
                    {results
                      .filter((r) => !r.ok)
                      .map((r) => (
                        <div key={r.row} className="px-3 py-2 text-xs">
                          <span className="font-mono text-slate-500">
                            {t('import.rowPrefix', { defaultValue: 'سطر' })} {r.row}:
                          </span>{' '}
                          <span className="text-red-600">{r.error}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/20 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {t('import.bigDataHint', {
              defaultValue: 'للملفات الكبيرة (>500 سجل) استخدم Frappe Data Import',
            })}
          </p>
          <div className="flex items-center gap-2">
            {status === 'done' && (
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
              >
                {t('import.uploadAnother', { defaultValue: 'رفع ملف آخر' })}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10"
            >
              {t('common.close', { defaultValue: 'إغلاق' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tiny primitives + helpers ───────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'emerald' | 'red';
}) {
  const cls =
    color === 'emerald'
      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400';
  return (
    <div className={`rounded-xl p-3 flex items-center gap-3 ${cls}`}>
      {icon}
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs">{label}</p>
      </div>
    </div>
  );
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * Tiny RFC-4180-flavoured CSV parser. Handles quoted fields, escaped quotes
 * inside quotes (""), and CRLF/LF line endings. Doesn't try to be smart about
 * mixed quoting — that's what `papaparse` is for if we ever need it.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      cur.push(field);
      field = '';
      continue;
    }
    if (ch === '\n') {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = '';
      continue;
    }
    if (ch === '\r') {
      // CRLF: the \n will close the row. CR alone (Mac classic) we treat like \n.
      if (text[i + 1] !== '\n') {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = '';
      }
      continue;
    }
    field += ch;
  }
  // Flush the trailing field/row if the file doesn't end with a newline.
  if (field !== '' || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

/** Coerce CSV strings to a sensible JS type before sending to Frappe. */
function coerce(s: string): unknown {
  const trimmed = s.trim();
  if (trimmed === '') return '';
  if (trimmed === 'true' || trimmed === 'TRUE') return 1;
  if (trimmed === 'false' || trimmed === 'FALSE') return 0;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (/^-?\d*\.\d+$/.test(trimmed)) return Number(trimmed);
  return s;
}

function extractError(err: any): string {
  const sm = err?._server_messages ?? err?.response?.data?._server_messages;
  if (sm) {
    try {
      const arr = typeof sm === 'string' ? JSON.parse(sm) : sm;
      const msgs = arr.map((s: any) => (typeof s === 'string' ? JSON.parse(s) : s));
      const flat = msgs.map((m: any) => m.message ?? '').filter(Boolean).join('; ');
      if (flat) return flat;
    } catch {
      /* fall through */
    }
  }
  return err?.message ?? err?.exception ?? 'Unknown error';
}
