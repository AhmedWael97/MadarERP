/** Salary Slips list. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface SlipRow {
  name: string;
  employee?: string;
  employee_name?: string;
  start_date?: string;
  end_date?: string;
  gross_pay?: number;
  total_deduction?: number;
  net_pay?: number;
  docstatus?: 0 | 1 | 2;
}

export default function PayrollListPage() {
  return (
    <RequirePerm doctype="Salary Slip" action="read">
      <PageShell
        title="مسيرات الرواتب"
        subtitle="مسيرات رواتب الموظفين"
        actions={
          <Link to="/hr/payroll/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
            <Plus size={16} /> مسير جديد
          </Link>
        }
      >
        <Body />
      </PageShell>
    </RequirePerm>
  );
}

function Body() {
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [search, setSearch] = useState('');

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (search.trim()) f.push(['employee_name', 'like', `%${search.trim()}%`]);
    return f as any;
  }, [search]);

  const { data: rows, isLoading } = useFrappeGetDocList<SlipRow>('Salary Slip', {
    fields: ['name', 'employee', 'employee_name', 'start_date', 'end_date', 'gross_pay', 'total_deduction', 'net_pay', 'docstatus'],
    filters,
    limit: 100,
    orderBy: { field: 'modified', order: 'desc' },
  });

  const toolbarColumns: ToolbarColumn[] = useMemo(() => [
    { id: 'name', header: 'الرقم' },
    { id: 'employee_name', header: 'الموظف' },
    { id: 'start_date', header: 'من' },
    { id: 'end_date', header: 'إلى' },
    { id: 'gross_pay', header: 'الاستحقاقات' },
    { id: 'total_deduction', header: 'الخصومات' },
    { id: 'net_pay', header: 'الصافي' },
    { id: 'docstatus', header: 'الحالة' },
  ], []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(toolbarColumns.filter((c) => !hidden.has(c.id)).map((c) => c.id)), [toolbarColumns, hidden]);
  const hide = (id: string) => hidden.has(id);

  async function onDelete(name: string) {
    if (!confirm('حذف؟')) return;
    try { await deleteDoc('Salary Slip', name); toast.success('تم'); window.location.reload(); } catch (e: any) { toast.error(e?.message); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="relative">
          <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالموظف..." className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
        </div>
      </div>

      <DataTableToolbar doctype="Salary Slip" columns={toolbarColumns} rows={(rows ?? []) as unknown as Array<Record<string, unknown>>} visibleColumnIds={visibleIds} onVisibleColumnsChange={(next) => { const all = toolbarColumns.map((c) => c.id); setHidden(new Set(all.filter((id) => !next.has(id)))); }} />

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {!hide('name') && <Th>الرقم</Th>}
                {!hide('employee_name') && <Th>الموظف</Th>}
                {!hide('start_date') && <Th>من</Th>}
                {!hide('end_date') && <Th>إلى</Th>}
                {!hide('gross_pay') && <Th>الاستحقاقات</Th>}
                {!hide('total_deduction') && <Th>الخصومات</Th>}
                {!hide('net_pay') && <Th>الصافي</Th>}
                {!hide('docstatus') && <Th>الحالة</Th>}
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (<tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!isLoading && (rows ?? []).length === 0 && (<tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد مسيرات</td></tr>)}
              {(rows ?? []).map((r) => {
                const status = r.docstatus === 1 ? { label: 'مرحّل', cls: 'bg-emerald-100 text-emerald-700' } : r.docstatus === 2 ? { label: 'ملغى', cls: 'bg-red-100 text-red-700' } : { label: 'مسودة', cls: 'bg-amber-100 text-amber-700' };
                return (
                  <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    {!hide('name') && <td className="px-5 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)]">{r.name}</td>}
                    {!hide('employee_name') && <td className="px-5 py-3 text-sm">{r.employee_name ?? r.employee ?? '—'}</td>}
                    {!hide('start_date') && <td className="px-5 py-3 text-sm text-slate-600">{r.start_date ?? '—'}</td>}
                    {!hide('end_date') && <td className="px-5 py-3 text-sm text-slate-600">{r.end_date ?? '—'}</td>}
                    {!hide('gross_pay') && <td className="px-5 py-3 text-sm font-mono" dir="ltr">{fmtNum(r.gross_pay ?? 0)}</td>}
                    {!hide('total_deduction') && <td className="px-5 py-3 text-sm font-mono text-red-600" dir="ltr">{fmtNum(r.total_deduction ?? 0)}</td>}
                    {!hide('net_pay') && <td className="px-5 py-3 text-sm font-mono font-bold text-[color:var(--color-brand-600)]" dir="ltr">{fmtNum(r.net_pay ?? 0)}</td>}
                    {!hide('docstatus') && <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span></td>}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => navigate(`/hr/payroll/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition"><Pencil size={16} /></button>
                        <button type="button" onClick={() => onDelete(r.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) { return <th className="px-5 py-3 text-start whitespace-nowrap">{children}</th>; }
function fmtNum(n: number) { try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); } catch { return String(n); } }
