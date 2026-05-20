import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { Building2, CheckCircle, Clock, PauseCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

const BADGE: Record<string, { label: string; cls: string }> = {
  Planning:      { label: 'تخطيط',  cls: 'bg-amber-100 text-amber-700' },
  'In Progress': { label: 'جاري',   cls: 'bg-blue-100 text-blue-700' },
  Completed:     { label: 'مكتمل',  cls: 'bg-emerald-100 text-emerald-700' },
  'On Hold':     { label: 'معلق',   cls: 'bg-slate-100 text-slate-700' },
  Cancelled:     { label: 'ملغى',   cls: 'bg-red-100 text-red-700' },
};

function fmtNum(n: number) {
  return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(n);
}

export default function Page() {
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: rows, isLoading } = useFrappeGetDocList<Record<string, unknown>>(
    'Madaar Construction Project',
    {
      fields: ['name', 'project_code', 'name_ar', 'customer', 'contract_value', 'percent_complete', 'status'],
      limit: 200,
      orderBy: { field: 'modified', order: 'desc' },
    },
  );

  const all = rows ?? [];

  // Stat counts
  const stats = useMemo(() => ({
    total:       all.length,
    inProgress:  all.filter((r) => r.status === 'In Progress').length,
    completed:   all.filter((r) => r.status === 'Completed').length,
    onHold:      all.filter((r) => r.status === 'On Hold').length,
  }), [all]);

  // Filtered rows
  const filtered = useMemo(() => {
    let list = all;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          String(r.project_code ?? '').toLowerCase().includes(q) ||
          String(r.name_ar ?? '').toLowerCase().includes(q),
      );
    }
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [all, search, statusFilter]);

  async function onDelete(name: string) {
    if (!confirm('حذف المشروع؟')) return;
    try {
      await deleteDoc('Madaar Construction Project', name);
      toast.success('تم الحذف');
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  return (
    <RequirePerm doctype="Madaar Construction Project" action="read">
      <PageShell
        title="المشاريع"
        subtitle="إدارة مشاريع المقاولات والإنشاءات"
        actions={
          <Link
            to="/construction/projects/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus size={16} /> مشروع جديد
          </Link>
        }
      >
        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Building2 size={28} className="text-amber-500" />} label="إجمالي المشاريع" value={stats.total} bg="bg-amber-50 dark:bg-amber-900/10" />
          <StatCard icon={<Clock size={28} className="text-blue-500" />} label="قيد التنفيذ" value={stats.inProgress} bg="bg-blue-50 dark:bg-blue-900/10" />
          <StatCard icon={<CheckCircle size={28} className="text-emerald-500" />} label="مكتمل" value={stats.completed} bg="bg-emerald-50 dark:bg-emerald-900/10" />
          <StatCard icon={<PauseCircle size={28} className="text-red-400" />} label="متوقف" value={stats.onHold} bg="bg-red-50 dark:bg-red-900/10" />
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالكود أو الاسم..."
                className="w-full ps-3 pe-9 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm min-w-[150px]"
            >
              <option value="">كل الحالات</option>
              {Object.entries(BADGE).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3 text-start">كود المشروع</th>
                  <th className="px-5 py-3 text-start">المشروع</th>
                  <th className="px-5 py-3 text-start">العميل</th>
                  <th className="px-5 py-3 text-start">قيمة العقد</th>
                  <th className="px-5 py-3 text-start">نسبة الإنجاز</th>
                  <th className="px-5 py-3 text-start">الحالة</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد مشاريع — ابدأ بإنشاء مشروع جديد</td></tr>
                )}
                {filtered.map((r) => {
                  const badge = BADGE[String(r.status ?? '')] ?? { label: String(r.status ?? '—'), cls: 'bg-slate-100 text-slate-700' };
                  return (
                    <tr key={String(r.name)} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-mono text-xs">{String(r.project_code ?? '—')}</td>
                      <td className="px-5 py-3 font-medium">{String(r.name_ar ?? r.name ?? '—')}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{String(r.customer ?? '—')}</td>
                      <td className="px-5 py-3 font-mono" dir="ltr">{r.contract_value ? fmtNum(Number(r.contract_value)) : '—'}</td>
                      <td className="px-5 py-3">{r.percent_complete ? `${r.percent_complete}%` : '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => navigate(`/construction/projects/${String(r.name)}/edit`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(String(r.name))}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </PageShell>
    </RequirePerm>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl border border-slate-100 dark:border-white/5 p-5 flex flex-col items-end gap-3`}>
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
