/** Leave Applications list. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface LeaveRow {
  name: string;
  employee?: string;
  employee_name?: string;
  leave_type?: string;
  from_date?: string;
  to_date?: string;
  total_leave_days?: number;
  status?: string;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Open:      { label: 'قيد المراجعة', cls: 'bg-amber-100 text-amber-700' },
  Approved:  { label: 'موافق',         cls: 'bg-emerald-100 text-emerald-700' },
  Rejected:  { label: 'مرفوض',         cls: 'bg-red-100 text-red-700' },
  Cancelled: { label: 'ملغاة',         cls: 'bg-slate-100 text-slate-700' },
};

export default function LeaveListPage() {
  return (
    <RequirePerm doctype="Leave Application" action="read">
      <PageShell
        title="إدارة الإجازات"
        subtitle="طلبات الإجازات والموافقات"
        actions={
          <Link to="/hr/leaves/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
            <Plus size={16} /> طلب جديد
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
  const [status, setStatus] = useState('');

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (search.trim()) f.push(['employee_name', 'like', `%${search.trim()}%`]);
    if (status) f.push(['status', '=', status]);
    return f as any;
  }, [search, status]);

  const { data: rows, isLoading } = useFrappeGetDocList<LeaveRow>('Leave Application', {
    fields: ['name', 'employee', 'employee_name', 'leave_type', 'from_date', 'to_date', 'total_leave_days', 'status'],
    filters,
    limit: 100,
    orderBy: { field: 'modified', order: 'desc' },
  });

  const toolbarColumns: ToolbarColumn[] = useMemo(() => [
    { id: 'name', header: 'الرقم' },
    { id: 'employee_name', header: 'الموظف' },
    { id: 'leave_type', header: 'نوع الإجازة' },
    { id: 'from_date', header: 'من' },
    { id: 'to_date', header: 'إلى' },
    { id: 'total_leave_days', header: 'الأيام' },
    { id: 'status', header: 'الحالة' },
  ], []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(toolbarColumns.filter((c) => !hidden.has(c.id)).map((c) => c.id)), [toolbarColumns, hidden]);
  const hide = (id: string) => hidden.has(id);

  async function onDelete(name: string) {
    if (!confirm('حذف؟')) return;
    try { await deleteDoc('Leave Application', name); toast.success('تم'); window.location.reload(); } catch (e: any) { toast.error(e?.message); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالموظف..." className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
            <option value="">كل الحالات</option>
            <option value="Open">قيد المراجعة</option>
            <option value="Approved">موافق</option>
            <option value="Rejected">مرفوض</option>
            <option value="Cancelled">ملغاة</option>
          </select>
        </div>
      </div>

      <DataTableToolbar doctype="Leave Application" columns={toolbarColumns} rows={(rows ?? []) as unknown as Array<Record<string, unknown>>} visibleColumnIds={visibleIds} onVisibleColumnsChange={(next) => { const all = toolbarColumns.map((c) => c.id); setHidden(new Set(all.filter((id) => !next.has(id)))); }} />

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {!hide('name') && <Th>الرقم</Th>}
                {!hide('employee_name') && <Th>الموظف</Th>}
                {!hide('leave_type') && <Th>النوع</Th>}
                {!hide('from_date') && <Th>من</Th>}
                {!hide('to_date') && <Th>إلى</Th>}
                {!hide('total_leave_days') && <Th>الأيام</Th>}
                {!hide('status') && <Th>الحالة</Th>}
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (<tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!isLoading && (rows ?? []).length === 0 && (<tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد طلبات</td></tr>)}
              {(rows ?? []).map((r) => {
                const badge = STATUS_BADGE[r.status ?? ''] ?? { label: r.status ?? '—', cls: 'bg-slate-100 text-slate-700' };
                return (
                  <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    {!hide('name') && <td className="px-5 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)]">{r.name}</td>}
                    {!hide('employee_name') && <td className="px-5 py-3 text-sm">{r.employee_name ?? r.employee ?? '—'}</td>}
                    {!hide('leave_type') && <td className="px-5 py-3 text-sm">{r.leave_type ?? '—'}</td>}
                    {!hide('from_date') && <td className="px-5 py-3 text-sm text-slate-600">{r.from_date ?? '—'}</td>}
                    {!hide('to_date') && <td className="px-5 py-3 text-sm text-slate-600">{r.to_date ?? '—'}</td>}
                    {!hide('total_leave_days') && <td className="px-5 py-3 text-sm font-mono" dir="ltr">{r.total_leave_days ?? '—'}</td>}
                    {!hide('status') && <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span></td>}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => navigate(`/hr/leaves/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition"><Pencil size={16} /></button>
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
