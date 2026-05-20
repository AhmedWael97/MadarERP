/** Bank Accounts page — card layout matching reference 186_Bank-Accounts.png */
import { Link } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { Plus, Building2, BarChart2, FileDown, FileText } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface BankAccountRow {
  name: string;
  account_name?: string;
  bank?: string;
  bank_account_no?: string;
  account_type?: string;
  is_default?: 0 | 1;
  disabled?: 0 | 1;
}

function exportCSV(rows: BankAccountRow[]) {
  const header = 'اسم الحساب,البنك,رقم الحساب,النوع,افتراضي,الحالة';
  const lines = rows.map((r) => [r.account_name ?? r.name, r.bank ?? '', r.bank_account_no ?? '', r.account_type ?? '', r.is_default ? 'نعم' : 'لا', r.disabled ? 'معطل' : 'نشط'].join(','));
  const blob = new Blob(['\uFEFF' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bank-accounts.csv'; a.click(); URL.revokeObjectURL(url);
}

export default function Page() {
  const { data: rows, isLoading } = useFrappeGetDocList<BankAccountRow>('Bank Account', {
    fields: ['name', 'account_name', 'bank', 'bank_account_no', 'account_type', 'is_default', 'disabled'],
    limit: 100,
  });

  return (
    <RequirePerm doctype="Bank Account" action="read">
      <PageShell
        title="الحسابات البنكية"
        subtitle="Company Bank Account Management"
        actions={
          <Link to="/treasury/banks/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
            <Plus size={16} /> حساب بنكي
          </Link>
        }
      >
        <div className="space-y-6">
          {/* Total balance banner */}
          <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 p-6 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90 mb-1">Total Bank Balances</p>
            <p className="text-4xl font-bold">0 EGP</p>
          </div>

          {/* Cards */}
          {isLoading && <p className="text-center text-slate-400 py-12">جاري التحميل...</p>}
          {!isLoading && (rows ?? []).length === 0 && (
            <p className="text-center text-slate-400 py-12">لا توجد حسابات بنكية</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(rows ?? []).map((b) => (
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
                    <p className="text-xs text-violet-500 mb-0.5">Current Balance</p>
                    <p className="text-xl font-bold text-violet-600">0</p>
                  </div>
                  <span className="text-xs text-slate-400">0 عملية</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Export */}
          <div className="flex items-center gap-3 pt-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 transition-all">
              <BarChart2 size={15} /> Export Data
            </button>
            <button onClick={() => exportCSV(rows ?? [])} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all">
              <FileDown size={15} /> Download Excel
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all">
              <FileText size={15} /> Download PDF
            </button>
          </div>
        </div>
      </PageShell>
    </RequirePerm>
  );
}
