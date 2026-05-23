/** Supplier account statement — mirrors CustomerStatement, but queries
 *  GL Entry with `party_type='Supplier'`. Voucher counts come from Purchase
 *  Invoice / Purchase Order / Supplier Quotation / Purchase Return. */
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFrappeGetDoc, useFrappeGetDocCount, useFrappeGetDocList } from 'frappe-react-sdk';
import {
  ArrowRight,
  Download,
  FileSpreadsheet,
  Pencil,
  Printer,
  Receipt,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface SupplierDoc {
  name: string;
  supplier_name?: string;
  supplier_type?: 'Individual' | 'Company';
  tax_id?: string;
  payment_terms?: string;
  disabled?: 0 | 1;
  madaar_supplier_code?: string;
  madaar_name_ar?: string;
  madaar_name_en?: string;
  madaar_city?: string;
  madaar_supplier_category?: string;
  madaar_address?: string;
  madaar_phone?: string;
  madaar_mobile?: string;
  madaar_email?: string;
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

const VOUCHER_BADGE: Record<string, { label: string; cls: string }> = {
  'Purchase Invoice': { label: 'فاتورة', cls: 'bg-emerald-100 text-emerald-700' },
  'Purchase Order': { label: 'أمر شراء', cls: 'bg-blue-100 text-blue-700' },
  'Payment Entry': { label: 'سند صرف', cls: 'bg-cyan-100 text-cyan-700' },
  'Journal Entry': { label: 'قيد', cls: 'bg-slate-100 text-slate-700' },
};

export default function SupplierStatementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: s, isLoading } = useFrappeGetDoc<SupplierDoc>('Supplier', id);

  const { data: invCount } = useFrappeGetDocCount('Purchase Invoice', [['supplier', '=', id ?? ''], ['is_return', '=', 0]]);
  const { data: returnCount } = useFrappeGetDocCount('Purchase Invoice', [['supplier', '=', id ?? ''], ['is_return', '=', 1]]);
  const { data: orderCount } = useFrappeGetDocCount('Purchase Order', [['supplier', '=', id ?? '']]);
  const { data: quoteCount } = useFrappeGetDocCount('Supplier Quotation', [['supplier', '=', id ?? '']]);

  const { data: gl } = useFrappeGetDocList<GLEntry>('GL Entry', {
    fields: ['name', 'posting_date', 'voucher_type', 'voucher_no', 'debit', 'credit', 'remarks'],
    filters: id ? [['party_type', '=', 'Supplier'], ['party', '=', id], ['is_cancelled', '=', 0]] : [],
    limit: 500,
    orderBy: { field: 'posting_date', order: 'asc' },
  });

  // For suppliers, debit/credit semantics flip vs Customer: credit increases
  // what the company OWES (it's a liability). Pure GL-driven, no opening_balance
  // seed — see the matching CustomerStatement comment for the rationale.
  const rows = useMemo(() => {
    let bal = 0;
    return (gl ?? []).map((g) => {
      bal = bal + Number(g.credit ?? 0) - Number(g.debit ?? 0);
      return { ...g, runningBalance: bal };
    });
  }, [gl]);

  const totals = useMemo(() => {
    const debit = (gl ?? []).reduce((acc, g) => acc + Number(g.debit ?? 0), 0);
    const credit = (gl ?? []).reduce((acc, g) => acc + Number(g.credit ?? 0), 0);
    return { debit, credit, currentBalance: credit - debit };
  }, [gl]);

  if (isLoading || !s) {
    return <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-6 text-center text-sm text-slate-500">جاري التحميل...</div>;
  }

  const displayName = s.madaar_name_ar || s.supplier_name || s.name;
  const isCompany = s.supplier_type === 'Company';
  const isActive = !s.disabled;
  const initials = (displayName || '?').slice(0, 1);

  return (
    <RequirePerm doctype="Supplier" action="read">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 no-print">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/suppliers')} className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition" aria-label="back">
              <ArrowRight size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">كشف حساب المورد</h1>
              <p className="text-sm text-slate-500">عرض تفصيلي لجميع المعاملات المالية</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => alert('Excel export — coming with the financial-reports sweep.')} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-xs font-bold rounded-xl transition">
              <FileSpreadsheet size={16} /> تحميل Excel
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-bold rounded-xl transition">
              <Download size={16} /> تحميل PDF
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-xs font-bold rounded-xl transition">
              <Printer size={16} /> طباعة
            </button>
            <Link to={`/suppliers/${encodeURIComponent(s.name)}/edit`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20">
              <Pencil size={16} /> تعديل المورد
            </Link>
          </div>
        </div>

        {/* Supplier Info Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[color:var(--color-brand-500)]/20">{initials}</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{displayName}</h2>
                  {s.madaar_name_en && <p className="text-sm text-slate-500">{s.madaar_name_en}</p>}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[color:var(--color-brand-100,#d1fae5)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] font-mono">{s.madaar_supplier_code ?? s.name}</span>
                    <span className={'text-xs font-semibold px-2.5 py-0.5 rounded-full ' + (isCompany ? 'bg-purple-100 text-purple-600' : 'bg-sky-100 text-sky-600')}>{isCompany ? 'شركة' : 'فرد'}</span>
                    <span className={'text-xs font-semibold px-2.5 py-0.5 rounded-full ' + (isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}>{isActive ? 'نشط' : 'معطل'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {s.madaar_phone && <Info label="الهاتف" value={s.madaar_phone} mono />}
                  {s.madaar_mobile && <Info label="الموبايل" value={s.madaar_mobile} mono />}
                  {s.madaar_email && <Info label="البريد الإلكتروني" value={s.madaar_email} />}
                  {s.tax_id && <Info label="الرقم الضريبي" value={s.tax_id} mono />}
                  {s.madaar_supplier_category && <Info label="التصنيف" value={s.madaar_supplier_category} />}
                  {s.payment_terms && <Info label="شروط الدفع" value={s.payment_terms} />}
                  {s.madaar_address && (
                    <div className="col-span-2 md:col-span-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">العنوان</span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{s.madaar_address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/[0.02] rounded-2xl p-5 border border-slate-200/50 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">الملخص المالي</h3>
              <div className="space-y-3">
                <SumRow label="الرصيد الافتتاحي" value={fmtNum(s.madaar_opening_balance ?? 0)} />
                <div className="border-t border-slate-200 dark:border-white/10 pt-3" />
                <SumRow label="إجمالي المدين" value={fmtNum(totals.debit)} valueClass="text-red-600" />
                <SumRow label="إجمالي الدائن" value={fmtNum(totals.credit)} valueClass="text-emerald-600" />
                <div className="border-t border-slate-200 dark:border-white/10 pt-3" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-700 dark:text-white">الرصيد الحالي</span>
                  <span className={'text-lg font-bold font-mono ' + (totals.currentBalance > 0 ? 'text-red-600' : 'text-emerald-600')} dir="ltr">
                    {fmtNum(totals.currentBalance)} <span className="text-xs">ج.م</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="فواتير مشتريات" value={Number(invCount ?? 0)} icon={<Receipt size={20} />} color="emerald" />
          <StatCard label="أوامر شراء" value={Number(orderCount ?? 0)} icon={<ShoppingCart size={20} />} color="blue" />
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
                  <Th>التاريخ</Th><Th>النوع</Th><Th>المرجع</Th><Th>البيان</Th><Th>مدين</Th><Th>دائن</Th><Th>الرصيد</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {/* No synthesised "Opening Balance" row — the ledger is pure
                    GL Entries. See matching comment in CustomerStatement. */}
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد معاملات مالية لهذا المورد حتى الآن</td></tr>
                ) : (
                  rows.map((g) => {
                    const badge = VOUCHER_BADGE[g.voucher_type] ?? { label: g.voucher_type, cls: 'bg-slate-100 text-slate-700' };
                    return (
                      <tr key={g.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{g.posting_date}</td>
                        <td className="px-5 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span></td>
                        <td className="px-5 py-3 text-sm font-mono font-semibold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">{g.voucher_no}</td>
                        <td className="px-5 py-3 text-sm text-slate-800 dark:text-white">{g.remarks ?? '—'}</td>
                        <td className={'px-5 py-3 text-sm font-mono font-semibold ' + (g.debit > 0 ? 'text-red-600' : 'text-slate-300')}>{g.debit > 0 ? fmtNum(g.debit) : '—'}</td>
                        <td className={'px-5 py-3 text-sm font-mono font-semibold ' + (g.credit > 0 ? 'text-emerald-600' : 'text-slate-300')}>{g.credit > 0 ? fmtNum(g.credit) : '—'}</td>
                        <td className={'px-5 py-3 text-sm font-mono font-bold ' + ((g as any).runningBalance > 0 ? 'text-red-600' : 'text-emerald-600')}>{fmtNum((g as any).runningBalance)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-white/[0.03] border-t-2 border-slate-200 dark:border-white/10">
                  <td colSpan={4} className="px-5 py-3 text-sm font-bold text-slate-800 dark:text-white">الإجمالي</td>
                  <td className="px-5 py-3 text-sm font-mono font-bold text-red-600">{fmtNum(totals.debit)}</td>
                  <td className="px-5 py-3 text-sm font-mono font-bold text-emerald-600">{fmtNum(totals.credit)}</td>
                  <td className={'px-5 py-3 text-sm font-mono font-bold ' + (totals.currentBalance > 0 ? 'text-red-600' : 'text-emerald-600')}>{fmtNum(totals.currentBalance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </RequirePerm>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <p className={'text-sm font-semibold text-slate-800 dark:text-white mt-1 ' + (mono ? 'font-mono' : '')} dir={mono ? 'ltr' : undefined}>{value}</p>
    </div>
  );
}
function SumRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={'text-sm font-bold font-mono ' + (valueClass ?? 'text-slate-800 dark:text-white')}>{value}</span>
    </div>
  );
}
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'emerald' | 'blue' | 'amber' | 'orange' }) {
  const palette = { emerald: 'bg-emerald-100 text-emerald-600', blue: 'bg-blue-100 text-blue-600', amber: 'bg-amber-100 text-amber-600', orange: 'bg-orange-100 text-orange-600' }[color];
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-4 text-center">
      <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${palette} flex items-center justify-center`}>{icon}</div>
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
