/**
 * Supplier list — mirrors CustomerList for the reference Blade
 *   `H:/coupons/Madaar ERP/Madaar ERP/resources/views/suppliers/index.blade.php`.
 *
 * Same shape as Customers: stats / filters / table / action menu. Filters drop
 * the credit-limit / discount columns (suppliers don't have them) and swap the
 * "category" link target to Supplier Categories.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useFrappeDeleteDoc,
  useFrappeGetCall,
  useFrappeGetDocCount,
  useFrappeGetDocList,
} from 'frappe-react-sdk';
import { toast } from 'sonner';
import {
  ChevronDown,
  FileText,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface SupplierRow {
  name: string;
  supplier_name?: string;
  supplier_type?: 'Individual' | 'Company';
  disabled?: 0 | 1;
  madaar_supplier_code?: string;
  madaar_name_ar?: string;
  madaar_name_en?: string;
  madaar_phone?: string;
  madaar_mobile?: string;
  madaar_email?: string;
  madaar_opening_balance?: number;
  madaar_supplier_category?: string;
}

export default function SupplierListPage() {
  return (
    <RequirePerm doctype="Supplier" action="read">
      <PageShell
        title="الموردون"
        subtitle="إدارة بيانات الموردين والدائنين"
        actions={
          <>
            <Link to="/supplier-categories" className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
              التصنيفات
            </Link>
            <Link to="/suppliers/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
              <Plus size={16} />
              مورد جديد
            </Link>
          </>
        }
      >
        <SupplierListBody />
      </PageShell>
    </RequirePerm>
  );
}

function SupplierListBody() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'' | 'Individual' | 'Company'>('');
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('');

  const { data: totalCount } = useFrappeGetDocCount('Supplier');
  const { data: activeCount } = useFrappeGetDocCount('Supplier', [['disabled', '=', 0]]);
  const { data: totalBalanceResp } = useFrappeGetCall<{ message?: number }>(
    'frappe.client.get_list',
    {
      doctype: 'Supplier',
      fields: '["sum(madaar_opening_balance) as total"]',
      limit_page_length: 1,
    },
    'supplier-stats:totalBalance',
  );
  const totalBalance = useMemo(() => {
    const m = (totalBalanceResp as any)?.message;
    if (Array.isArray(m) && m.length) return Number(m[0].total ?? 0) || 0;
    return 0;
  }, [totalBalanceResp]);

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (search.trim()) f.push(['supplier_name', 'like', `%${search.trim()}%`]);
    if (category) f.push(['madaar_supplier_category', '=', category]);
    if (type) f.push(['supplier_type', '=', type]);
    if (status === 'active') f.push(['disabled', '=', 0]);
    if (status === 'inactive') f.push(['disabled', '=', 1]);
    return f as any;
  }, [search, category, type, status]);

  const { data: suppliers, isLoading } = useFrappeGetDocList<SupplierRow>('Supplier', {
    fields: ['name', 'supplier_name', 'supplier_type', 'disabled', 'madaar_supplier_code', 'madaar_name_ar', 'madaar_name_en', 'madaar_phone', 'madaar_mobile', 'madaar_email', 'madaar_opening_balance', 'madaar_supplier_category'],
    filters,
    limit: 100,
    orderBy: { field: 'modified', order: 'desc' },
  });

  const { data: categories } = useFrappeGetDocList<{ name: string }>('Madaar Supplier Category', {
    fields: ['name'],
    limit: 100,
  });

  const toolbarColumns: ToolbarColumn[] = useMemo(
    () => [
      { id: 'madaar_supplier_code', header: 'الكود' },
      { id: 'supplier_name', header: 'المورد' },
      { id: 'madaar_name_en', header: 'الاسم بالإنجليزية' },
      { id: 'madaar_phone', header: 'الهاتف' },
      { id: 'madaar_mobile', header: 'الموبايل' },
      { id: 'madaar_email', header: 'البريد' },
      { id: 'supplier_type', header: 'النوع' },
      { id: 'madaar_supplier_category', header: 'التصنيف' },
      { id: 'madaar_opening_balance', header: 'الرصيد الافتتاحي' },
      { id: 'disabled', header: 'معطل' },
    ],
    [],
  );
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(
    () => new Set(toolbarColumns.filter((c) => !hiddenColumns.has(c.id)).map((c) => c.id)),
    [toolbarColumns, hiddenColumns],
  );
  const hide = (id: string) => hiddenColumns.has(id);

  return (
    <div className="space-y-6">
      <StatCards total={Number(totalCount ?? 0)} active={Number(activeCount ?? 0)} balance={totalBalance} />
      <FilterBar search={search} onSearch={setSearch} category={category} onCategory={setCategory} type={type} onType={setType} status={status} onStatus={setStatus} categories={categories?.map((c) => c.name) ?? []} />
      <DataTableToolbar
        doctype="Supplier"
        columns={toolbarColumns}
        rows={(suppliers ?? []) as unknown as Array<Record<string, unknown>>}
        visibleColumnIds={visibleIds}
        onVisibleColumnsChange={(next) => {
          const allIds = toolbarColumns.map((c) => c.id);
          setHiddenColumns(new Set(allIds.filter((id) => !next.has(id))));
        }}
      />
      <SupplierTable rows={suppliers ?? []} loading={isLoading} hide={hide} />
    </div>
  );
}

function StatCards({ total, active, balance }: { total: number; active: number; balance: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="إجمالي الموردين" value={total.toLocaleString('en-US')} icon={<Users size={20} />} color="brand" />
      <StatCard label="موردين نشطين" value={active.toLocaleString('en-US')} icon={<CheckCircle2 size={20} />} color="emerald" />
      <StatCard label="إجمالي الأرصدة" value={`${fmtNum(balance)} ج.م`} icon={<Wallet size={20} />} color="amber" />
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: 'brand' | 'emerald' | 'amber' }) {
  const palette = {
    brand: 'from-[color:var(--color-brand-500)]/10 to-[color:var(--color-brand-500)]/5 text-[color:var(--color-brand-600)]',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-600',
  }[color];
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${palette} flex items-center justify-center`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function FilterBar(props: {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  type: string;
  onType: (v: '' | 'Individual' | 'Company') => void;
  status: string;
  onStatus: (v: '' | 'active' | 'inactive') => void;
  categories: string[];
}) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" value={props.search} onChange={(e) => props.onSearch(e.target.value)} placeholder="بحث بالكود أو الاسم أو الهاتف..." className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
        </div>
        <select value={props.category} onChange={(e) => props.onCategory(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
          <option value="">كل التصنيفات</option>
          {props.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={props.type} onChange={(e) => props.onType(e.target.value as '' | 'Individual' | 'Company')} className="w-28 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
          <option value="">كل الأنواع</option>
          <option value="Individual">فرد</option>
          <option value="Company">شركة</option>
        </select>
        <select value={props.status} onChange={(e) => props.onStatus(e.target.value as '' | 'active' | 'inactive')} className="w-32 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">معطل</option>
        </select>
      </div>
    </div>
  );
}

function SupplierTable({ rows, loading, hide }: { rows: SupplierRow[]; loading: boolean; hide: (id: string) => boolean }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
            <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {!hide('madaar_supplier_code') && <Th>الكود</Th>}
              {!hide('supplier_name') && <Th>المورد</Th>}
              {!hide('madaar_phone') && <Th>الهاتف</Th>}
              {!hide('madaar_email') && <Th>البريد</Th>}
              {!hide('supplier_type') && <Th>النوع</Th>}
              {!hide('madaar_opening_balance') && <Th>الرصيد الافتتاحي</Th>}
              <Th>الرصيد</Th>
              {!hide('disabled') && <Th>الحالة</Th>}
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading && (
              <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">لا يوجد موردين — ابدأ بإضافة مورد جديد</td></tr>
            )}
            {rows.map((s) => <SupplierRowView key={s.name} s={s} hide={hide} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-start whitespace-nowrap">{children}</th>;
}

function SupplierRowView({ s, hide }: { s: SupplierRow; hide: (id: string) => boolean }) {
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [open, setOpen] = useState(false);
  const isActive = !s.disabled;
  const isCompany = s.supplier_type === 'Company';
  const displayName = s.madaar_name_ar || s.supplier_name || s.name;
  const phone = s.madaar_phone || s.madaar_mobile || '—';

  async function onDelete() {
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return;
    try {
      await deleteDoc('Supplier', s.name);
      toast.success('تم الحذف');
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message ?? 'تعذر الحذف');
    }
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
      {!hide('madaar_supplier_code') && (
        <td className="px-4 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">{s.madaar_supplier_code ?? '—'}</td>
      )}
      {!hide('supplier_name') && (
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{displayName}</p>
          {s.madaar_name_en && <p className="text-xs text-slate-400">{s.madaar_name_en}</p>}
        </td>
      )}
      {!hide('madaar_phone') && <td className="px-4 py-3 text-sm text-slate-500 font-mono" dir="ltr">{phone}</td>}
      {!hide('madaar_email') && <td className="px-4 py-3 text-sm text-slate-500">{s.madaar_email ?? '—'}</td>}
      {!hide('supplier_type') && (
        <td className="px-4 py-3">
          <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (isCompany ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400')}>
            {isCompany ? 'شركة' : 'فرد'}
          </span>
        </td>
      )}
      {!hide('madaar_opening_balance') && (
        <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400" dir="ltr">{fmtNum(s.madaar_opening_balance ?? 0)}</td>
      )}
      <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-500" dir="ltr">{fmtNum(s.madaar_opening_balance ?? 0)}</td>
      {!hide('disabled') && (
        <td className="px-4 py-3">
          <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (isActive ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400')}>
            {isActive ? 'نشط' : 'معطل'}
          </span>
        </td>
      )}
      <td className="px-4 py-3">
        <div className="relative">
          <button type="button" onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white text-xs font-semibold rounded-lg transition">
            الإجراءات
            <ChevronDown size={14} className={'transition-transform ' + (open ? 'rotate-180' : '')} />
          </button>
          {open && (
            <div className="absolute end-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 py-1 z-50">
              <MenuItem onClick={() => navigate(`/suppliers/${encodeURIComponent(s.name)}/statement`)} icon={<FileText size={16} />}>كشف حساب المورد</MenuItem>
              <MenuItem onClick={() => navigate(`/suppliers/${encodeURIComponent(s.name)}`)} icon={<Eye size={16} />}>تفاصيل المورد</MenuItem>
              <MenuItem onClick={() => navigate(`/suppliers/${encodeURIComponent(s.name)}/edit`)} icon={<Pencil size={16} />}>تحرير المورد</MenuItem>
              <div className="border-t border-slate-100 dark:border-white/5 my-1" />
              <MenuItem onClick={onDelete} icon={<Trash2 size={16} />} danger>حذف المورد</MenuItem>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function MenuItem({ onClick, icon, children, danger }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode; danger?: boolean }) {
  return (
    <button type="button" onMouseDown={onClick} className={'flex items-center gap-2 w-full px-3 py-2 text-sm transition text-start ' + (danger ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5')}>
      <span className={danger ? 'text-red-500' : 'text-slate-400'}>{icon}</span>
      {children}
    </button>
  );
}

function fmtNum(n: number): string {
  try {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(n);
  }
}
