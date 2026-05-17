import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFrappeGetDocList, useFrappeCreateDoc } from 'frappe-react-sdk';
import { Plus, Wallet, Receipt, Undo2, FolderTree, Search } from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';
import { StatCard } from '../components/erp/StatCard';

/**
 * Employee Custody (العهد) — fronts ERPNext's existing Employee Advance +
 * Expense Claim + Expense Claim Type (tree) doctypes. We don't introduce new
 * doctypes; we just surface them in a Madaar-style UI.
 *
 * The reference describes 4 flows on this page:
 *   1. List custodies (Employee Advance with outstanding > 0).
 *   2. Open a new custody (create Employee Advance).
 *   3. Record expenses against a custody (Expense Claim referencing the Advance).
 *   4. Return remaining balance (Payment Entry against the Advance).
 *
 * The :section param routes which view we render under /hr/employee-custody/*.
 */
export default function EmployeeCustody() {
  const { i18n } = useTranslation();
  const { section } = useParams<{ section?: string }>();
  const isAr = i18n.language === 'ar';

  const view = section || 'list';

  return (
    <PageShell
      title={isAr ? 'العهد المالية للموظفين' : 'Employee Custody'}
      subtitle={
        isAr
          ? 'صرف العهد، تسجيل المصروفات، وإرجاع الباقي'
          : 'Manage advances, record expenses, and return the remainder'
      }
      actions={
        view === 'list' && (
          <Link
            to="/hr/employee-custody/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[color:var(--color-brand-600)] text-white text-sm font-bold rounded-xl hover:bg-[color:var(--color-brand-700)] transition-all shadow-sm"
          >
            <Plus size={16} />
            {isAr ? 'فتح عهدة جديدة' : 'New custody'}
          </Link>
        )
      }
    >
      {view === 'list' && <CustodyList />}
      {view === 'create' && <CustodyCreate />}
      {view === 'expenses' && <CustodyExpenses />}
      {view === 'return' && <CustodyReturn />}
      {view === 'expense-tree' && <ExpenseTreeView />}
    </PageShell>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────
function CustodyList() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [query, setQuery] = useState('');

  const { data: advances } = useFrappeGetDocList<any>('Employee Advance', {
    fields: ['name', 'employee', 'employee_name', 'posting_date', 'advance_amount', 'paid_amount', 'claimed_amount', 'status', 'purpose'],
    filters: query ? [['employee_name', 'like', `%${query}%`]] : [],
    limit: 50,
    orderBy: { field: 'modified', order: 'desc' },
  });

  const totalAdvanced = (advances ?? []).reduce((s, r: any) => s + (Number(r.advance_amount) || 0), 0);
  const totalClaimed  = (advances ?? []).reduce((s, r: any) => s + (Number(r.claimed_amount) || 0), 0);
  const totalOpen     = totalAdvanced - totalClaimed;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard color="blue"  icon={<Wallet size={22} />}  label={isAr ? 'إجمالي المصروف' : 'Total advanced'} value={totalAdvanced.toLocaleString()} />
        <StatCard color="amber" icon={<Receipt size={22} />} label={isAr ? 'إجمالي المنصرف' : 'Total claimed'}  value={totalClaimed.toLocaleString()} />
        <StatCard color="emerald" icon={<Undo2 size={22} />} label={isAr ? 'المتبقي' : 'Remaining'}             value={totalOpen.toLocaleString()} />
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالموظف…' : 'Search by employee…'}
              className="w-full ps-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
            />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5">
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'الموظف' : 'Employee'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'الغرض' : 'Purpose'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'التاريخ' : 'Date'}</th>
              <th className="px-5 py-3 text-end text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'المبلغ' : 'Amount'}</th>
              <th className="px-5 py-3 text-end text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'المنصرف' : 'Claimed'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'الحالة' : 'Status'}</th>
              <th className="px-5 py-3 text-end text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
            {(advances ?? []).map((a: any) => (
              <tr key={a.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                <td className="px-5 py-3 font-medium">{a.employee_name || a.employee}</td>
                <td className="px-5 py-3 text-slate-500">{a.purpose}</td>
                <td className="px-5 py-3 text-slate-500">{a.posting_date}</td>
                <td className="px-5 py-3 text-end font-bold">{Number(a.advance_amount || 0).toLocaleString()}</td>
                <td className="px-5 py-3 text-end">{Number(a.claimed_amount || 0).toLocaleString()}</td>
                <td className="px-5 py-3"><StatusPill status={a.status} isAr={isAr} /></td>
                <td className="px-5 py-3 text-end">
                  <Link to={`/hr/employee-custody/expenses?advance=${encodeURIComponent(a.name)}`} className="text-xs text-[color:var(--color-brand-600)] font-bold">{isAr ? 'مصروفات' : 'Expenses'}</Link>
                  <span className="mx-2 text-slate-300">·</span>
                  <Link to={`/hr/employee-custody/return?advance=${encodeURIComponent(a.name)}`} className="text-xs text-amber-600 font-bold">{isAr ? 'إرجاع' : 'Return'}</Link>
                </td>
              </tr>
            ))}
            {(!advances || advances.length === 0) && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">{isAr ? 'لا توجد عهد بعد' : 'No advances yet'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StatusPill({ status, isAr }: { status?: string; isAr: boolean }) {
  const map: Record<string, { ar: string; en: string; cls: string }> = {
    'Draft':           { ar: 'مسودة',   en: 'Draft',     cls: 'bg-slate-100 text-slate-600' },
    'Paid':            { ar: 'مدفوعة',  en: 'Paid',      cls: 'bg-blue-100 text-blue-600' },
    'Unpaid':          { ar: 'غير مدفوعة', en: 'Unpaid', cls: 'bg-amber-100 text-amber-600' },
    'Claimed':         { ar: 'مغلقة',   en: 'Claimed',   cls: 'bg-emerald-100 text-emerald-600' },
    'Returned':        { ar: 'مستردة',  en: 'Returned',  cls: 'bg-violet-100 text-violet-600' },
    'Partly Claimed and Returned': { ar: 'جزئياً', en: 'Partly', cls: 'bg-cyan-100 text-cyan-600' },
  };
  const m = map[status || ''] ?? { ar: status || '—', en: status || '—', cls: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${m.cls}`}>{isAr ? m.ar : m.en}</span>;
}

// ─── Create new custody (Employee Advance) ────────────────────────────────────
function CustodyCreate() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { createDoc, loading } = useFrappeCreateDoc();
  const [form, setForm] = useState({
    employee: '',
    posting_date: new Date().toISOString().slice(0, 10),
    advance_amount: 0,
    purpose: '',
    mode_of_payment: 'Cash',
  });
  const [savedName, setSavedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const doc = await createDoc('Employee Advance', form);
      setSavedName((doc as any)?.name ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || String(err));
    }
  }

  if (savedName) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6">
        <h3 className="font-bold text-emerald-700 dark:text-emerald-300">{isAr ? 'تم فتح العهدة بنجاح' : 'Advance created successfully'}</h3>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{savedName}</p>
        <div className="mt-4 flex gap-2">
          <Link to="/hr/employee-custody" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">{isAr ? 'العودة للقائمة' : 'Back to list'}</Link>
          <Link to={`/hr/employee-custody/expenses?advance=${encodeURIComponent(savedName)}`} className="px-4 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-xl text-sm font-bold">{isAr ? 'إضافة مصروفات' : 'Add expenses'}</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-2xl bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6 space-y-4">
      <Field label={isAr ? 'الموظف' : 'Employee'}>
        <input required value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} placeholder="HR-EMP-00001" />
      </Field>
      <Field label={isAr ? 'التاريخ' : 'Posting date'}>
        <input type="date" required value={form.posting_date} onChange={(e) => setForm({ ...form, posting_date: e.target.value })} />
      </Field>
      <Field label={isAr ? 'مبلغ العهدة' : 'Advance amount'}>
        <input type="number" required min={0} step="0.01" value={form.advance_amount || ''} onChange={(e) => setForm({ ...form, advance_amount: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label={isAr ? 'الغرض' : 'Purpose'}>
        <textarea required rows={3} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
      </Field>
      <Field label={isAr ? 'طريقة الدفع' : 'Mode of payment'}>
        <select value={form.mode_of_payment} onChange={(e) => setForm({ ...form, mode_of_payment: e.target.value })}>
          <option value="Cash">Cash</option>
          <option value="Bank">Bank</option>
          <option value="Wire">Wire Transfer</option>
        </select>
      </Field>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={loading} className="w-full py-3 bg-[color:var(--color-brand-600)] text-white rounded-xl font-bold hover:bg-[color:var(--color-brand-700)] disabled:opacity-60">
        {loading ? (isAr ? 'جاري الحفظ…' : 'Saving…') : isAr ? 'فتح العهدة' : 'Open custody'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

// ─── Expenses against a custody (Expense Claim) ───────────────────────────────
function CustodyExpenses() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const params = new URLSearchParams(window.location.search);
  const advance = params.get('advance') ?? '';

  const { data: claims } = useFrappeGetDocList<any>('Expense Claim', {
    fields: ['name', 'employee', 'employee_name', 'posting_date', 'total_claimed_amount', 'approval_status', 'status'],
    filters: advance ? [['employee_advance', '=', advance]] : [],
    limit: 50,
    orderBy: { field: 'modified', order: 'desc' },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/50 text-blue-700 dark:text-blue-300 p-3 text-xs">
        {isAr
          ? `كل مصروف هنا هو "Expense Claim" مرتبط بالعهدة ${advance || ''}. اضغط على الزر لإنشاء مطالبة جديدة.`
          : `Each row below is an Expense Claim linked to advance ${advance || ''}. Click below to create a new claim.`}
      </div>
      <Link
        to={advance ? `/hr/expense-claims/new?advance=${encodeURIComponent(advance)}` : '/hr/expense-claims/new'}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl"
      >
        <Plus size={16} /> {isAr ? 'مطالبة مصروفات جديدة' : 'New expense claim'}
      </Link>
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5">
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'الموظف' : 'Employee'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'التاريخ' : 'Date'}</th>
              <th className="px-5 py-3 text-end text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'المبلغ' : 'Amount'}</th>
              <th className="px-5 py-3 text-start text-xs font-bold text-slate-500 uppercase tracking-wider">{isAr ? 'الحالة' : 'Status'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
            {(claims ?? []).map((c: any) => (
              <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                <td className="px-5 py-3 font-medium">{c.employee_name || c.employee}</td>
                <td className="px-5 py-3 text-slate-500">{c.posting_date}</td>
                <td className="px-5 py-3 text-end font-bold">{Number(c.total_claimed_amount || 0).toLocaleString()}</td>
                <td className="px-5 py-3"><StatusPill status={c.status} isAr={isAr} /></td>
              </tr>
            ))}
            {(!claims || claims.length === 0) && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">{isAr ? 'لا توجد مصروفات بعد' : 'No expense claims yet'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Return remaining (Payment Entry) ─────────────────────────────────────────
function CustodyReturn() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 p-8">
      <h3 className="text-lg font-bold mb-2">{isAr ? 'إرجاع باقي العهدة' : 'Return remaining custody'}</h3>
      <p className="text-sm text-slate-500 mb-4">
        {isAr
          ? 'يستخدم هذا قيد دفع (Payment Entry) عكسي بحساب الموظف لإقفال العهدة.'
          : 'Uses a reversing Payment Entry against the employee account to close the custody.'}
      </p>
      <a
        href="/app/payment-entry/new?payment_type=Receive&party_type=Employee"
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl"
        target="_blank"
        rel="noreferrer"
      >
        <Undo2 size={16} />
        {isAr ? 'فتح Payment Entry للإرجاع' : 'Open Payment Entry for return'}
      </a>
    </div>
  );
}

// ─── Expense type tree (admin) ────────────────────────────────────────────────
function ExpenseTreeView() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { data: types } = useFrappeGetDocList<any>('Expense Claim Type', {
    fields: ['name', 'parent_expense_claim_type', 'is_group'],
    limit: 500,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200/50 text-violet-700 dark:text-violet-300 p-3 text-xs flex items-center gap-2">
        <FolderTree size={14} />
        {isAr
          ? 'أنواع المصروفات تستخدم كشجرة لتصنيف العهد. يتحكم بها المسؤول.'
          : 'Expense types form a tree the admin controls; assigned to expense claim rows.'}
      </div>
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 p-4">
        <ul className="text-sm space-y-1">
          {(types ?? []).map((t: any) => (
            <li key={t.name} className={t.is_group ? 'font-bold' : 'ps-4 text-slate-600 dark:text-slate-300'}>
              {t.is_group ? '📁 ' : '• '}{t.name}
            </li>
          ))}
          {(!types || types.length === 0) && (
            <li className="text-slate-400">{isAr ? 'لا توجد أنواع مصروفات.' : 'No expense types yet.'}</li>
          )}
        </ul>
        <a
          href="/app/expense-claim-type/new"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[color:var(--color-brand-600)] text-white text-sm font-bold rounded-xl"
        >
          <Plus size={16} />
          {isAr ? 'إضافة نوع جديد' : 'Add expense type'}
        </a>
      </div>
    </div>
  );
}
