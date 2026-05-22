/** SalesDocumentDetail — shared show page for invoice/order/quotation/return. */
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFrappeGetDoc, useFrappePostCall } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle, Pencil, Printer } from 'lucide-react';
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
            </div>
          </div>
        </div>
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
