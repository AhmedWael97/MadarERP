/**
 * DataTableToolbar — shared toolbar for every list view in the app.
 *
 * Features (all client-side; no extra deps):
 *   • Copy       — copies the visible rows as TSV to the clipboard
 *   • Print      — `window.print()` with print styles defined in index.css
 *   • Export CSV — UTF-8 BOM + RFC-4180 quoting → opens in Excel correctly (incl. Arabic)
 *   • Export XLS — same payload, `.xls` extension (Excel auto-detects CSV)
 *   • Columns ▾  — checkbox dropdown to toggle column visibility (controlled or uncontrolled)
 *   • Template   — downloads `<doctype>_template.csv` with header row only
 *   • Import     — opens the <ImportDialog> for that doctype
 *
 * Designed for two callers:
 *   (a) The shared <DataTable>           — passes rows + columns + doctype.
 *   (b) Hand-coded list pages (Customer, — same shape; toolbar lives above the table.
 *       Category, ...)
 *
 * Keep this file framework-light: no toasts beyond sonner, no extra libs.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ChevronDown,
  Columns3,
  Copy,
  Download,
  FileDown,
  FileUp,
  Printer,
  Table,
} from 'lucide-react';
import { ImportDialog } from './ImportDialog';

export interface ToolbarColumn {
  id: string;
  header: string;
}

interface Props {
  /** Frappe DocType powering the table — used by export filename + import endpoint. */
  doctype?: string;
  /** Column definitions in display order. */
  columns: ToolbarColumn[];
  /** Currently-visible rows (the toolbar exports what's on screen, not the whole DB). */
  rows: Array<Record<string, unknown>>;
  /** Which column ids are currently visible. Defaults to all. */
  visibleColumnIds?: Set<string>;
  /** Receives the next visible set when the user toggles a column. Required for Columns ▾. */
  onVisibleColumnsChange?: (next: Set<string>) => void;
  /** Hide buttons you don't want. e.g. for child tables you may want to suppress Import. */
  hide?: Partial<Record<'copy' | 'print' | 'csv' | 'xls' | 'columns' | 'template' | 'import', boolean>>;
}

export function DataTableToolbar({
  doctype,
  columns,
  rows,
  visibleColumnIds,
  onVisibleColumnsChange,
  hide = {},
}: Props) {
  const { t } = useTranslation();
  const [importOpen, setImportOpen] = useState(false);

  // The columns that should appear in exports / clipboard. Falls back to all
  // when the parent isn't tracking visibility.
  const exportColumns = useMemo(() => {
    if (!visibleColumnIds) return columns;
    return columns.filter((c) => visibleColumnIds.has(c.id));
  }, [columns, visibleColumnIds]);

  function onCopy() {
    const tsv = buildDelimited(exportColumns, rows, '\t');
    navigator.clipboard.writeText(tsv).then(
      () => toast.success(t('toolbar.copied', { defaultValue: 'تم النسخ' })),
      () => toast.error(t('toolbar.copyFailed', { defaultValue: 'تعذر النسخ' })),
    );
  }

  function onPrint() {
    window.print();
  }

  function onExportCsv() {
    downloadDelimited(exportColumns, rows, ',', `${doctype ?? 'data'}.csv`, 'text/csv');
  }

  function onExportXls() {
    // Excel can read CSV under .xls and auto-prompts the import wizard with separators.
    // Real .xlsx requires a binary writer — that's a future enhancement.
    downloadDelimited(exportColumns, rows, ',', `${doctype ?? 'data'}.xls`, 'application/vnd.ms-excel');
  }

  function onTemplate() {
    // Template = headers only, with the underlying fieldname row so importers know what to map.
    const header = exportColumns.map((c) => c.header).join(',');
    const fieldRow = exportColumns.map((c) => c.id).join(',');
    const blob = new Blob(['﻿' + header + '\n' + fieldRow + '\n'], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, `${doctype ?? 'data'}_template.csv`);
    toast.success(t('toolbar.templateDownloaded', { defaultValue: 'تم تنزيل القالب' }));
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 px-3 py-2 no-print">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Table size={14} /> {t('toolbar.title', { defaultValue: 'أدوات الجدول' })}
        </h3>
        <div className="flex items-center gap-1 flex-wrap">
          {!hide.copy && (
            <ToolbarButton onClick={onCopy} icon={<Copy size={14} />} label={t('toolbar.copy', { defaultValue: 'نسخ' })} />
          )}
          {!hide.print && (
            <ToolbarButton onClick={onPrint} icon={<Printer size={14} />} label={t('toolbar.print', { defaultValue: 'طباعة' })} />
          )}
          {!hide.csv && (
            <ToolbarButton onClick={onExportCsv} icon={<FileDown size={14} />} label="CSV" />
          )}
          {!hide.xls && (
            <ToolbarButton onClick={onExportXls} icon={<FileDown size={14} />} label="Excel" />
          )}
          {!hide.template && (
            <ToolbarButton onClick={onTemplate} icon={<Download size={14} />} label={t('toolbar.template', { defaultValue: 'قالب' })} color="amber" />
          )}
          {!hide.import && doctype && (
            <ToolbarButton
              onClick={() => setImportOpen(true)}
              icon={<FileUp size={14} />}
              label={t('toolbar.import', { defaultValue: 'استيراد' })}
              color="emerald"
            />
          )}
          {!hide.columns && onVisibleColumnsChange && (
            <ColumnsMenu
              columns={columns}
              visible={visibleColumnIds ?? new Set(columns.map((c) => c.id))}
              onChange={onVisibleColumnsChange}
            />
          )}
        </div>
      </div>

      {doctype && (
        <ImportDialog
          doctype={doctype}
          open={importOpen}
          onClose={() => setImportOpen(false)}
          columns={columns}
        />
      )}
    </>
  );
}

// ─── Small primitives ────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  icon,
  label,
  color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: 'emerald' | 'amber';
}) {
  // Default = slate pill; coloured variants used for Import (emerald) + Template (amber)
  // so users can spot the destructive/data-mutating action quickly.
  const cls =
    color === 'emerald'
      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
      : color === 'amber'
        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
        : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${cls}`}
    >
      {icon}
      {label}
    </button>
  );
}

function ColumnsMenu({
  columns,
  visible,
  onChange,
}: {
  columns: ToolbarColumn[];
  visible: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  function toggle(id: string) {
    const next = new Set(visible);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition"
      >
        <Columns3 size={14} />
        {t('toolbar.columns', { defaultValue: 'الأعمدة' })}
        <ChevronDown size={12} className={'transition-transform ' + (open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 py-1 z-50 max-h-[60vh] overflow-y-auto">
          {columns.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
              onMouseDown={(e) => e.preventDefault()}
            >
              <input
                type="checkbox"
                checked={visible.has(c.id)}
                onChange={() => toggle(c.id)}
                className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]"
              />
              <span className="truncate">{c.header}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pure helpers (CSV/TSV) ──────────────────────────────────────────────────

/**
 * Build a delimited string for the given columns + rows. Wraps fields containing
 * the delimiter, quotes, or newlines in double-quotes per RFC 4180 (and doubles
 * any internal quotes).
 */
function buildDelimited(
  columns: ToolbarColumn[],
  rows: Array<Record<string, unknown>>,
  delimiter: ',' | '\t',
): string {
  const escape = (s: string) => {
    if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const header = columns.map((c) => escape(c.header)).join(delimiter);
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = row[c.id];
          const s = raw === null || raw === undefined ? '' : String(raw);
          return escape(s);
        })
        .join(delimiter),
    )
    .join('\n');
  return header + '\n' + body;
}

function downloadDelimited(
  columns: ToolbarColumn[],
  rows: Array<Record<string, unknown>>,
  delimiter: ',' | '\t',
  filename: string,
  mime: string,
) {
  const data = buildDelimited(columns, rows, delimiter);
  // UTF-8 BOM so Excel renders Arabic correctly instead of mojibake.
  const blob = new Blob(['﻿' + data], { type: `${mime};charset=utf-8` });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}
