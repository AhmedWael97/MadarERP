/** Inventory > Products — list. Stats + search + table + toolbar. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocCount, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { Box, BoxIcon, Eye, Pencil, Plus, Search, Trash2, TrendingDown } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface ItemRow {
  name: string;
  item_code?: string;
  item_name?: string;
  item_group?: string;
  brand?: string;
  stock_uom?: string;
  standard_rate?: number;
  safety_stock?: number;
  disabled?: 0 | 1;
  madaar_barcode?: string;
}

export default function ProductListPage() {
  return (
    <RequirePerm doctype="Item" action="read">
      <PageShell
        title="المنتجات والأصناف"
        subtitle="إدارة المنتجات والخدمات والأسعار"
        actions={
          <Link to="/inventory/products/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
            <Plus size={16} /> منتج جديد
          </Link>
        }
      >
        <Body />
      </PageShell>
    </RequirePerm>
  );
}

function Body() {
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');

  const { data: total } = useFrappeGetDocCount('Item');
  const { data: active } = useFrappeGetDocCount('Item', [['disabled', '=', 0]]);
  const { data: stock } = useFrappeGetDocCount('Item', [['is_stock_item', '=', 1]]);

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (search.trim()) f.push(['item_name', 'like', `%${search.trim()}%`]);
    if (group) f.push(['item_group', '=', group]);
    return f as any;
  }, [search, group]);

  const { data: rows, isLoading } = useFrappeGetDocList<ItemRow>('Item', {
    fields: ['name', 'item_code', 'item_name', 'item_group', 'brand', 'stock_uom', 'standard_rate', 'safety_stock', 'disabled', 'madaar_barcode'],
    filters,
    limit: 100,
    orderBy: { field: 'modified', order: 'desc' },
  });
  const { data: groups } = useFrappeGetDocList<{ name: string }>('Item Group', { fields: ['name'], limit: 200 });

  const toolbarColumns: ToolbarColumn[] = useMemo(() => [
    { id: 'item_code', header: 'الكود' },
    { id: 'item_name', header: 'الاسم' },
    { id: 'madaar_barcode', header: 'الباركود' },
    { id: 'item_group', header: 'المجموعة' },
    { id: 'brand', header: 'العلامة التجارية' },
    { id: 'stock_uom', header: 'الوحدة' },
    { id: 'standard_rate', header: 'السعر' },
    { id: 'safety_stock', header: 'حد إعادة الطلب' },
    { id: 'disabled', header: 'الحالة' },
  ], []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(toolbarColumns.filter((c) => !hidden.has(c.id)).map((c) => c.id)), [toolbarColumns, hidden]);
  const hide = (id: string) => hidden.has(id);

  async function onDelete(name: string) {
    if (!confirm('حذف المنتج؟')) return;
    try { await deleteDoc('Item', name); toast.success('تم'); window.location.reload(); } catch (e: any) { toast.error(e?.message); }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="إجمالي المنتجات" value={Number(total ?? 0)} icon={<Box size={20} />} color="brand" />
        <Stat label="المنتجات النشطة" value={Number(active ?? 0)} icon={<BoxIcon size={20} />} color="emerald" />
        <Stat label="منتجات بمخزون" value={Number(stock ?? 0)} icon={<TrendingDown size={20} />} color="amber" />
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالكود أو الاسم أو الباركود..." className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          </div>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className="w-44 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
            <option value="">كل المجموعات</option>
            {(groups ?? []).map((g) => (<option key={g.name} value={g.name}>{g.name}</option>))}
          </select>
        </div>
      </div>

      <DataTableToolbar
        doctype="Item"
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
                {!hide('item_code') && <Th>الكود</Th>}
                {!hide('item_name') && <Th>الاسم</Th>}
                {!hide('madaar_barcode') && <Th>الباركود</Th>}
                {!hide('item_group') && <Th>المجموعة</Th>}
                {!hide('stock_uom') && <Th>الوحدة</Th>}
                {!hide('standard_rate') && <Th>السعر</Th>}
                {!hide('safety_stock') && <Th>حد إعادة الطلب</Th>}
                {!hide('disabled') && <Th>الحالة</Th>}
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (<tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!isLoading && (rows ?? []).length === 0 && (<tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد منتجات</td></tr>)}
              {(rows ?? []).map((r) => (
                <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  {!hide('item_code') && <td className="px-5 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)]">{r.item_code ?? '—'}</td>}
                  {!hide('item_name') && <td className="px-5 py-3 text-sm font-medium text-slate-800 dark:text-white">{r.item_name ?? r.name}</td>}
                  {!hide('madaar_barcode') && <td className="px-5 py-3 text-sm text-slate-500 font-mono" dir="ltr">{r.madaar_barcode ?? '—'}</td>}
                  {!hide('item_group') && <td className="px-5 py-3 text-sm text-slate-500">{r.item_group ?? '—'}</td>}
                  {!hide('stock_uom') && <td className="px-5 py-3 text-sm text-slate-500">{r.stock_uom ?? '—'}</td>}
                  {!hide('standard_rate') && <td className="px-5 py-3 text-sm font-mono" dir="ltr">{fmtNum(r.standard_rate ?? 0)}</td>}
                  {!hide('safety_stock') && <td className="px-5 py-3 text-sm font-mono" dir="ltr">{fmtNum(r.safety_stock ?? 0)}</td>}
                  {!hide('disabled') && (
                    <td className="px-5 py-3">
                      <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (!r.disabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                        {!r.disabled ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                  )}
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => navigate(`/inventory/products/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition"><Pencil size={16} /></button>
                      <button type="button" onClick={() => onDelete(r.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"><Trash2 size={16} /></button>
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

function Stat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'brand' | 'emerald' | 'amber' }) {
  const cls = { brand: 'bg-[color:var(--color-brand-100,#d1fae5)] text-[color:var(--color-brand-600)]', emerald: 'bg-emerald-100 text-emerald-600', amber: 'bg-amber-100 text-amber-600' }[color];
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${cls} flex items-center justify-center shrink-0`}>{icon}</div>
      <div><p className="text-xs text-slate-500 mb-0.5">{label}</p><p className="text-xl font-bold text-slate-800 dark:text-white" dir="ltr">{value.toLocaleString('en-US')}</p></div>
    </div>
  );
}
function Th({ children }: { children?: React.ReactNode }) { return <th className="px-5 py-3 text-start whitespace-nowrap">{children}</th>; }
function fmtNum(n: number) { try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); } catch { return String(n); } }
