/**
 * Fiscal Year detail — periods + close/open + generate-from-template.
 *
 * Drives madaar_core.periods.{list_periods, generate_periods, set_period_closed}
 * so the same Accounting Period rows the user manages here are what blocks
 * transactions everywhere else in ERPNext.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFrappeGetCall, useFrappeGetDoc, useFrappePostCall } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Calendar, Lock, LockOpen, RefreshCcw, Sparkles } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface PeriodRow {
  name: string;
  period_name: string;
  start_date: string;
  end_date: string;
  company: string;
  closed: boolean;
  total_in: number;
  total_out: number;
}

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function fmtDate(d?: string) {
  if (!d) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return d;
  return `${parseInt(m[3],10)} ${AR_MONTHS[parseInt(m[2],10)-1]} ${m[1]}`;
}
function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export default function FiscalYearDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <RequirePerm doctype="Fiscal Year" action="read">
      <PageShell
        title={`السنة المالية: ${id ?? ''}`}
        subtitle="إدارة الفترات المحاسبية — افتح أو أغلق كل فترة لمنع المعاملات داخلها"
        actions={
          <button type="button" onClick={() => navigate('/accounting/fiscal-years')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        {id && <Body fiscalYear={id} />}
      </PageShell>
    </RequirePerm>
  );
}

function Body({ fiscalYear }: { fiscalYear: string }) {
  const { data: fy } = useFrappeGetDoc<{ name: string; year_start_date?: string; year_end_date?: string; disabled?: 0 | 1 }>(
    'Fiscal Year', fiscalYear, `fy:${fiscalYear}`,
  );

  const { data: resp, mutate: refresh, isLoading } = useFrappeGetCall<{ message: PeriodRow[] }>(
    'madaar_core.periods.list_periods',
    { fiscal_year: fiscalYear },
    `periods:${fiscalYear}`,
  );
  const periods = resp?.message ?? [];

  // Roll-ups for the hero strip.
  const totals = useMemo(() => {
    const tin = periods.reduce((s, p) => s + Number(p.total_in || 0), 0);
    const tout = periods.reduce((s, p) => s + Number(p.total_out || 0), 0);
    const closed = periods.filter((p) => p.closed).length;
    return { tin, tout, closed, open: periods.length - closed };
  }, [periods]);

  // Generate-periods modal state.
  const [showGen, setShowGen] = useState(false);
  const [periodMonths, setPeriodMonths] = useState<1 | 2 | 3 | 4 | 6 | 12>(1);
  const [replace, setReplace] = useState(false);
  const { call: doGenerate, loading: generating } = useFrappePostCall('madaar_core.periods.generate_periods');
  const { call: doToggle, loading: toggling } = useFrappePostCall('madaar_core.periods.set_period_closed');

  async function onGenerate() {
    try {
      const res: any = await doGenerate({ fiscal_year: fiscalYear, period_months: periodMonths, replace: replace ? 1 : 0 });
      const created = res?.message?.created?.length ?? 0;
      toast.success(`تم إنشاء ${created} فترة`);
      setShowGen(false);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? 'تعذر إنشاء الفترات');
    }
  }

  async function toggleClosed(p: PeriodRow) {
    const next = !p.closed;
    if (!confirm(next ? `إغلاق "${p.period_name}"؟ سيتم منع جميع المعاملات داخل هذه الفترة.` : `إعادة فتح "${p.period_name}"؟`)) return;
    try {
      await doToggle({ period_name: p.name, closed: next ? 1 : 0 });
      toast.success(next ? 'تم إغلاق الفترة' : 'تم إعادة فتح الفترة');
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? 'تعذر تغيير الحالة');
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 text-white shadow-lg">
        <p className="text-sm font-medium opacity-90 mb-1">{fiscalYear}</p>
        <p className="text-2xl font-bold mb-3">{fmtDate(fy?.year_start_date)} ← {fmtDate(fy?.year_end_date)}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          <Mini label="إجمالي الوارد" value={fmtMoney(totals.tin)} tone="white" />
          <Mini label="إجمالي الصادر" value={fmtMoney(totals.tout)} tone="white" />
          <Mini label="فترات مفتوحة" value={String(totals.open)} tone="white" />
          <Mini label="فترات مغلقة" value={String(totals.closed)} tone="white" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">الفترات المحاسبية</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => refresh()} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition">
            <RefreshCcw size={14} /> تحديث
          </button>
          <button onClick={() => setShowGen(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-white bg-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-700)] rounded-lg transition shadow-sm">
            <Sparkles size={14} /> إنشاء فترات
          </button>
        </div>
      </div>

      {/* Periods table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3 text-start">الفترة</th>
                <th className="px-5 py-3 text-start">من</th>
                <th className="px-5 py-3 text-start">إلى</th>
                <th className="px-5 py-3 text-start">إجمالي الوارد</th>
                <th className="px-5 py-3 text-start">إجمالي الصادر</th>
                <th className="px-5 py-3 text-start">الحالة</th>
                <th className="px-5 py-3 text-start">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">جاري التحميل...</td></tr>
              )}
              {!isLoading && periods.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">لا توجد فترات بعد — اضغط <span className="font-bold">«إنشاء فترات»</span> لتقسيم السنة المالية.</td></tr>
              )}
              {periods.map((p) => (
                <tr key={p.name} className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition ${p.closed ? 'bg-rose-50/40' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-white">{p.period_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{fmtDate(p.start_date)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{fmtDate(p.end_date)}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-emerald-600">{fmtMoney(p.total_in)}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-rose-600">{fmtMoney(p.total_out)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.closed ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.closed ? 'مغلقة' : 'مفتوحة'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleClosed(p)}
                      disabled={toggling}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition ${p.closed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
                    >
                      {p.closed ? <><LockOpen size={12} /> إعادة فتح</> : <><Lock size={12} /> إغلاق</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Periods Modal */}
      {showGen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">إنشاء فترات محاسبية</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              ستُقسم السنة المالية إلى فترات متساوية بحسب الطول المختار. كل فترة ستحمل قائمة افتراضية بالمستندات القابلة للإغلاق.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">طول الفترة</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPeriodMonths(m as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-bold transition ${periodMonths === m ? 'bg-[color:var(--color-brand-600)] text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}
                    >
                      {m === 1 ? 'شهر' : m === 12 ? 'سنة' : `${m} أشهر`}
                    </button>
                  ))}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
                <span className="text-sm text-slate-600 dark:text-slate-400">حذف الفترات الحالية وإعادة الإنشاء</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button type="button" onClick={() => setShowGen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 rounded-lg transition">
                إلغاء
              </button>
              <button type="button" onClick={onGenerate} disabled={generating} className="px-4 py-2 text-sm font-bold text-white bg-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-700)] disabled:opacity-50 rounded-lg transition shadow-sm">
                {generating ? '…' : 'إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone: 'white' | 'slate' }) {
  const cls = tone === 'white' ? 'text-white' : 'text-slate-800';
  return (
    <div className="rounded-xl bg-white/15 px-3 py-2.5">
      <p className="text-xs opacity-80 mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${cls}`}>{value}</p>
    </div>
  );
}
