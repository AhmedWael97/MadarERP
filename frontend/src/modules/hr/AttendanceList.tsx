/** Attendance list. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface AttRow {
  name: string;
  employee?: string;
  employee_name?: string;
  attendance_date?: string;
  status?: string;
  in_time?: string;
  out_time?: string;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Present:    { label: 'حاضر',       cls: 'bg-emerald-100 text-emerald-700' },
  Absent:     { label: 'غائب',       cls: 'bg-red-100 text-red-700' },
  'On Leave': { label: 'إجازة',      cls: 'bg-amber-100 text-amber-700' },
  'Half Day': { label: 'نصف يوم',     cls: 'bg-blue-100 text-blue-700' },
  'Work From Home': { label: 'WFH',  cls: 'bg-purple-100 text-purple-700' },
};

export default function AttendanceListPage() {
  return (
    <RequirePerm doctype="Attendance" action="read">
      <PageShell
        title="سجل الحضور والانصراف"
        subtitle="سجلات الحضور اليومية للموظفين"
        actions={
          <Link to="/hr/attendance/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
            <Plus size={16} /> سجل جديد
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
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (search.trim()) f.push(['employee_name', 'like', `%${search.trim()}%`]);
    if (from) f.push(['attendance_date', '>=', from]);
    if (to) f.push(['attendance_date', '<=', to]);
    return f as any;
  }, [search, from, to]);

  const { data: rows, isLoading } = useFrappeGetDocList<AttRow>('Attendance', {
    fields: ['name', 'employee', 'employee_name', 'attendance_date', 'status', 'in_time', 'out_time'],
    filters,
    limit: 100,
    orderBy: { field: 'attendance_date', order: 'desc' },
  });

  const toolbarColumns: ToolbarColumn[] = useMemo(() => [
    { id: 'name', header: 'الرقم' },
    { id: 'employee_name', header: 'الموظف' },
    { id: 'attendance_date', header: 'التاريخ' },
    { id: 'in_time', header: 'وقت الحضور' },
    { id: 'out_time', header: 'وقت الانصراف' },
    { id: 'status', header: 'الحالة' },
  ], []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(toolbarColumns.filter((c) => !hidden.has(c.id)).map((c) => c.id)), [toolbarColumns, hidden]);
  const hide = (id: string) => hidden.has(id);

  async function onDelete(name: string) {
    if (!confirm('حذف؟')) return;
    try { await deleteDoc('Attendance', name); toast.success('تم'); window.location.reload(); } catch (e: any) { toast.error(e?.message); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالموظف..." className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          </div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
        </div>
      </div>

      <DataTableToolbar doctype="Attendance" columns={toolbarColumns} rows={(rows ?? []) as unknown as Array<Record<string, unknown>>} visibleColumnIds={visibleIds} onVisibleColumnsChange={(next) => { const all = toolbarColumns.map((c) => c.id); setHidden(new Set(all.filter((id) => !next.has(id)))); }} />

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {!hide('name') && <Th>الرقم</Th>}
                {!hide('employee_name') && <Th>الموظف</Th>}
                {!hide('attendance_date') && <Th>التاريخ</Th>}
                {!hide('in_time') && <Th>الحضور</Th>}
                {!hide('out_time') && <Th>الانصراف</Th>}
                {!hide('status') && <Th>الحالة</Th>}
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (<tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!isLoading && (rows ?? []).length === 0 && (<tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد سجلات</td></tr>)}
              {(rows ?? []).map((r) => {
                const badge = STATUS_BADGE[r.status ?? ''] ?? { label: r.status ?? '—', cls: 'bg-slate-100 text-slate-700' };
                return (
                  <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    {!hide('name') && <td className="px-5 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)]">{r.name}</td>}
                    {!hide('employee_name') && <td className="px-5 py-3 text-sm">{r.employee_name ?? r.employee ?? '—'}</td>}
                    {!hide('attendance_date') && <td className="px-5 py-3 text-sm text-slate-600">{r.attendance_date ?? '—'}</td>}
                    {!hide('in_time') && <td className="px-5 py-3 text-sm font-mono" dir="ltr">{r.in_time ?? '—'}</td>}
                    {!hide('out_time') && <td className="px-5 py-3 text-sm font-mono" dir="ltr">{r.out_time ?? '—'}</td>}
                    {!hide('status') && <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span></td>}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => navigate(`/hr/attendance/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition"><Pencil size={16} /></button>
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
