/**
 * Journal Entry create / edit form — matches reference Blade
 *   `accounting/journal-entries/form.blade.php`.
 *
 * Headers + a debit/credit lines table that enforces balance before submit.
 * ERPNext doctype: Journal Entry. Maps:
 *   date         → posting_date
 *   description  → user_remark
 *   cost_center  → cost_center on each line OR header (we put it on header)
 *   lines[]      → accounts (child table "Journal Entry Account")
 *     account_id    → account
 *     debit         → debit_in_account_currency
 *     credit        → credit_in_account_currency
 *     description   → user_remark (per-line)
 *     cost_center   → cost_center
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, AlertCircle, CheckCircle2, Plus, Trash2, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, extractFrappeError } from './AccountForm';

interface JELine {
  account?: string;
  debit_in_account_currency?: number;
  credit_in_account_currency?: number;
  user_remark?: string;
  cost_center?: string;
}

interface JEDoc {
  name?: string;
  posting_date?: string;
  user_remark?: string;
  cost_center?: string;
  accounts?: JELine[];
}

export default function JournalEntryFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Journal Entry" action="read">
      <PageShell
        title={isEdit ? `تعديل قيد: ${id ?? ''}` : 'إنشاء قيد يدوي جديد'}
        subtitle="أدخل بيانات القيد المحاسبي مع خطوطه"
        actions={
          <button type="button" onClick={() => navigate('/accounting/journal-entries')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/accounting/journal-entries')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);
  const [doc, setDoc] = useState<JEDoc>({ posting_date: today, accounts: [emptyLine(), emptyLine()] });
  const { data: existing } = useFrappeGetDoc<JEDoc>('Journal Entry', isEdit ? name : undefined, isEdit && name ? `je:${name}` : null);
  useEffect(() => { if (existing) setDoc((d) => ({ ...d, ...existing, accounts: existing.accounts ?? d.accounts })); }, [existing]);

  const { data: accounts } = useFrappeGetDocList<{ name: string; account_name?: string; account_number?: string }>('Account', {
    fields: ['name', 'account_name', 'account_number'],
    filters: [['is_group', '=', 0], ['disabled', '=', 0]],
    limit: 500,
    orderBy: { field: 'account_number', order: 'asc' },
  });
  const { data: costCenters } = useFrappeGetDocList<{ name: string }>('Cost Center', { fields: ['name'], limit: 100 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  const totalDebit = useMemo(() => (doc.accounts ?? []).reduce((s, l) => s + Number(l.debit_in_account_currency ?? 0), 0), [doc.accounts]);
  const totalCredit = useMemo(() => (doc.accounts ?? []).reduce((s, l) => s + Number(l.credit_in_account_currency ?? 0), 0), [doc.accounts]);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  function setLine(idx: number, patch: Partial<JELine>) {
    setDoc((d) => {
      const next = [...(d.accounts ?? [])];
      next[idx] = { ...next[idx], ...patch };
      // Mutex debit/credit: typing one zeroes the other.
      if (patch.debit_in_account_currency !== undefined && Number(patch.debit_in_account_currency) > 0) next[idx].credit_in_account_currency = 0;
      if (patch.credit_in_account_currency !== undefined && Number(patch.credit_in_account_currency) > 0) next[idx].debit_in_account_currency = 0;
      return { ...d, accounts: next };
    });
  }
  function addLine() { setDoc((d) => ({ ...d, accounts: [...(d.accounts ?? []), emptyLine()] })); }
  function removeLine(idx: number) { setDoc((d) => ({ ...d, accounts: (d.accounts ?? []).filter((_, i) => i !== idx) })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isBalanced) {
      toast.error('القيد غير متوازن — يجب أن يتساوى المدين والدائن');
      return;
    }
    const payload: Record<string, unknown> = {
      posting_date: doc.posting_date,
      user_remark: doc.user_remark,
      cost_center: doc.cost_center,
      accounts: (doc.accounts ?? [])
        .filter((l) => l.account && (Number(l.debit_in_account_currency) > 0 || Number(l.credit_in_account_currency) > 0))
        .map((l) => ({
          account: l.account,
          debit_in_account_currency: Number(l.debit_in_account_currency ?? 0),
          credit_in_account_currency: Number(l.credit_in_account_currency ?? 0),
          user_remark: l.user_remark,
          cost_center: l.cost_center,
        })),
    };
    try {
      if (isEdit && name) {
        await updateDoc('Journal Entry', name, payload);
        toast.success('تحديث القيد');
      } else {
        await createDoc('Journal Entry', payload);
        toast.success('حفظ القيد');
      }
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="بيانات القيد" subtitle="المعلومات الأساسية للقيد">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="التاريخ" required>
            <input type="date" required value={doc.posting_date ?? ''} onChange={(e) => setDoc((d) => ({ ...d, posting_date: e.target.value }))} className={INPUT} />
          </Field>
          <div className="md:col-span-2">
            <Field label="الوصف" required>
              <input type="text" required placeholder="وصف القيد المحاسبي" value={doc.user_remark ?? ''} onChange={(e) => setDoc((d) => ({ ...d, user_remark: e.target.value }))} className={INPUT} />
            </Field>
          </div>
          <Field label="مركز التكلفة">
            <select value={doc.cost_center ?? ''} onChange={(e) => setDoc((d) => ({ ...d, cost_center: e.target.value }))} className={INPUT}>
              <option value="">— بدون —</option>
              {(costCenters ?? []).map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
            </select>
          </Field>
        </div>
      </Card>

      {/* Lines */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">خطوط القيد</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">أضف حسابين على الأقل مع التأكد من تساوي المدين والدائن</p>
          </div>
          <button type="button" onClick={addLine} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[color:var(--color-brand-100,#d1fae5)] dark:bg-[color:var(--color-brand-500)]/10 hover:bg-[color:var(--color-brand-200,#a7f3d0)] dark:hover:bg-[color:var(--color-brand-500)]/20 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] text-xs font-semibold rounded-lg transition-colors">
            <Plus size={14} /> إضافة سطر
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5">
                <th className="px-4 py-3 text-start text-xs font-bold text-slate-500 uppercase w-10">#</th>
                <th className="px-4 py-3 text-start text-xs font-bold text-slate-500 uppercase min-w-[250px]">الحساب *</th>
                <th className="px-4 py-3 text-start text-xs font-bold text-slate-500 uppercase w-32">مدين</th>
                <th className="px-4 py-3 text-start text-xs font-bold text-slate-500 uppercase w-32">دائن</th>
                <th className="px-4 py-3 text-start text-xs font-bold text-slate-500 uppercase min-w-[150px]">البيان</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {(doc.accounts ?? []).map((line, idx) => (
                <tr key={idx} className="border-b border-slate-50 dark:border-white/[0.02]">
                  <td className="px-4 py-2 text-slate-400 font-mono text-xs">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <select required value={line.account ?? ''} onChange={(e) => setLine(idx, { account: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]">
                      <option value="">اختر حساب</option>
                      {(accounts ?? []).map((a) => (<option key={a.name} value={a.name}>{a.account_number ?? ''} — {a.account_name ?? a.name}</option>))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" step="0.01" min={0} dir="ltr" placeholder="0.00" value={line.debit_in_account_currency ?? ''} onChange={(e) => setLine(idx, { debit_in_account_currency: e.target.value === '' ? 0 : Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" step="0.01" min={0} dir="ltr" placeholder="0.00" value={line.credit_in_account_currency ?? ''} onChange={(e) => setLine(idx, { credit_in_account_currency: e.target.value === '' ? 0 : Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="text" placeholder="بيان اختياري" value={line.user_remark ?? ''} onChange={(e) => setLine(idx, { user_remark: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)]" />
                  </td>
                  <td className="px-4 py-2">
                    {(doc.accounts ?? []).length > 2 && (
                      <button type="button" onClick={() => removeLine(idx)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition" aria-label="remove">
                        <X size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-white/10">
                <td className="px-4 py-3 font-bold text-slate-800 dark:text-white" colSpan={2}>الإجمالي</td>
                <td className={'px-4 py-3 font-mono font-bold text-sm ' + (isBalanced ? 'text-emerald-600' : 'text-red-600')}>{totalDebit.toFixed(2)}</td>
                <td className={'px-4 py-3 font-mono font-bold text-sm ' + (isBalanced ? 'text-emerald-600' : 'text-red-600')}>{totalCredit.toFixed(2)}</td>
                <td className="px-4 py-3 text-center" colSpan={2}>
                  {isBalanced ? (
                    <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                      <CheckCircle2 size={14} /> متوازن
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-red-600 inline-flex items-center gap-1">
                      <AlertCircle size={14} /> فرق: {Math.abs(totalDebit - totalCredit).toFixed(2)}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
          <button type="button" onClick={onDone} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
            <Trash2 size={16} /> إلغاء
          </button>
          <button
            type="submit"
            disabled={!isBalanced || saving}
            className={'inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all ' + (isBalanced ? 'bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] shadow-lg shadow-[color:var(--color-brand-500)]/20' : 'bg-gradient-to-r from-slate-300 to-slate-400 cursor-not-allowed')}
          >
            {isEdit ? 'تحديث القيد' : 'حفظ القيد'}
          </button>
        </div>
      </div>
    </form>
  );
}

function emptyLine(): JELine {
  return { account: '', debit_in_account_currency: 0, credit_in_account_currency: 0, user_remark: '', cost_center: '' };
}
