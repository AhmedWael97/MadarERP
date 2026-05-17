/** Stock Entry list — shared for movements + transfers. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocCount, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRightLeft, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface SERow {
  name: string;
  posting_date?: string;
  stock_entry_type?: string;
  from_warehouse?: string;
  to_warehouse?: string;
  total_outgoing_value?: number;
  docstatus?: 0 | 1 | 2;
}

export type StockEntryListVariant = 'movements' | 'transfers';

const VARIANTS: Record<StockEntryListVariant, { title: string; subtitle: string; basePath: string; typeFilter: 'transfer' | 'non-transfer' }> = {
  movements: { title: 'حركات المخزون', subtitle: 'استلامات وصرف ومخزون', basePath: '/inventory/movements', typeFilter: 'non-transfer' },
  transfers: { title: 'تحويلات المخزون', subtitle: 'تحويل المخزون بين المستودعات', basePath: '/inventory/transfers', typeFilter: 'transfer' },
};

export default function StockEntryListPage({ variant }: { variant: StockEntryListVariant }) {
  const cfg = VARIANTS[variant];
  return (
    <RequirePerm doctype="Stock Entry" action="read">
      <PageShell
        title={cfg.title}
        subtitle={cfg.subtitle}
        actions={
          <Link to={`${cfg.basePath}/create`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
            <Plus size={16} /> جديد
          </Link>
        }
      >
        <Body cfg={cfg} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ cfg }: { cfg: typeof VARIANTS['movements'] }) {
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const typeFilters: Array<[string, any, unknown]> = useMemo(() => {
    if (cfg.typeFilter === 'transfer') return [['stock_entry_type', 'in', ['Material Transfer', 'Material Transfer for Manufacture']]];
    return [['stock_entry_type', 'not in', ['Material Transfer', 'Material Transfer for Manufacture']]];
  }, [cfg]);

  const { data: total } = useFrappeGetDocCount('Stock Entry', typeFilters as any);
  const { data: draft } = useFrappeGetDocCount('Stock Entry', [...typeFilters, ['docstatus', '=', 0]] as any);
  const { data: submitted } = useFrappeGetDocCount('Stock Entry', [...typeFilters, ['docstatus', '=', 1]] as any);

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [...typeFilters];
    if (search.trim()) f.push(['stock_entry_type', 'like', `%${search.trim()}%`]);
    if (from) f.push(['posting_date', '>=', from]);
    if (to) f.push(['posting_date', '<=', to]);
    return f as any;
  }, [typeFilters, search, from, to]);

  const { data: rows, isLoading } = useFrappeGetDocList<SERow>('Stock Entry', {
    fields: ['name', 'posting_date', 'stock_entry_type', 'from_warehouse', 'to_warehouse', 'total_outgoing_value', 'docstatus'],
    filters,
    limit: 100,
    orderBy: { field: 'posting_date', order: 'desc' },
  });

  const toolbarColumns: ToolbarColumn[] = useMemo(() => [
    { id: 'name', header: 'الرقم' },
    { id: 'posting_date', header: 'التاريخ' },
    { id: 'stock_entry_type', header: 'النوع' },
    { id: 'from_warehouse', header: 'من' },
    { id: 'to_warehouse', header: 'إلى' },
    { id: 'total_outgoing_value', header: 'القيمة' },
    { id: 'docstatus', header: 'الحالة' },
  ], []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(toolbarColumns.filter((c) => !hidden.has(c.id)).map((c) => c.id)), [toolbarColumns, hidden]);
  const hide = (id: string) => hidden.has(id);

  async function onDelete(name: string) {
    if (!confirm('حذف الحركة؟')) return;
    try { await deleteDoc('Stock Entry', name); toast.success('تم'); window.location.reload(); } catch (e: any) { toast.error(e?.message); }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="الإجمالي" value={Number(total ?? 0)} icon={<ArrowRightLeft size={20} />} color="brand" />
        <Stat label="مسودات" value={Number(draft ?? 0)} icon={<ArrowRightLeft size={20} />} color="amber" />
        <Stat label="مرحّلة" value={Number(submitted ?? 0)} icon={<ArrowRightLeft size={20} />} color="emerald" />
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          </div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
        </div>
      </div>

      <DataTableToolbar
        doctype="Stock Entry"
        columns={toolbarColumns}
        rows={(rows ?? []) as unknown as Array<Record<string, unknown>>}
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
                {!hide('name') && <Th>الرقم</Th>}
                {!hide('posting_date') && <Th>التاريخ</Th>}
                {!hide('stock_entry_type') && <Th>النوع</Th>}
                {!hide('from_warehouse') && <Th>من</Th>}
                {!hide('to_warehouse') && <Th>إلى</Th>}
                {!hide('total_outgoing_value') && <Th>القيمة</Th>}
                {!hide('docstatus') && <Th>الحالة</Th>}
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (<tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!isLoading && (rows ?? []).length === 0 && (<tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد سجلات</td></tr>)}
              {(rows ?? []).map((r) => {
                const status = r.docstatus === 1 ? 'مرحّل' : r.docstatus === 2 ? 'ملغى' : 'مسودة';
                const cls = r.docstatus === 1 ? 'bg-emerald-100 text-emerald-700' : r.docstatus === 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                return (
                  <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    {!hide('name') && <td className="px-5 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)]">{r.name}</td>}
                    {!hide('posting_date') && <td className="px-5 py-3 text-sm text-slate-600">{r.posting_date ?? '—'}</td>}
                    {!hide('stock_entry_type') && <td className="px-5 py-3 text-sm">{r.stock_entry_type ?? '—'}</td>}
                    {!hide('from_warehouse') && <td className="px-5 py-3 text-sm text-slate-500">{r.from_warehouse ?? '—'}</td>}
                    {!hide('to_warehouse') && <td className="px-5 py-3 text-sm text-slate-500">{r.to_warehouse ?? '—'}</td>}
                    {!hide('total_outgoing_value') && <td className="px-5 py-3 text-sm font-mono" dir="ltr">{fmtNum(r.total_outgoing_value ?? 0)}</td>}
                    {!hide('docstatus') && <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{status}</span></td>}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => navigate(`${cfg.basePath}/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition"><Pencil size={16} /></button>
                        <button type="button" onClick={() => onDelete(r.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'brand' | 'emerald' | 'amber' }) {
  const cls = { brand: 'bg-[color:var(--color-brand-100,#d1fae5)] text-[color:var(--color-brand-600)]', emerald: 'bg-emerald-100 text-emerald-600', amber: 'bg-amber-100 text-amber-600' }[color];
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${cls} flex items-center justify-center shrink-0`}>{icon}</div>
      <div><p className="text-xs text-slate-500 mb-0.5">{label}</p><p className="text-xl font-bold" dir="ltr">{value.toLocaleString('en-US')}</p></div>
    </div>
  );
}
function Th({ children }: { children?: React.ReactNode }) { return <th className="px-5 py-3 text-start whitespace-nowrap">{children}</th>; }
function fmtNum(n: number) { try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); } catch { return String(n); } }
