/** Employees list — stats + filters + table + toolbar. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocCount, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2, UserCheck, Users, UserX } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface EmpRow {
  name: string;
  employee_name?: string;
  designation?: string;
  department?: string;
  date_of_joining?: string;
  status?: string;
  cell_number?: string;
}

export default function EmployeeListPage() {
  return (
    <RequirePerm doctype="Employee" action="read">
      <PageShell
        title="الموظفون"
        subtitle="إدارة الموظفين والمسؤوليات"
        actions={
          <Link to="/hr/employees/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
            <Plus size={16} /> موظف جديد
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
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');

  const { data: total } = useFrappeGetDocCount('Employee');
  const { data: active } = useFrappeGetDocCount('Employee', [['status', '=', 'Active']]);
  const { data: left } = useFrappeGetDocCount('Employee', [['status', '=', 'Left']]);

  const filters = useMemo(() => {
    const f: Array<[string, any, unknown]> = [];
    if (search.trim()) f.push(['employee_name', 'like', `%${search.trim()}%`]);
    if (dept) f.push(['department', '=', dept]);
    if (status) f.push(['status', '=', status]);
    return f as any;
  }, [search, dept, status]);

  const { data: rows, isLoading } = useFrappeGetDocList<EmpRow>('Employee', {
    fields: ['name', 'employee_name', 'designation', 'department', 'date_of_joining', 'status', 'cell_number'],
    filters,
    limit: 100,
    orderBy: { field: 'employee_name', order: 'asc' },
  });
  const { data: departments } = useFrappeGetDocList<{ name: string }>('Department', { fields: ['name'], limit: 200 });

  const toolbarColumns: ToolbarColumn[] = useMemo(() => [
    { id: 'name', header: 'الرقم' },
    { id: 'employee_name', header: 'الاسم' },
    { id: 'designation', header: 'المسمى الوظيفي' },
    { id: 'department', header: 'القسم' },
    { id: 'date_of_joining', header: 'تاريخ التعيين' },
    { id: 'cell_number', header: 'الهاتف' },
    { id: 'status', header: 'الحالة' },
  ], []);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(() => new Set(toolbarColumns.filter((c) => !hidden.has(c.id)).map((c) => c.id)), [toolbarColumns, hidden]);
  const hide = (id: string) => hidden.has(id);

  async function onDelete(name: string) {
    if (!confirm('حذف الموظف؟')) return;
    try { await deleteDoc('Employee', name); toast.success('تم'); window.location.reload(); } catch (e: any) { toast.error(e?.message); }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="إجمالي الموظفين" value={Number(total ?? 0)} icon={<Users size={20} />} color="brand" />
        <Stat label="موظفون نشطون" value={Number(active ?? 0)} icon={<UserCheck size={20} />} color="emerald" />
        <Stat label="منتهيي الخدمة" value={Number(left ?? 0)} icon={<UserX size={20} />} color="red" />
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم..." className="w-full ps-3 pe-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm" />
          </div>
          <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-44 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
            <option value="">كل الأقسام</option>
            {(departments ?? []).map((d) => (<option key={d.name} value={d.name}>{d.name}</option>))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32 px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm">
            <option value="">كل الحالات</option>
            <option value="Active">نشط</option>
            <option value="Inactive">غير نشط</option>
            <option value="Suspended">موقوف</option>
            <option value="Left">منتهي الخدمة</option>
          </select>
        </div>
      </div>

      <DataTableToolbar
        doctype="Employee"
        columns={toolbarColumns}
        rows={(rows ?? []) as unknown as Array<Record<string, unknown>>}
        visibleColumnIds={visibleIds}
        onVisibleColumnsChange={(next) => {
          const all = toolbarColumns.map((c) => c.id);
          setHidden(new Set(all.filter((id) => !next.has(id))));
        }}
      />

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {!hide('name') && <Th>الرقم</Th>}
                {!hide('employee_name') && <Th>الاسم</Th>}
                {!hide('designation') && <Th>المسمى</Th>}
                {!hide('department') && <Th>القسم</Th>}
                {!hide('cell_number') && <Th>الهاتف</Th>}
                {!hide('date_of_joining') && <Th>تاريخ التعيين</Th>}
                {!hide('status') && <Th>الحالة</Th>}
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (<tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!isLoading && (rows ?? []).length === 0 && (<tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">لا يوجد موظفون</td></tr>)}
              {(rows ?? []).map((r) => {
                const isActive = r.status === 'Active';
                return (
                  <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    {!hide('name') && <td className="px-5 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-600)]">{r.name}</td>}
                    {!hide('employee_name') && <td className="px-5 py-3 text-sm font-medium text-slate-800 dark:text-white">{r.employee_name ?? '—'}</td>}
                    {!hide('designation') && <td className="px-5 py-3 text-sm text-slate-500">{r.designation ?? '—'}</td>}
                    {!hide('department') && <td className="px-5 py-3 text-sm text-slate-500">{r.department ?? '—'}</td>}
                    {!hide('cell_number') && <td className="px-5 py-3 text-sm text-slate-500 font-mono" dir="ltr">{r.cell_number ?? '—'}</td>}
                    {!hide('date_of_joining') && <td className="px-5 py-3 text-sm text-slate-500">{r.date_of_joining ?? '—'}</td>}
                    {!hide('status') && (
                      <td className="px-5 py-3">
                        <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (isActive ? 'bg-emerald-100 text-emerald-700' : r.status === 'Left' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                          {isActive ? 'نشط' : r.status === 'Left' ? 'منتهي' : r.status === 'Suspended' ? 'موقوف' : 'غير نشط'}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => navigate(`/hr/employees/${encodeURIComponent(r.name)}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition"><Pencil size={16} /></button>
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

function Stat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'brand' | 'emerald' | 'red' }) {
  const cls = { brand: 'bg-[color:var(--color-brand-100,#d1fae5)] text-[color:var(--color-brand-600)]', emerald: 'bg-emerald-100 text-emerald-600', red: 'bg-red-100 text-red-600' }[color];
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${cls} flex items-center justify-center shrink-0`}>{icon}</div>
      <div><p className="text-xs text-slate-500 mb-0.5">{label}</p><p className="text-xl font-bold" dir="ltr">{value.toLocaleString('en-US')}</p></div>
    </div>
  );
}
function Th({ children }: { children?: React.ReactNode }) { return <th className="px-5 py-3 text-start whitespace-nowrap">{children}</th>; }
