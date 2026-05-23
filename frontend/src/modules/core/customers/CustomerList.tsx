/**
 * Customer list — hand-coded to match reference Blade view
 *   `H:/coupons/Madaar ERP/Madaar ERP/resources/views/customers/index.blade.php`.
 *
 * Sections, top to bottom:
 *   1. Page header: title + 2 actions (Categories link, brand "+ new" pill)
 *   2. Stat cards row: Total / Active / Total balance
 *   3. Filter bar: search, category, type, status
 *   4. Data table (9 cols + actions dropdown)
 *
 * Data shape comes from the Custom Fields added in `madaar_core/patches/v1_0/
 * create_madaar_custom_fields.py` — see CustomerForm.tsx for the full mapping.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

interface CustomerRow {
  name: string;
  customer_name?: string;
  customer_type?: 'Individual' | 'Company';
  disabled?: 0 | 1;
  madaar_customer_code?: string;
  madaar_name_ar?: string;
  madaar_name_en?: string;
  madaar_phone?: string;
  madaar_mobile?: string;
  madaar_email?: string;
  madaar_credit_limit?: number;
  madaar_opening_balance?: number;
  madaar_customer_category?: string;
}

export default function CustomerListPage() {
  const { t } = useTranslation();
  return (
    <RequirePerm doctype="Customer" action="read">
      <PageShell
        title={t('customer.list.title', { defaultValue: 'العملاء' })}
        subtitle={t('customer.list.subtitle', { defaultValue: 'إدارة بيانات العملاء والمدينين' })}
        actions={
          <>
            <Link
              to="/customer-categories"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all"
            >
              {t('customer.list.categories', { defaultValue: 'التصنيفات' })}
            </Link>
            <Link
              to="/customers/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all"
            >
              <Plus size={16} />
              {t('customer.list.new', { defaultValue: 'عميل جديد' })}
            </Link>
          </>
        }
      >
        <CustomerListBody />
      </PageShell>
    </RequirePerm>
  );
}

function CustomerListBody() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'' | 'Individual' | 'Company'>('');
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('');

  // Stats: total customer count + active count (cheap, scoped to the whole
  // table). Total balance is computed from the real outstanding map below,
  // not the opening-balance field — see `totalBalance` further down.
  const { data: totalCount } = useFrappeGetDocCount('Customer');
  const { data: activeCount } = useFrappeGetDocCount('Customer', [['disabled', '=', 0]]);

  // Filters → Frappe doc list filters. The SDK's Filter generic is too strict
  // for our heterogeneous tuple types — cast at the boundary so the call site
  // stays readable.
  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (search.trim()) {
      // OR across multiple fields isn't trivial with the simple filter array;
      // for the list pass we filter by customer_name LIKE and rely on the user
      // also pasting the code/phone. Better: hit `frappe.client.search_link` —
      // but that's overkill for the v1 sweep.
      f.push(['customer_name', 'like', `%${search.trim()}%`]);
    }
    if (category) f.push(['madaar_customer_category', '=', category]);
    if (type) f.push(['customer_type', '=', type]);
    if (status === 'active') f.push(['disabled', '=', 0]);
    if (status === 'inactive') f.push(['disabled', '=', 1]);
    return f as any;
  }, [search, category, type, status]);

  const { data: customers, isLoading } = useFrappeGetDocList<CustomerRow>('Customer', {
    fields: [
      'name',
      'customer_name',
      'customer_type',
      'disabled',
      'madaar_customer_code',
      'madaar_name_ar',
      'madaar_name_en',
      'madaar_phone',
      'madaar_mobile',
      'madaar_email',
      'madaar_credit_limit',
      'madaar_opening_balance',
      'madaar_customer_category',
    ],
    filters,
    limit: 100,
    orderBy: { field: 'modified', order: 'desc' },
  });

  // Real outstanding per customer, read straight off `tabGL Entry` — same
  // table Customer Aging and Trial Balance read. This is the authoritative
  // "what does this customer owe us right now" number; without it the
  // table would show the opening-balance field, which is meaningless once
  // any invoice has been raised.
  const partyNames = useMemo(
    () => (customers ?? []).map((c) => c.name),
    [customers],
  );
  const balanceKey = partyNames.join('|') || 'empty';
  const { data: balancesResp } = useFrappeGetCall<{ message: Record<string, number> }>(
    'madaar_core.api_balances.get_party_outstanding',
    partyNames.length
      ? { parties: partyNames, party_type: 'Customer' }
      : undefined,
    `customer-balances:${balanceKey}`,
  );
  const balances: Record<string, number> = balancesResp?.message ?? {};
  // Stat-card sum: total outstanding across the currently fetched customers.
  // Limited to the first 100 rows (same limit as the table) so the number
  // matches what's visible. A "true" global sum across all customers would
  // need a separate server-side aggregate call.
  const totalBalance = useMemo(
    () => Object.values(balances).reduce((acc, n) => acc + (Number(n) || 0), 0),
    [balances],
  );

  const { data: categories } = useFrappeGetDocList<{ name: string }>('Madaar Customer Category', {
    fields: ['name'],
    limit: 100,
  });

  // Column metadata for the toolbar (Copy / Export / Template / Columns ▾ / Import).
  // The ids MUST match the Frappe fieldnames we fetched above so CSV imports
  // round-trip cleanly via the same template.
  const toolbarColumns: ToolbarColumn[] = useMemo(
    () => [
      { id: 'madaar_customer_code', header: 'الكود' },
      { id: 'customer_name', header: 'العميل' },
      { id: 'madaar_name_en', header: 'الاسم بالإنجليزية' },
      { id: 'madaar_phone', header: 'الهاتف' },
      { id: 'madaar_mobile', header: 'الموبايل' },
      { id: 'madaar_email', header: 'البريد' },
      { id: 'customer_type', header: 'النوع' },
      { id: 'madaar_customer_category', header: 'التصنيف' },
      { id: 'madaar_credit_limit', header: 'حد الائتمان' },
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

  return (
    <div className="space-y-6">
      <StatCards
        total={Number(totalCount ?? 0)}
        active={Number(activeCount ?? 0)}
        balance={totalBalance}
      />

      <FilterBar
        search={search}
        onSearch={setSearch}
        category={category}
        onCategory={setCategory}
        type={type}
        onType={setType}
        status={status}
        onStatus={setStatus}
        categories={categories?.map((c) => c.name) ?? []}
      />

      <DataTableToolbar
        doctype="Customer"
        columns={toolbarColumns}
        rows={(customers ?? []) as unknown as Array<Record<string, unknown>>}
        visibleColumnIds={visibleIds}
        onVisibleColumnsChange={(next) => {
          const allIds = toolbarColumns.map((c) => c.id);
          setHiddenColumns(new Set(allIds.filter((id) => !next.has(id))));
        }}
      />

      <CustomerTable
        rows={customers ?? []}
        loading={isLoading}
        hiddenColumns={hiddenColumns}
        balances={balances}
      />
    </div>
  );
}

// ─── Stat cards (3 across, brand / emerald / amber) ───────────────────────────

function StatCards({ total, active, balance }: { total: number; active: number; balance: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        label="إجمالي العملاء"
        value={total.toLocaleString('en-US')}
        icon={<Users size={20} />}
        color="brand"
      />
      <StatCard
        label="عملاء نشطين"
        value={active.toLocaleString('en-US')}
        icon={<CheckCircle2 size={20} />}
        color="emerald"
      />
      <StatCard
        label="إجمالي الأرصدة"
        value={`${fmtNum(balance)} ج.م`}
        icon={<Wallet size={20} />}
        color="amber"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'brand' | 'emerald' | 'amber';
}) {
  const palette = {
    brand:
      'from-[color:var(--color-brand-500)]/10 to-[color:var(--color-brand-500)]/5 text-[color:var(--color-brand-600)]',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-600',
  }[color];
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${palette} flex items-center justify-center`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

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
          <Search
            size={16}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            placeholder="بحث بالكود أو الاسم أو الهاتف..."
            className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
          />
        </div>
        <select
          value={props.category}
          onChange={(e) => props.onCategory(e.target.value)}
          className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
        >
          <option value="">كل التصنيفات</option>
          {props.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={props.type}
          onChange={(e) => props.onType(e.target.value as '' | 'Individual' | 'Company')}
          className="w-28 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
        >
          <option value="">كل الأنواع</option>
          <option value="Individual">فرد</option>
          <option value="Company">شركة</option>
        </select>
        <select
          value={props.status}
          onChange={(e) => props.onStatus(e.target.value as '' | 'active' | 'inactive')}
          className="w-32 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]"
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">معطل</option>
        </select>
      </div>
    </div>
  );
}

// ─── Data table ──────────────────────────────────────────────────────────────

function CustomerTable({
  rows,
  loading,
  hiddenColumns,
  balances,
}: {
  rows: CustomerRow[];
  loading: boolean;
  hiddenColumns: Set<string>;
  balances: Record<string, number>;
}) {
  // The customer row is bespoke (it stacks ar/en in one cell, has a colored
  // pill for type, etc.) — so we map "hide this fieldname" to "skip this <td>".
  // The mapping below keeps the toolbar's column ids aligned with the cells
  // we actually render.
  const hide = (id: string) => hiddenColumns.has(id);
  const visibleCellCount =
    [
      'madaar_customer_code',
      'customer_name',
      'madaar_phone',
      'madaar_email',
      'customer_type',
      'madaar_credit_limit',
      'madaar_opening_balance',
      'balance_synthetic',
      'disabled',
    ].filter((id) => !hide(id) && id !== 'balance_synthetic').length +
    // "Balance" col + status + actions track separately — only hide via toolbar
    // when the user toggles `madaar_opening_balance` / `disabled`.
    (hide('madaar_opening_balance') ? 0 : 1) +
    1 + // actions column always visible
    1; // status column always visible
  // For simplicity in this v1, the table always renders the full set of cells
  // — the toolbar's "Columns" menu controls export visibility. (Hiding cells
  // in the bespoke row layout would mean rewriting every td branch.)
  void visibleCellCount;

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
            <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {!hide('madaar_customer_code') && <Th>الكود</Th>}
              {!hide('customer_name') && <Th>العميل</Th>}
              {!hide('madaar_phone') && <Th>الهاتف</Th>}
              {!hide('madaar_email') && <Th>البريد</Th>}
              {!hide('customer_type') && <Th>النوع</Th>}
              {!hide('madaar_credit_limit') && <Th>حد الائتمان</Th>}
              {!hide('madaar_opening_balance') && <Th>الرصيد الافتتاحي</Th>}
              <Th>الرصيد</Th>
              {!hide('disabled') && <Th>الحالة</Th>}
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading && (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-sm text-slate-400">
                  جاري التحميل...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-sm text-slate-400">
                  لا يوجد عملاء — ابدأ بإضافة عميل جديد
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <CustomerRowView key={c.name} c={c} hide={hide} balance={balances[c.name] ?? 0} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-start whitespace-nowrap">{children}</th>;
}

function CustomerRowView({
  c,
  hide,
  balance,
}: {
  c: CustomerRow;
  hide: (id: string) => boolean;
  balance: number;
}) {
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [open, setOpen] = useState(false);
  const isActive = !c.disabled;
  const isCompany = c.customer_type === 'Company';
  const displayName = c.madaar_name_ar || c.customer_name || c.name;
  const phone = c.madaar_phone || c.madaar_mobile || '—';

  async function onDelete() {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
    try {
      await deleteDoc('Customer', c.name);
      toast.success('تم الحذف');
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message ?? 'تعذر الحذف');
    }
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
      {!hide('madaar_customer_code') && (
        <td className="px-4 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
          {c.madaar_customer_code ?? '—'}
        </td>
      )}
      {!hide('customer_name') && (
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{displayName}</p>
          {c.madaar_name_en && <p className="text-xs text-slate-400">{c.madaar_name_en}</p>}
        </td>
      )}
      {!hide('madaar_phone') && (
        <td className="px-4 py-3 text-sm text-slate-500 font-mono" dir="ltr">
          {phone}
        </td>
      )}
      {!hide('madaar_email') && (
        <td className="px-4 py-3 text-sm text-slate-500">{c.madaar_email ?? '—'}</td>
      )}
      {!hide('customer_type') && (
        <td className="px-4 py-3">
          <span
            className={
              'text-xs font-semibold px-2 py-0.5 rounded-full ' +
              (isCompany
                ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                : 'bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400')
            }
          >
            {isCompany ? 'شركة' : 'فرد'}
          </span>
        </td>
      )}
      {!hide('madaar_credit_limit') && (
        <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400" dir="ltr">
          {fmtNum(c.madaar_credit_limit ?? 0)}
        </td>
      )}
      {!hide('madaar_opening_balance') && (
        <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400" dir="ltr">
          {fmtNum(c.madaar_opening_balance ?? 0)}
        </td>
      )}
      <td
        className={
          'px-4 py-3 text-sm font-mono font-semibold ' +
          (balance > 0
            ? 'text-rose-600 dark:text-rose-400'      // owes us
            : balance < 0
              ? 'text-emerald-600 dark:text-emerald-400'  // we owe them (credit balance)
              : 'text-slate-500')
        }
        dir="ltr"
        title={
          balance > 0
            ? 'العميل مدين لنا بهذا المبلغ'
            : balance < 0
              ? 'لدى العميل رصيد دائن'
              : 'لا يوجد رصيد'
        }
      >
        {fmtNum(balance)}
      </td>
      {!hide('disabled') && (
        <td className="px-4 py-3">
          <span
            className={
              'text-xs font-semibold px-2 py-0.5 rounded-full ' +
              (isActive
                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400')
            }
          >
            {isActive ? 'نشط' : 'معطل'}
          </span>
        </td>
      )}
      <td className="px-4 py-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white text-xs font-semibold rounded-lg transition"
          >
            الإجراءات
            <ChevronDown
              size={14}
              className={'transition-transform ' + (open ? 'rotate-180' : '')}
            />
          </button>
          {open && (
            <div className="absolute end-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 py-1 z-50">
              <MenuItem
                onClick={() => navigate(`/customers/${encodeURIComponent(c.name)}/statement`)}
                icon={<FileText size={16} />}
              >
                كشف حساب العميل
              </MenuItem>
              <MenuItem
                onClick={() => navigate(`/customers/${encodeURIComponent(c.name)}`)}
                icon={<Eye size={16} />}
              >
                تفاصيل العميل
              </MenuItem>
              <MenuItem
                onClick={() => navigate(`/customers/${encodeURIComponent(c.name)}/edit`)}
                icon={<Pencil size={16} />}
              >
                تحرير العميل
              </MenuItem>
              <div className="border-t border-slate-100 dark:border-white/5 my-1" />
              <MenuItem onClick={onDelete} icon={<Trash2 size={16} />} danger>
                حذف العميل
              </MenuItem>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function MenuItem({
  onClick,
  icon,
  children,
  danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={onClick}
      className={
        'flex items-center gap-2 w-full px-3 py-2 text-sm transition text-start ' +
        (danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5')
      }
    >
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
