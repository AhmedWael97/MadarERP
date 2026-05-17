/**
 * Customer account statement — matches reference Blade
 *   `H:/coupons/Madaar ERP/Madaar ERP/resources/views/customers/statement.blade.php`.
 *
 * Top-down sections:
 *   1. Header: back arrow, title, Excel/PDF/Print/Edit buttons
 *   2. Customer info card: avatar + name + code + type badges + contact grid
 *      Side panel: financial summary (credit/opening/sums/balance/usage bar)
 *   3. 4 quick stat cards (invoice/order/quotation/return counts)
 *   4. Transactions table — opening balance row + GL entries + totals footer
 *
 * Data sources:
 *   - Customer doc (custom Madaar fields)
 *   - GL Entry filtered by party_type=Customer + party=<name>
 *   - Counts: Sales Invoice / Sales Order / Quotation / Sales Invoice (returns)
 */
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useFrappeGetDoc,
  useFrappeGetDocCount,
  useFrappeGetDocList,
} from 'frappe-react-sdk';
import {
  ArrowRight,
  Download,
  FileSpreadsheet,
  FileText,
  Pencil,
  Printer,
  Receipt,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface CustomerDoc {
  name: string;
  customer_name?: string;
  customer_type?: 'Individual' | 'Company';
  tax_id?: string;
  payment_terms?: string;
  disabled?: 0 | 1;
  madaar_customer_code?: string;
  madaar_name_ar?: string;
  madaar_name_en?: string;
  madaar_city?: string;
  madaar_customer_category?: string;
  madaar_sales_person?: string;
  madaar_address?: string;
  madaar_phone?: string;
  madaar_mobile?: string;
  madaar_email?: string;
  madaar_credit_limit?: number;
  madaar_opening_balance?: number;
}

interface GLEntry {
  name: string;
  posting_date: string;
  voucher_type: string;
  voucher_no: string;
  debit: number;
  credit: number;
  remarks?: string;
}

const VOUCHER_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  'Sales Invoice': { label: 'فاتورة', cls: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  'Sales Order': { label: 'أمر بيع', cls: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  'Payment Entry': { label: 'سند قبض', cls: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
  'Journal Entry': { label: 'قيد', cls: 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300' },
  'Credit Note': { label: 'إشعار دائن', cls: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  Return: { label: 'مرتجع', cls: 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400' },
};

export default function CustomerStatementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: c, isLoading } = useFrappeGetDoc<CustomerDoc>('Customer', id);

  // Voucher counts (the 4 stat cards). Filter each doctype by customer.
  const { data: invCount } = useFrappeGetDocCount('Sales Invoice', [
    ['customer', '=', id ?? ''],
    ['is_return', '=', 0],
  ]);
  const { data: returnCount } = useFrappeGetDocCount('Sales Invoice', [
    ['customer', '=', id ?? ''],
    ['is_return', '=', 1],
  ]);
  const { data: orderCount } = useFrappeGetDocCount('Sales Order', [['customer', '=', id ?? '']]);
  const { data: quoteCount } = useFrappeGetDocCount('Quotation', [
    ['party_name', '=', id ?? ''],
    ['quotation_to', '=', 'Customer'],
  ]);

  // GL Entries for this customer. ERPNext writes a GL Entry for every posted
  // invoice / payment, with `party_type` + `party` filled in. This is the
  // closest analogue to the reference's union of all transactions.
  const { data: gl } = useFrappeGetDocList<GLEntry>('GL Entry', {
    fields: ['name', 'posting_date', 'voucher_type', 'voucher_no', 'debit', 'credit', 'remarks'],
    filters: id
      ? [
          ['party_type', '=', 'Customer'],
          ['party', '=', id],
          ['is_cancelled', '=', 0],
        ]
      : [],
    limit: 500,
    orderBy: { field: 'posting_date', order: 'asc' },
  });

  // Running balance: ERPNext convention has debit increase receivable (customer owes more)
  // and credit decrease it. So `balance = opening + Σ(debit - credit)`.
  const rows = useMemo(() => {
    if (!c) return [];
    let bal = Number(c.madaar_opening_balance ?? 0);
    const list = (gl ?? []).map((g) => {
      bal = bal + Number(g.debit ?? 0) - Number(g.credit ?? 0);
      return { ...g, runningBalance: bal };
    });
    return list;
  }, [c, gl]);

  const totals = useMemo(() => {
    const debit = (gl ?? []).reduce((s, g) => s + Number(g.debit ?? 0), 0);
    const credit = (gl ?? []).reduce((s, g) => s + Number(g.credit ?? 0), 0);
    const opening = Number(c?.madaar_opening_balance ?? 0);
    return {
      debit: debit + Math.max(opening, 0),
      credit: credit + Math.max(-opening, 0),
      currentBalance: opening + debit - credit,
    };
  }, [gl, c]);

  if (isLoading || !c) {
    return (
      <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-6 text-center text-sm text-slate-500">
        جاري التحميل...
      </div>
    );
  }

  const displayName = c.madaar_name_ar || c.customer_name || c.name;
  const isCompany = c.customer_type === 'Company';
  const isActive = !c.disabled;
  const initials = (displayName || '?').slice(0, 1);
  const creditLimit = Number(c.madaar_credit_limit ?? 0);
  const usagePct = creditLimit > 0
    ? Math.min((totals.currentBalance / creditLimit) * 100, 100)
    : 0;
  const usageColor = usagePct > 80 ? 'red' : usagePct > 50 ? 'amber' : 'emerald';

  return (
    <RequirePerm doctype="Customer" action="read">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 no-print">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition"
              aria-label="back"
            >
              <ArrowRight size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">كشف حساب العميل</h1>
              <p className="text-sm text-slate-500">عرض تفصيلي لجميع المعاملات المالية</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => toast('Excel export wiring is a TODO — coming with the financial-reports sweep.')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-xs font-bold rounded-xl transition"
            >
              <FileSpreadsheet size={16} />
              تحميل Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-bold rounded-xl transition"
            >
              <Download size={16} />
              تحميل PDF
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-xs font-bold rounded-xl transition"
            >
              <Printer size={16} />
              طباعة
            </button>
            <Link
              to={`/customers/${encodeURIComponent(c.name)}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all"
            >
              <Pencil size={16} />
              تعديل العميل
            </Link>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[color:var(--color-brand-500)]/20">
                  {initials}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{displayName}</h2>
                  {c.madaar_name_en && <p className="text-sm text-slate-500">{c.madaar_name_en}</p>}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[color:var(--color-brand-100,#d1fae5)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] font-mono">
                      {c.madaar_customer_code ?? c.name}
                    </span>
                    <span
                      className={
                        'text-xs font-semibold px-2.5 py-0.5 rounded-full ' +
                        (isCompany
                          ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600'
                          : 'bg-sky-100 dark:bg-sky-500/10 text-sky-600')
                      }
                    >
                      {isCompany ? 'شركة' : 'فرد'}
                    </span>
                    <span
                      className={
                        'text-xs font-semibold px-2.5 py-0.5 rounded-full ' +
                        (isActive
                          ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600'
                          : 'bg-red-100 dark:bg-red-500/10 text-red-600')
                      }
                    >
                      {isActive ? 'نشط' : 'معطل'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {c.madaar_phone && <Info label="الهاتف" value={c.madaar_phone} mono />}
                  {c.madaar_mobile && <Info label="الموبايل" value={c.madaar_mobile} mono />}
                  {c.madaar_email && <Info label="البريد الإلكتروني" value={c.madaar_email} />}
                  {c.tax_id && <Info label="الرقم الضريبي" value={c.tax_id} mono />}
                  {c.madaar_customer_category && <Info label="التصنيف" value={c.madaar_customer_category} />}
                  {c.payment_terms && <Info label="شروط الدفع" value={c.payment_terms} />}
                  {c.madaar_sales_person && <Info label="مندوب المبيعات" value={c.madaar_sales_person} />}
                  {c.madaar_address && (
                    <div className="col-span-2 md:col-span-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">العنوان</span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{c.madaar_address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/[0.02] rounded-2xl p-5 border border-slate-200/50 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">الملخص المالي</h3>
              <div className="space-y-3">
                <SumRow label="حد الائتمان" value={fmtNum(creditLimit)} />
                <SumRow label="الرصيد الافتتاحي" value={fmtNum(c.madaar_opening_balance ?? 0)} />
                <div className="border-t border-slate-200 dark:border-white/10 pt-3" />
                <SumRow label="إجمالي المدين" value={fmtNum(totals.debit)} valueClass="text-red-600" />
                <SumRow label="إجمالي الدائن" value={fmtNum(totals.credit)} valueClass="text-emerald-600" />
                <div className="border-t border-slate-200 dark:border-white/10 pt-3" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-700 dark:text-white">الرصيد الحالي</span>
                  <span
                    className={
                      'text-lg font-bold font-mono ' +
                      (totals.currentBalance > 0 ? 'text-red-600' : 'text-emerald-600')
                    }
                    dir="ltr"
                  >
                    {fmtNum(totals.currentBalance)} <span className="text-xs">ج.م</span>
                  </span>
                </div>
                {creditLimit > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">استخدام حد الائتمان</span>
                      <span className={`text-xs font-bold text-${usageColor}-600`}>{Math.round(usagePct)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2">
                      <div className={`h-2 rounded-full bg-${usageColor}-500 transition-all`} style={{ width: `${usagePct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="فواتير مبيعات" value={Number(invCount ?? 0)} icon={<Receipt size={20} />} color="emerald" />
          <StatCard label="أوامر بيع" value={Number(orderCount ?? 0)} icon={<ShoppingCart size={20} />} color="blue" />
          <StatCard label="عروض أسعار" value={Number(quoteCount ?? 0)} icon={<ShoppingBag size={20} />} color="amber" />
          <StatCard label="مرتجعات" value={Number(returnCount ?? 0)} icon={<RotateCcw size={20} />} color="orange" />
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">كشف الحساب التفصيلي</h3>
            <p className="text-xs text-slate-500 mt-0.5">جميع المعاملات المالية مرتبة حسب التاريخ</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/[0.02] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Th>التاريخ</Th>
                  <Th>النوع</Th>
                  <Th>المرجع</Th>
                  <Th>البيان</Th>
                  <Th>مدين</Th>
                  <Th>دائن</Th>
                  <Th>الرصيد</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {/* Opening Balance Row */}
                <tr className="bg-[color:var(--color-brand-50,#ecfdf5)]/50 dark:bg-[color:var(--color-brand-500)]/5">
                  <td className="px-5 py-3 text-sm text-slate-600">—</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[color:var(--color-brand-100,#d1fae5)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-700)]">
                      رصيد افتتاحي
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">—</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-800 dark:text-white">رصيد أول المدة</td>
                  <td className="px-5 py-3 text-sm font-mono font-semibold text-slate-800 dark:text-white">
                    {(c.madaar_opening_balance ?? 0) > 0 ? fmtNum(c.madaar_opening_balance ?? 0) : '—'}
                  </td>
                  <td className="px-5 py-3 text-sm font-mono font-semibold text-slate-800 dark:text-white">
                    {(c.madaar_opening_balance ?? 0) < 0 ? fmtNum(Math.abs(c.madaar_opening_balance ?? 0)) : '—'}
                  </td>
                  <td
                    className={
                      'px-5 py-3 text-sm font-mono font-bold ' +
                      ((c.madaar_opening_balance ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600')
                    }
                  >
                    {fmtNum(c.madaar_opening_balance ?? 0)}
                  </td>
                </tr>

                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                      لا توجد معاملات مالية لهذا العميل حتى الآن
                    </td>
                  </tr>
                ) : (
                  rows.map((g) => {
                    const badge = VOUCHER_TYPE_BADGE[g.voucher_type] ?? { label: g.voucher_type, cls: 'bg-slate-100 text-slate-700' };
                    return (
                      <tr key={g.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{g.posting_date}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm font-mono font-semibold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
                          {g.voucher_no}
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-800 dark:text-white">{g.remarks ?? '—'}</td>
                        <td
                          className={
                            'px-5 py-3 text-sm font-mono font-semibold ' +
                            (g.debit > 0 ? 'text-red-600' : 'text-slate-300')
                          }
                        >
                          {g.debit > 0 ? fmtNum(g.debit) : '—'}
                        </td>
                        <td
                          className={
                            'px-5 py-3 text-sm font-mono font-semibold ' +
                            (g.credit > 0 ? 'text-emerald-600' : 'text-slate-300')
                          }
                        >
                          {g.credit > 0 ? fmtNum(g.credit) : '—'}
                        </td>
                        <td
                          className={
                            'px-5 py-3 text-sm font-mono font-bold ' +
                            ((g as any).runningBalance > 0 ? 'text-red-600' : 'text-emerald-600')
                          }
                        >
                          {fmtNum((g as any).runningBalance)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-white/[0.03] border-t-2 border-slate-200 dark:border-white/10">
                  <td colSpan={4} className="px-5 py-3 text-sm font-bold text-slate-800 dark:text-white">
                    الإجمالي
                  </td>
                  <td className="px-5 py-3 text-sm font-mono font-bold text-red-600">{fmtNum(totals.debit)}</td>
                  <td className="px-5 py-3 text-sm font-mono font-bold text-emerald-600">{fmtNum(totals.credit)}</td>
                  <td
                    className={
                      'px-5 py-3 text-sm font-mono font-bold ' +
                      (totals.currentBalance > 0 ? 'text-red-600' : 'text-emerald-600')
                    }
                  >
                    {fmtNum(totals.currentBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </RequirePerm>
  );
}

// ─── Small primitives ────────────────────────────────────────────────────────

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <p
        className={'text-sm font-semibold text-slate-800 dark:text-white mt-1 ' + (mono ? 'font-mono' : '')}
        dir={mono ? 'ltr' : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function SumRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={'text-sm font-bold font-mono ' + (valueClass ?? 'text-slate-800 dark:text-white')}>
        {value}
      </span>
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
  value: number;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'amber' | 'orange';
}) {
  const palette = {
    emerald: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600',
    amber: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600',
    orange: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600',
  }[color];
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-4 text-center">
      <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${palette} flex items-center justify-center`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value.toLocaleString('en-US')}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-5 py-3 text-start whitespace-nowrap">{children}</th>;
}

function fmtNum(n: number): string {
  try {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(n);
  }
}

function toast(msg: string) {
  // Tiny inline notice — avoids pulling in the sonner toast on a non-blocking placeholder.
  // The Excel export is a real TODO and lives in the financial-reports sweep.
  // eslint-disable-next-line no-alert
  alert(msg);
}
