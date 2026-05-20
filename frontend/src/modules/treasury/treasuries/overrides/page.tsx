/** Treasuries page — card layout matching reference 188_Treasuries.png.
 *  Top banner shows the live grand total across every treasury's linked
 *  GL Account (madaar_core.api_balances.get_account_balances). */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFrappeGetCall, useFrappeGetDocList } from 'frappe-react-sdk';
import { Plus, Banknote, BarChart2, FileDown, FileText } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface TreasuryRow {
  name: string;
  treasury_name?: string;
  company?: string;
  branch?: string;
  account?: string;
  currency?: string;
  is_active?: 0 | 1;
}

function fmtAmt(n: number, currency = 'EGP') {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n) + ' ' + currency;
}

function exportCSV(rows: TreasuryRow[], balances: Record<string, number>) {
  const header = 'الاسم,الشركة,الفرع,الحساب,العملة,الرصيد,الحالة';
  const lines = rows.map((r) => [r.treasury_name ?? r.name, r.company ?? '', r.branch ?? '', r.account ?? '', r.currency ?? '', balances[r.account ?? ''] ?? 0, r.is_active ? 'نشطة' : 'معطلة'].join(','));
  const blob = new Blob(['﻿' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'treasuries.csv'; a.click(); URL.revokeObjectURL(url);
}

export default function Page() {
  const { data: rows, isLoading } = useFrappeGetDocList<TreasuryRow>('Madaar Treasury', {
    fields: ['name', 'treasury_name', 'company', 'branch', 'account', 'currency', 'is_active'],
    limit: 100,
  });

  // Batch-fetch balances for every linked account in a single call.
  const accountList = useMemo(
    () => Array.from(new Set((rows ?? []).map((r) => r.account).filter(Boolean))) as string[],
    [rows],
  );
  const { data: balancesResp } = useFrappeGetCall<{ message: Record<string, number> }>(
    'madaar_core.api_balances.get_account_balances',
    { accounts: JSON.stringify(accountList) },
    accountList.length ? `balances:tre:${accountList.join(',')}` : null,
  );
  const balances = balancesResp?.message ?? {};

  const currency = (rows ?? [])[0]?.currency ?? 'EGP';
  const grandTotal = useMemo(
    () => Object.values(balances).reduce((s, n) => s + Number(n || 0), 0),
    [balances],
  );
  // Active vs disabled and currency mix — surfaced in the analysis row below
  // the hero banner.
  const counts = useMemo(() => {
    const r = rows ?? [];
    const active = r.filter((t) => Number(t.is_active ?? 0) === 1).length;
    const disabled = r.length - active;
    const currencies = new Set(r.map((t) => t.currency).filter(Boolean));
    return { active, disabled, currencies: currencies.size };
  }, [rows]);

  return (
    <RequirePerm doctype="Madaar Treasury" action="read">
      <PageShell
        title="الخزائن"
        subtitle="إدارة الخزائن النقدية والمتابعة"
        actions={
          <Link to="/treasury/treasuries/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
            <Plus size={16} /> خزينة جديدة
          </Link>
        }
      >
        <div className="space-y-6">
          {/* Total balance banner — live grand total across all treasuries. */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90 mb-1">إجمالي رصيد الخزائن</p>
            <p className="text-4xl font-bold">{fmtAmt(grandTotal, currency)}</p>
          </div>

          {/* Analysis cards — counts + currencies. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Mini title="عدد الخزائن" value={String((rows ?? []).length)} tone="brand" />
            <Mini title="نشطة" value={String(counts.active)} tone="emerald" />
            <Mini title="معطلة" value={String(counts.disabled)} tone="slate" />
            <Mini title="عدد العملات" value={String(counts.currencies || 1)} tone="violet" />
          </div>

          {/* Cards */}
          {isLoading && <p className="text-center text-slate-400 py-12">جاري التحميل...</p>}
          {!isLoading && (rows ?? []).length === 0 && (
            <p className="text-center text-slate-400 py-12">لا توجد خزائن — أضف خزينة جديدة</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(rows ?? []).map((t) => {
              const bal = Number(balances[t.account ?? ''] ?? 0);
              return (
                <Link key={t.name} to={`/treasury/treasuries/${encodeURIComponent(t.name)}/edit`}
                  className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 hover:shadow-md transition-all block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                      <Banknote size={20} className="text-amber-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      {t.branch && <span className="text-xs bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{t.branch}</span>}
                      <span className={`w-2.5 h-2.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{t.treasury_name ?? t.name}</h3>
                  {t.company && <p className="text-xs text-slate-400 mb-4">{t.company}</p>}
                  <div className="border-t border-slate-100 dark:border-white/5 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-500 mb-0.5">الرصيد الحالي</p>
                      <p className="text-xl font-bold text-amber-600">{fmtAmt(bal, t.currency ?? currency)}</p>
                    </div>
                    {t.account && <span className="text-xs text-slate-400" dir="ltr">{t.account}</span>}
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
