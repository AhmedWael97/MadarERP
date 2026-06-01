import { useRef, useState } from 'react';
import { useFrappeGetDocList, useFrappePostCall } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { Download, Upload } from 'lucide-react';
import TreeOrTableList from '@/components/erp/TreeOrTableList';

// ─── CSV helpers ─────────────────────────────────────────────────────────────

const CSV_FIELDS = [
  'account_number', 'account_name', 'madaar_name_en', 'parent_account',
  'company', 'root_type', 'account_currency', 'is_group', 'disabled',
  'madaar_nature', 'madaar_description',
] as const;

function escapeCsvValue(v: unknown): string {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; }
    } else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

// ─── Import / Export buttons ──────────────────────────────────────────────────

function ImportExportButtons() {
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const { data: allAccounts } = useFrappeGetDocList<Record<string, unknown>>('Account', {
    fields: [...CSV_FIELDS],
    limit: 5000,
    orderBy: { field: 'lft', order: 'asc' },
  });

  const { call: insertCall } = useFrappePostCall<{ message: { name: string } }>('frappe.client.insert');

  function handleExport() {
    if (!allAccounts?.length) { toast.error('لا توجد حسابات للتصدير'); return; }
    const rows = [CSV_FIELDS.join(',')];
    for (const acc of allAccounts) {
      rows.push(CSV_FIELDS.map((f) => escapeCsvValue(acc[f])).join(','));
    }
    // BOM prefix for correct Arabic display in Excel
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart_of_accounts.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تصدير دليل الحسابات');
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) { toast.error('الملف فارغ أو لا يحتوي بيانات'); return; }
      const headers = parseCsvLine(lines[0]);
      let created = 0;
      let skipped = 0;
      for (let i = 1; i < lines.length; i++) {
        const vals = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, j) => { row[h] = vals[j] ?? ''; });
        if (!row.account_name?.trim() || !row.company?.trim()) { skipped++; continue; }
        const doc: Record<string, unknown> = { doctype: 'Account' };
        for (const [k, v] of Object.entries(row)) {
          if (!v) continue;
          if (k === 'is_group' || k === 'disabled') doc[k] = v === '1' ? 1 : 0;
          else doc[k] = v;
        }
        try { await insertCall({ doc }); created++; }
        catch { skipped++; /* skip duplicates / validation errors */ }
      }
      toast.success(`تم استيراد ${created} حساب${skipped ? ` (تخطي ${skipped})` : ''}`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message ?? 'فشل الاستيراد');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleExport}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-xl transition-all"
      >
        <Download size={16} /> تصدير CSV
      </button>
      <button
        type="button"
        disabled={importing}
        onClick={() => importRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 text-violet-700 dark:text-violet-400 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
      >
        <Upload size={16} /> {importing ? 'جاري الاستيراد...' : 'استيراد CSV'}
      </button>
      <input ref={importRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportFile} />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ERPNext Account: account_name, account_number, account_type, root_type,
// is_group, parent_account, company, disabled. The hierarchy is by
// parent_account → child accounts. Defaults to the tree view (matches the
// reference Blade view) with a toggle to a flat searchable table.
export default function Page() {
  return (
    <TreeOrTableList
      cfg={{
        doctype: 'Account',
        title: 'دليل الحسابات',
        subtitle: 'شجرة حسابات النظام — الأصول والخصوم والإيرادات والمصروفات',
        basePath: '/accounting/chart-of-accounts',
        newLabel: 'حساب جديد',
        parentField: 'parent_account',
        searchField: 'account_name',
        defaultView: 'tree',
        extraActions: <ImportExportButtons />,
        labelFields: { fields: ['account_number', 'account_name'], separator: ' — ' },
        columns: [
          { fieldname: 'account_name',   header: 'اسم الحساب' },
          { fieldname: 'account_number', header: 'الكود' },
          { fieldname: 'account_type',   header: 'النوع' },
          { fieldname: 'root_type',      header: 'التصنيف', isBadge: true },
          { fieldname: 'is_group',       header: 'مجموعة', isBadge: true },
          { fieldname: 'disabled',       header: 'الحالة', isBadge: true },
        ],
        badgeMap: {
          Asset:     { label: 'أصل',       cls: 'bg-violet-100 text-violet-700' },
          Liability: { label: 'خصم',       cls: 'bg-rose-100 text-rose-700' },
          Equity:    { label: 'حقوق ملكية', cls: 'bg-amber-100 text-amber-700' },
          Income:    { label: 'إيراد',     cls: 'bg-emerald-100 text-emerald-700' },
          Expense:   { label: 'مصروف',     cls: 'bg-orange-100 text-orange-700' },
          '0':       { label: '—',         cls: 'bg-slate-100 text-slate-500' },
          '1':       { label: 'نعم',       cls: 'bg-cyan-100 text-cyan-700' },
        },
      }}
    />
  );
}

