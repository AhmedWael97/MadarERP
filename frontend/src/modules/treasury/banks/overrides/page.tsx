/** Bank Accounts page — card layout matching reference 186_Bank-Accounts.png.
 *  Top banner shows the live grand total across every Bank Account's linked
 *  GL Account (madaar_core.api_balances.get_account_balances). */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFrappeGetCall, useFrappeGetDocList } from 'frappe-react-sdk';
import { Plus, Building2, BarChart2, FileDown, FileText } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface BankAccountRow {
  name: string;
  account_name?: string;
  bank?: string;
  bank_account_no?: string;
  account?: string;          // GL Account (Link → Account)
  account_currency?: string;
  account_type?: string;
  is_default?: 0 | 1;
  disabled?: 0 | 1;
}

function fmtAmt(n: number, currency = 'EGP') {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n) + ' ' + currency;
}

function exportCSV(rows: BankAccountRow[], balances: Record<string, number>) {
  const header = 'اسم الحساب,البنك,رقم الحساب,الحساب,الرصيد,العملة,افتراضي,الحالة';
  const lines = rows.map((r) => [r.account_name ?? r.name, r.bank ?? '', r.bank_account_no ?? '', r.account ?? '', balances[r.account ?? ''] ?? 0, r.account_currency ?? '', r.is_default ? 'نعم' : 'لا', r.disabled ? 'معطل' : 'نشط'].join(','));
  const blob = new Blob(['﻿' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bank-accounts.csv'; a.click(); URL.revokeObjectURL(url);
}

export default function Page() {
  const { data: rows, isLoading } = useFrappeGetDocList<BankAccountRow>('Bank Account', {
    fields: ['name', 'account_name', 'bank', 'bank_account_no', 'account', 'account_currency', 'account_type', 'is_default', 'disabled'],
    limit: 100,
  });

  const accountList = useMemo(
    () => Array.from(new Set((rows ?? []).map((r) => r.account).filter(Boolean))) as string[],
    [rows],
  );
  const { data: balancesResp } = useFrappeGetCall<{ message: Record<string, number> }>(
    'madaar_core.api_balances.get_account_balances',
    { accounts: JSON.stringify(accountList) },
    accountList.length ? `balances:bnk:${accountList.join(',')}` : null,
  );
  const balances = balancesResp?.message ?? {};
  const currency = (rows ?? [])[0]?.account_currency ?? 'EGP';
  const grandTotal = useMemo(
    () => Object.values(balances).reduce((s, n) => s + Number(n || 0), 0),
    [balances],
  );

  const counts = useMemo(() => {
    const r = rows ?? [];
    const active = r.filter((b) => !b.disabled).length;
    const disabled = r.length - active;
    const banks = new Set(r.map((b) => b.bank).filter(Boolean));
    return { active, disabled, banks: banks.size };
  }, [rows]);

  return (
    <RequirePerm doctype="Bank Account" action="read">
      <PageShell
        title="الحسابات البنكية"
        subtitle="إدارة الحسابات البنكية للشركة"
        actions={
          <Link to="/treasury/banks/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
            <Plus size={16} /> حساب بنكي
          </Link>
        }
      >
        <div className="space-y-6">
          {/* Total balance banner — live grand total across all bank accounts. */}
          <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 p-6 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90 mb-1">إجمالي رصيد البنوك</p>
            <p className="text-4xl font-bold">{fmtAmt(grandTotal, currency)}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Mini title="عدد الحسابات" value={String((rows ?? []).length)} tone="violet" />
            <Mini title="نشطة" value={String(counts.active)} tone="emerald" />
            <Mini title="معطلة" value={String(counts.disabled)} tone="slate" />
            <Mini title="عدد البنوك" value={String(counts.banks || 0)} tone="brand" />
          </div>

          {/* Cards */}
          {isLoading && <p className="text-center text-slate-400 py-12">جاري التحميل...</p>}
          {!isLoading && (rows ?? []).length === 0 && (
            <p className="text-center text-slate-400 py-12">لا توجد حسابات بنكية</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(rows ?? []).map((b) => {
              const bal = Number(balances[b.account ?? ''] ?? 0);
              return (
                <Link key={b.name} to={`/treasury/banks/${encodeURIComponent(b.name)}/edit`}
                  className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 hover:shadow-md transition-all block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                      <Building2 size={20} className="text-violet-600" />
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${!b.disabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-0.5">{b.account_name ?? b.name}</h3>
                  {b.bank && <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{b.bank}</p>}
                  {b.bank_account_no && <p className="text-xs font-mono text-slate-400 mb-4 ltr text-left">{b.bank_account_no}</p>}
                  <div className="border-t border-slate-100 dark:border-white/5 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-violet-500 mb-0.5">الرصيد الحالي</p>
                      <p className="text-xl font-bold text-violet-600">{fmtAmt(bal, b.account_currency ?? currency)}</p>
                    </div>
                    {b.account && <span className="text-xs text-slate-400" dir="ltr">{b.account}</span>}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Export */}
          <div className="flex items-center gap-3 pt-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 transition-all">
              <BarChart2 size={15} /> تصدير البيانات
            </button>
            <button onClick={() => exportCSV(rows ?? [], balances)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all">
              <FileDown size={15} /> تحميل Excel
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all">
              <FileText size={15} /> تحميل PDF
            </button>
          </div>
        </div>
      </PageShell>
    </RequirePerm>
  );
}

function Mini({ title, value, tone }: { title: string; value: string; tone: 'brand' | 'emerald' | 'slate' | 'violet' }) {
  const cls = {
    brand: 'text-[color:var(--color-brand-600)]',
    emerald: 'text-emerald-600',
    slate: 'text-slate-500',
    violet: 'text-violet-600',
  }[tone];
  return (
    <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-4 shadow-sm">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${cls}`}>{value}</p>
    </div>
  );
}
