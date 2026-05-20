/** Treasuries page — card layout matching reference 188_Treasuries.png */
import { Link } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
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

function exportCSV(rows: TreasuryRow[]) {
  const header = 'الاسم,الشركة,الفرع,الحساب,العملة,الحالة';
  const lines = rows.map((r) => [r.treasury_name ?? r.name, r.company ?? '', r.branch ?? '', r.account ?? '', r.currency ?? '', r.is_active ? 'نشطة' : 'معطلة'].join(','));
  const blob = new Blob(['\uFEFF' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'treasuries.csv'; a.click(); URL.revokeObjectURL(url);
}

export default function Page() {
  const { data: rows, isLoading } = useFrappeGetDocList<TreasuryRow>('Madaar Treasury', {
    fields: ['name', 'treasury_name', 'company', 'branch', 'account', 'currency', 'is_active'],
    limit: 100,
  });

  const total = (rows ?? []).length;
  const currency = (rows ?? [])[0]?.currency ?? 'EGP';

  return (
    <RequirePerm doctype="Madaar Treasury" action="read">
      <PageShell
        title="الخزائن"
        subtitle="Cash Treasury Management"
        actions={
          <Link to="/treasury/treasuries/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
            <Plus size={16} /> خزينة جديدة
          </Link>
        }
      >
        <div className="space-y-6">
          {/* Total balance banner */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90 mb-1">Total Treasury Balance</p>
            <p className="text-4xl font-bold">
              {fmtAmt(0, currency)}
            </p>
          </div>

          {/* Cards */}
          {isLoading && <p className="text-center text-slate-400 py-12">جاري التحميل...</p>}
          {!isLoading && (rows ?? []).length === 0 && (
            <p className="text-center text-slate-400 py-12">لا توجد خزائن — أضف خزينة جديدة</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(rows ?? []).map((t) => (
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
                    <p className="text-xs text-amber-500 mb-0.5">Current Balance</p>
                    <p className="text-xl font-bold text-amber-600">0</p>
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
