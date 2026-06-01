/** SalesDocumentDetail — shared show page for invoice/order/quotation/return. */
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useFrappeGetDoc, useFrappeGetDocList, useFrappePostCall } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, ArrowRightLeft, CheckCircle, CreditCard, FileText, Pencil, Printer, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface VariantConfig {
  doctype: string;
  title: string;
  listPath: string;
  customerField: 'customer' | 'party_name';
  dateField: 'posting_date' | 'transaction_date';
}

const VARIANTS: Record<string, VariantConfig> = {
  invoice:   { doctype: 'Sales Invoice', title: 'فاتورة',   listPath: '/sales/invoices',   customerField: 'customer',   dateField: 'posting_date' },
  order:     { doctype: 'Sales Order',   title: 'أمر بيع',  listPath: '/sales/orders',     customerField: 'customer',   dateField: 'transaction_date' },
  quotation: { doctype: 'Quotation',     title: 'عرض سعر',  listPath: '/sales/quotations', customerField: 'party_name', dateField: 'transaction_date' },
  return:    { doctype: 'Sales Invoice', title: 'مرتجع',    listPath: '/sales/returns',    customerField: 'customer',   dateField: 'posting_date' },
};

interface SalesItem {
  name: string;
  item_code?: string;
  item_name?: string;
  qty?: number;
  rate?: number;
  amount?: number;
  uom?: string;
  description?: string;
}

interface SalesDoc {
  name: string;
  customer?: string;
  party_name?: string;
  posting_date?: string;
  transaction_date?: string;
  status?: string;
  docstatus?: 0 | 1 | 2;
  total?: number;
  discount_amount?: number;
  total_taxes_and_charges?: number;
  grand_total?: number;
  outstanding_amount?: number;
  remarks?: string;
  project?: string;
  cost_center?: string;
  set_warehouse?: string;
  items?: SalesItem[];
}

export default function SalesDocumentDetailPage({ variant }: { variant: keyof typeof VARIANTS }) {
  const cfg = VARIANTS[variant];
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: doc, isLoading, mutate: refreshDoc } = useFrappeGetDoc<SalesDoc>(cfg.doctype, id);
  const { call: submitCall, loading: submitting } = useFrappePostCall<{ message: unknown }>('frappe.client.submit');
  // Quotation → Sales Order
  const { call: makeOrderCall, loading: makingOrder } = useFrappePostCall<{ message: any }>('erpnext.selling.doctype.quotation.quotation.make_sales_order');
  // Sales Order → Sales Invoice
  const { call: makeInvoiceCall, loading: makingInvoice } = useFrappePostCall<{ message: any }>('erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice');
  // Insert mapped doc as draft
  const { call: insertCall } = useFrappePostCall<{ message: any }>('frappe.client.insert');
  const converting = makingOrder || makingInvoice;

  // Register Payment (for Sales Invoice)
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMop, setPayMop] = useState('Cash');
  const [registering, setRegistering] = useState(false);
  const { call: getPaymentEntryCall } = useFrappePostCall<{ message: any }>(
    'erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry',
  );
  const { call: saveAndSubmitCall } = useFrappePostCall<{ message: any }>('frappe.client.save_and_submit');
  const { data: mopList } = useFrappeGetDocList<{ name: string }>('Mode of Payment', {
    fields: ['name'],
    limit: 50,
  });

  async function registerPayment() {
    if (!doc) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error('أدخل مبلغاً صحيحاً'); return; }
    setRegistering(true);
    try {
      const res = await getPaymentEntryCall({
        dt: 'Sales Invoice',
        dn: doc.name,
        party_amount: amount,
        bank_account: '',
        bank_amount: 0,
      });
      const peData = res?.message;
      if (!peData) throw new Error('لم يتم الحصول على بيانات الدفعة');
      // Override mode_of_payment and adjust amounts
      peData.mode_of_payment = payMop;
      peData.paid_amount = amount;
      peData.received_amount = amount;
      // Fix allocated amount in references to match entered amount
      if (Array.isArray(peData.references) && peData.references.length > 0) {
        peData.references[0].allocated_amount = amount;
      }
      const saved = await saveAndSubmitCall({ doc: JSON.stringify(peData) });
      if (!saved?.message) throw new Error('فشل حفظ الدفعة');
      toast.success('تم تسجيل الدفعة وترحيلها بنجاح');
      setShowPayModal(false);
      void refreshDoc();
    } catch (e: any) {
      const msg = e?.exc ?? e?.message ?? 'تعذر تسجيل الدفعة';
      toast.error(msg);
    } finally {
      setRegistering(false);
    }
  }

  if (isLoading || !doc) {
    return <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-6 text-center text-sm text-slate-500">جاري التحميل...</div>;
  }

  const date = doc.posting_date ?? doc.transaction_date ?? '—';
  const customer = doc.customer ?? doc.party_name ?? '—';

  async function handleSubmit() {
    try {
      await submitCall({ doc: { ...doc, doctype: cfg.doctype } });
      toast.success('تم الترحيل بنجاح');
      void refreshDoc();
    } catch (e: any) {
      toast.error(e?.message ?? 'تعذر الترحيل');
    }
  }

  async function convertToOrder() {
    if (!doc) return;
    try {
      const res = await makeOrderCall({ source_name: doc.name });
      const mapped = res?.message;
      if (!mapped) { toast.error('لم يتم الحصول على بيانات أمر البيع'); return; }
      const saved = await insertCall({ doc: mapped });
      const newName = saved?.message?.name;
      toast.success('تم إنشاء أمر البيع');
      if (newName) navigate(`/sales/orders/${encodeURIComponent(newName)}`);
    } catch (e: any) {
      toast.error(e?.message ?? 'تعذر التحويل');
    }
  }

  async function convertToInvoice() {
    if (!doc) return;
    try {
      const res = await makeInvoiceCall({ source_name: doc.name });
      const mapped = res?.message;
      if (!mapped) { toast.error('لم يتم الحصول على بيانات الفاتورة'); return; }
      const saved = await insertCall({ doc: mapped });
      const newName = saved?.message?.name;
      toast.success('تم إنشاء فاتورة البيع');
      if (newName) navigate(`/sales/invoices/${encodeURIComponent(newName)}`);
    } catch (e: any) {
      toast.error(e?.message ?? 'تعذر التحويل');
    }
  }

  return (
    <RequirePerm doctype={cfg.doctype} action="read">
      <PageShell
        title={`${cfg.title}: ${doc.name}`}
        subtitle={customer}
        actions={
          <>
            {doc.docstatus === 0 && (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  <CheckCircle size={16} /> {submitting ? 'جاري الترحيل...' : 'ترحيل'}
                </button>
                <Link to={`${cfg.listPath}/${encodeURIComponent(doc.name)}/edit`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl transition-all">
                  <Pencil size={16} /> تعديل
                </Link>
              </>
            )}
            {/* Register Payment — Sales Invoice only when submitted and has outstanding amount */}
            {doc.docstatus === 1 && variant === 'invoice' && (doc.outstanding_amount ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => { setPayAmount(String(doc.outstanding_amount ?? '')); setShowPayModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
              >
                <CreditCard size={16} /> تسجيل دفعة
              </button>
            )}
            {/* Quotation → Sales Order (only when submitted) */}
            {doc.docstatus === 1 && variant === 'quotation' && (
              <button
                type="button"
                disabled={converting}
                onClick={convertToOrder}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <ArrowRightLeft size={16} /> {converting ? 'جاري...' : 'تحويل إلى أمر بيع'}
              </button>
            )}
            {/* Sales Order → Sales Invoice (only when submitted) */}
            {doc.docstatus === 1 && variant === 'order' && (
              <button
                type="button"
                disabled={converting}
                onClick={convertToInvoice}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <FileText size={16} /> {converting ? 'جاري...' : 'تحويل إلى فاتورة'}
              </button>
            )}
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 text-blue-600 text-sm font-semibold rounded-xl">
              <Printer size={16} /> طباعة
            </button>
            <button type="button" onClick={() => navigate(cfg.listPath)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all">
              <ArrowRight size={16} /> رجوع
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Header card */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Info label="الرقم" value={doc.name} mono />
              <Info label="التاريخ" value={date} />
              <Info label="العميل" value={customer} />
              <Info label="الحالة" value={doc.status ?? '—'} />
              {doc.project && <Info label="المشروع" value={doc.project} />}
              {doc.set_warehouse && <Info label="المخزن" value={doc.set_warehouse} />}
              {doc.cost_center && <Info label="مركز التكلفة" value={doc.cost_center} />}
              {doc.remarks && <Info label="ملاحظات" value={doc.remarks} span="full" />}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">الأصناف</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/[0.02]">
                  <tr className="text-xs font-bold text-slate-500 uppercase">
                    <Th>#</Th><Th>الصنف</Th><Th>الوحدة</Th><Th>الكمية</Th><Th>السعر</Th><Th>الإجمالي</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {(doc.items ?? []).map((it, i) => (
                    <tr key={it.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{it.item_name ?? it.item_code}</p>
                        {it.description && <p className="text-xs text-slate-400">{it.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{it.uom ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-mono" dir="ltr">{fmtNum(it.qty ?? 0)}</td>
                      <td className="px-4 py-3 text-sm font-mono" dir="ltr">{fmtNum(it.rate ?? 0)}</td>
                      <td className="px-4 py-3 text-sm font-mono font-semibold" dir="ltr">{fmtNum(it.amount ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Sum label="الإجمالي قبل الخصم" value={doc.total ?? 0} />
              <Sum label="إجمالي الخصم" value={doc.discount_amount ?? 0} color="red" />
              <Sum label="إجمالي الضريبة" value={doc.total_taxes_and_charges ?? 0} />
              <Sum label="الإجمالي النهائي" value={doc.grand_total ?? 0} color="brand" big />
              {variant === 'invoice' && doc.docstatus === 1 && (
                <Sum label="المبلغ المتبقي" value={doc.outstanding_amount ?? 0} color={(doc.outstanding_amount ?? 0) > 0 ? 'red' : 'slate'} />
              )}
            </div>
          </div>
        </div>

        {/* Register Payment Modal */}
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">تسجيل دفعة</h2>
                <button type="button" onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">الفاتورة</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{doc.name}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  المبلغ المدفوع <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={doc.outstanding_amount ?? undefined}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                  dir="ltr"
                />
                {(doc.outstanding_amount ?? 0) > 0 && (
                  <p className="text-xs text-slate-400 mt-1">المتبقي: {fmtNum(doc.outstanding_amount ?? 0)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">طريقة الدفع</label>
                <select
                  value={payMop}
                  onChange={(e) => setPayMop(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  {(mopList ?? [{ name: 'Cash' }]).map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={registering}
                  onClick={registerPayment}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {registering ? 'جاري التسجيل...' : 'تأكيد الدفعة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </RequirePerm>
  );
}

function Info({ label, value, mono, span }: { label: string; value: string; mono?: boolean; span?: 'full' }) {
  return (
    <div className={span === 'full' ? 'md:col-span-4' : ''}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={'text-sm font-semibold text-slate-800 dark:text-white ' + (mono ? 'font-mono' : '')} dir={mono ? 'ltr' : undefined}>{value}</p>
    </div>
  );
}
function Sum({ label, value, color = 'slate', big }: { label: string; value: number; color?: 'red' | 'brand' | 'slate'; big?: boolean }) {
  const txt = color === 'red' ? 'text-red-600' : color === 'brand' ? 'text-[color:var(--color-brand-600)]' : 'text-slate-800 dark:text-white';
  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`${big ? 'text-2xl' : 'text-lg'} font-bold ${txt} font-mono`} dir="ltr">{fmtNum(value)}</p>
    </div>
  );
}
function Th({ children }: { children?: React.ReactNode }) { return <th className="px-4 py-3 text-start whitespace-nowrap">{children}</th>; }
function fmtNum(n: number) { try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); } catch { return String(n); } }
