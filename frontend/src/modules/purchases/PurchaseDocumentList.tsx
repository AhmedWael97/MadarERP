/** Shared list view for the 3 purchase transaction doctypes — mirrors SalesDocumentList. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocCount, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { Eye, Pencil, Plus, Receipt, Search, Trash2, Wallet } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface VariantConfig {
  doctype: string;
  title: string;
  subtitle: string;
  basePath: string;
  newLabel: string;
  extraFilter?: [string, any, unknown];
  excludeFilter?: [string, any, unknown];
  dateField: 'posting_date' | 'transaction_date';
}

const VARIANTS: Record<string, VariantConfig> = {
  invoices: { doctype: 'Purchase Invoice', title: 'فواتير المشتريات', subtitle: 'إدارة فواتير الشراء والصرف',                basePath: '/purchases/invoices', newLabel: 'فاتورة جديدة', excludeFilter: ['is_return', '!=', 1], dateField: 'posting_date' },
  orders:   { doctype: 'Purchase Order',   title: 'أوامر الشراء',      subtitle: 'إدارة أوامر الشراء',                       basePath: '/purchases/orders',   newLabel: 'أمر جديد',                                          dateField: 'transaction_date' },
  returns:  { doctype: 'Purchase Invoice', title: 'مرتجعات المشتريات', subtitle: 'إدارة مرتجعات المشتريات والإشعارات المدينة', basePath: '/purchases/returns',  newLabel: 'مرتجع جديد',   extraFilter: ['is_return', '=', 1],   dateField: 'posting_date' },
};

interface PDRow {
  name: string;
  posting_date?: string;
  transaction_date?: string;
  supplier?: string;
  supplier_name?: string;
  grand_total?: number;
  status?: string;
  docstatus?: 0 | 1 | 2;
}

export default function PurchaseDocumentListPage({ variant }: { variant: keyof typeof VARIANTS }) {
  const cfg = VARIANTS[variant];
  return (
    <RequirePerm doctype={cfg.doctype} action="read">
      <PageShell
        title={cfg.title}
        subtitle={cfg.subtitle}
        actions={
          <Link to={`${cfg.basePath}/create`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
            <Plus size={16} /> {cfg.newLabel}
          </Link>
        }
      >
        <Body cfg={cfg} variant={variant} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ cfg, variant }: { cfg: VariantConfig; variant: string }) {
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'draft' | 'submitted' | 'cancelled' | 'paid'>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const baseFilters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (cfg.extraFilter) f.push(cfg.extraFilter);
    if (cfg.excludeFilter) f.push(cfg.excludeFilter as any);
    return f;
  }, [cfg]);

  const { data: totalC } = useFrappeGetDocCount(cfg.doctype, baseFilters as any);
  const { data: draftC } = useFrappeGetDocCount(cfg.doctype, [...baseFilters, ['docstatus', '=', 0]] as any);
  const { data: postedC } = useFrappeGetDocCount(cfg.doctype, [...baseFilters, ['docstatus', '=', 1]] as any);
  const { data: totalsResp } = useFrappeGetDocList<{ grand_total?: number }>(cfg.doctype, {
    fields: ['grand_total'],
    filters: baseFilters as any,
    limit: 1000,
  });
  const sumTotal = useMemo(() => (totalsResp ?? []).reduce((s, r) => s + Number(r.grand_total ?? 0), 0), [totalsResp]);

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [...baseFilters];
    if (search.trim()) f.push(['supplier', 'like', `%${search.trim()}%`]);
    if (statusFilter === 'draft') f.push(['docstatus', '=', 0]);
    if (statusFilter === 'submitted') f.push(['docstatus', '=', 1]);
    if (statusFilter === 'cancelled') f.push(['docstatus', '=', 2]);
    if (statusFilter === 'paid') f.push(['status', '=', 'Paid']);
    if (from) f.push([cfg.dateField, '>=', from]);
    if (to) f.push([cfg.dateField, '<=', to]);
    return f as any;
  }, [baseFilters, search, statusFilter, from, to, cfg]);

  const { data: rows, isLoading } = useFrappeGetDocList<PDRow>(cfg.doctype, {
    fields: ['name', 'posting_date', 'transaction_date', 'supplier', 'supplier_name', 'grand_total', 'status', 'docstatus'],
    filters,
    limit: 100,
    orderBy: { field: cfg.dateField, order: 'desc' },
  });

  const toolbarColumns: ToolbarColumn[] = useMemo(() => [
    { id: 'name', header: 'الرقم' },
    { id: cfg.dateField, header: 'التاريخ' },
    { id: 'supplier', header: 'المورد' },
    { id: 'grand_total', header: 'الإجمالي' },
    { id: 'status', header: 'الحالة' },
  ], [cfg.dateField]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(toolbarColumns.filter((c) => !hidden.has(c.id)).map((c) => c.id)), [toolbarColumns, hidden]);
  const hide = (id: string) => hidden.has(id);

  async function onDelete(name: string) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await deleteDoc(cfg.doctype, name);
      toast.success('تم الحذف');
      window.location.reload();
    } catch (e: any) { toast.error(e?.message ?? 'تعذر الحذف'); }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="إجمالي السجلات" value={Number(totalC ?? 0)} icon={<Receipt size={20} />} color="brand" />
        <Stat label="مسودات" value={Number(draftC ?? 0)} icon={<Receipt size={20} />} color="amber" />
        <Stat label="مرحّلة" value={Number(postedC ?? 0)} icon={<Receipt size={20} />} color="emerald" />
        <Stat label="إجمالي القيمة" value={sumTotal} icon={<Wallet size={20} />} color="purple" formatNumber />
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث برقم أو مورد..." className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
            <option value="">كل الحالات</option>
            <option value="draft">مسودة</option>
            <option value="submitted">مرحّل</option>
            {variant === 'invoices' && <option value="paid">مدفوع</option>}
            <option value="cancelled">ملغى</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
        </div>
      </div>

      <DataTableToolbar
        doctype={cfg.doctype}
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
                {!hide(cfg.dateField) && <Th>التاريخ</Th>}
                {!hide('supplier') && <Th>المورد</Th>}
                {!hide('grand_total') && <Th>الإجمالي</Th>}
                {!hide('status') && <Th>الحالة</Th>}
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (<tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!isLoading && (rows ?? []).length === 0 && (<tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد سجلات</td></tr>)}
              {(rows ?? []).map((r) => (
                <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  {!hide('name') && <td className="px-5 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">{r.name}</td>}
                  {!hide(cfg.dateField) && <td className="px-5 py-3 text-sm text-slate-600">{r[cfg.dateField as keyof PDRow] as string ?? '—'}</td>}
                  {!hide('supplier') && <td className="px-5 py-3 text-sm text-slate-800">{r.supplier_name ?? r.supplier ?? '—'}</td>}
                  {!hide('grand_total') && <td className="px-5 py-3 text-sm font-mono">{fmtNum(r.grand_total ?? 0)}</td>}
                  {!hide('status') && <td className="px-5 py-3"><StatusBadge docstatus={r.docstatus ?? 0} status={r.status} /></td>}
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => navigate(`${cfg.basePath}/${encodeURIComponent(r.name)}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition" aria-label="view"><Eye size={16} /></button>
                      <button type="button" onClick={() => navigate(`${cfg.basePath}/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition" aria-label="edit"><Pencil size={16} /></button>
                      <button type="button" onClick={() => onDelete(r.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" aria-label="delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ docstatus, status }: { docstatus: 0 | 1 | 2; status?: string }) {
  if (status && status !== 'Draft' && status !== 'Submitted' && status !== 'Cancelled') {
    const isGood = ['Paid', 'Completed', 'Delivered', 'To Bill', 'Received'].includes(status);
    const cls = isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{status}</span>;
  }
  const map = { 0: { label: 'مسودة', cls: 'bg-amber-100 text-amber-700' }, 1: { label: 'مرحّل', cls: 'bg-emerald-100 text-emerald-700' }, 2: { label: 'ملغى', cls: 'bg-red-100 text-red-700' } }[docstatus];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map.cls}`}>{map.label}</span>;
}
function Stat({ label, value, icon, color, formatNumber }: { label: string; value: number; icon: React.ReactNode; color: 'brand' | 'emerald' | 'amber' | 'purple'; formatNumber?: boolean }) {
  const cls = { brand: 'bg-[color:var(--color-brand-100,#d1fae5)] text-[color:var(--color-brand-600)]', emerald: 'bg-emerald-100 text-emerald-600', amber: 'bg-amber-100 text-amber-600', purple: 'bg-purple-100 text-purple-600' }[color];
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${cls} flex items-center justify-center shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-slate-800 dark:text-white" dir="ltr">{formatNumber ? fmtNum(value) : value.toLocaleString('en-US')}</p>
      </div>
    </div>
  );
}
function Th({ children }: { children?: React.ReactNode }) { return <th className="px-5 py-3 text-start whitespace-nowrap">{children}</th>; }
function fmtNum(n: number) { try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); } catch { return String(n); } }
