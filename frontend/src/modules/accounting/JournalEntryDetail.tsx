/** Journal Entry show page — reference layout: header card + lines table + status pills. */
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFrappeGetDoc } from 'frappe-react-sdk';
import { ArrowRight, Pencil, Printer } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface JELine {
  name: string;
  account?: string;
  account_currency?: string;
  debit_in_account_currency?: number;
  credit_in_account_currency?: number;
  user_remark?: string;
  cost_center?: string;
}

interface JEDoc {
  name: string;
  posting_date?: string;
  user_remark?: string;
  cost_center?: string;
  docstatus?: 0 | 1 | 2;
  total_debit?: number;
  total_credit?: number;
  accounts?: JELine[];
}

export default function JournalEntryDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: je, isLoading } = useFrappeGetDoc<JEDoc>('Journal Entry', id);

  if (isLoading || !je) {
    return <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-6 text-center text-sm text-slate-500">جاري التحميل...</div>;
  }

  const status = je.docstatus === 1 ? 'posted' : je.docstatus === 2 ? 'cancelled' : 'draft';
  const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    draft: { label: 'مسودة', cls: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700' },
    posted: { label: 'مرحّل', cls: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700' },
    cancelled: { label: 'ملغى', cls: 'bg-red-100 dark:bg-red-500/10 text-red-700' },
  };
  const totalDebit = useMemo(() => (je.accounts ?? []).reduce((s, l) => s + Number(l.debit_in_account_currency ?? 0), 0), [je.accounts]);
  const totalCredit = useMemo(() => (je.accounts ?? []).reduce((s, l) => s + Number(l.credit_in_account_currency ?? 0), 0), [je.accounts]);

  return (
    <RequirePerm doctype="Journal Entry" action="read">
      <PageShell
        title={`قيد رقم: ${je.name}`}
        subtitle={je.user_remark ?? ''}
        actions={
          <>
            {status === 'draft' && (
              <Link to={`/accounting/journal-entries/${encodeURIComponent(je.name)}/edit`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl transition-all">
                <Pencil size={16} /> تعديل
              </Link>
            )}
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 text-blue-600 text-sm font-semibold rounded-xl">
              <Printer size={16} /> طباعة
            </button>
            <button type="button" onClick={() => navigate('/accounting/journal-entries')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all">
              <ArrowRight size={16} /> رجوع
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Info label="رقم القيد" value={je.name} mono />
              <Info label="التاريخ" value={je.posting_date ?? '—'} />
              <Info label="مركز التكلفة" value={je.cost_center ?? '—'} />
              <div>
                <p className="text-xs text-slate-500 mb-1">الحالة</p>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[status].cls}`}>{STATUS_BADGE[status].label}</span>
              </div>
              <Info label="الوصف" value={je.user_remark ?? '—'} span="full" />
            </div>
          </div>

          {/* Lines */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">خطوط القيد</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/[0.02]">
                  <tr className="text-xs font-bold text-slate-500 uppercase">
                    <Th>#</Th><Th>الحساب</Th><Th>مدين</Th><Th>دائن</Th><Th>البيان</Th><Th>مركز التكلفة</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {(je.accounts ?? []).map((l, i) => (
                    <tr key={l.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{l.account ?? '—'}</td>
                      <td className={'px-4 py-3 text-sm font-mono ' + ((l.debit_in_account_currency ?? 0) > 0 ? 'font-semibold' : 'text-slate-300')} dir="ltr">{(l.debit_in_account_currency ?? 0) > 0 ? fmtNum(l.debit_in_account_currency ?? 0) : '—'}</td>
                      <td className={'px-4 py-3 text-sm font-mono ' + ((l.credit_in_account_currency ?? 0) > 0 ? 'font-semibold' : 'text-slate-300')} dir="ltr">{(l.credit_in_account_currency ?? 0) > 0 ? fmtNum(l.credit_in_account_currency ?? 0) : '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{l.user_remark ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{l.cost_center ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-white/[0.03] border-t-2 border-slate-200 dark:border-white/10 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-sm">الإجمالي</td>
                    <td className="px-4 py-3 text-sm font-mono">{fmtNum(totalDebit)}</td>
                    <td className="px-4 py-3 text-sm font-mono">{fmtNum(totalCredit)}</td>
                    <td colSpan={2} className={'px-4 py-3 text-xs ' + (Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-emerald-600' : 'text-red-600')}>
                      {Math.abs(totalDebit - totalCredit) < 0.01 ? 'متوازن ✓' : `فرق: ${fmtNum(Math.abs(totalDebit - totalCredit))}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
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
function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-start whitespace-nowrap">{children}</th>;
}
function fmtNum(n: number): string {
  try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); } catch { return String(n); }
}
