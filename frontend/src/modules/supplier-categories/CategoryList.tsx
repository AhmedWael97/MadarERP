/** Supplier Categories list — mirrors customer-categories. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeDeleteDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { DataTableToolbar, type ToolbarColumn } from '@/components/erp/DataTableToolbar';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface CategoryRow {
  name: string;
  name_ar?: string;
  name_en?: string;
  discount_percentage?: number;
  is_active?: 0 | 1;
}

export default function SupplierCategoryListPage() {
  return (
    <RequirePerm doctype="Madaar Supplier Category" action="read">
      <PageShell
        title="تصنيفات الموردين"
        subtitle="إدارة تصنيفات وفئات الموردين"
        actions={
          <>
            <Link to="/suppliers" className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
              الموردون
            </Link>
            <Link to="/supplier-categories/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all">
              <Plus size={16} />
              تصنيف جديد
            </Link>
          </>
        }
      >
        <CategoryTable />
      </PageShell>
    </RequirePerm>
  );
}

function CategoryTable() {
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();

  const { data: rows, isLoading } = useFrappeGetDocList<CategoryRow>(
    'Madaar Supplier Category',
    {
      fields: ['name', 'name_ar', 'name_en', 'discount_percentage', 'is_active'],
      limit: 200,
      orderBy: { field: 'modified', order: 'desc' },
    },
    `supplier-categories:${refreshKey}`,
  );

  const toolbarColumns: ToolbarColumn[] = useMemo(
    () => [
      { id: 'name_ar', header: 'الاسم بالعربية' },
      { id: 'name_en', header: 'الاسم بالإنجليزية' },
      { id: 'discount_percentage', header: 'نسبة الخصم' },
      { id: 'is_active', header: 'نشط' },
    ],
    [],
  );
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const visibleIds = useMemo(
    () => new Set(toolbarColumns.filter((c) => !hiddenColumns.has(c.id)).map((c) => c.id)),
    [toolbarColumns, hiddenColumns],
  );
  const hide = (id: string) => hiddenColumns.has(id);

  async function onDelete(name: string) {
    if (!confirm('حذف التصنيف؟')) return;
    try {
      await deleteDoc('Madaar Supplier Category', name);
      toast.success('تم الحذف');
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e?.message ?? 'تعذر الحذف');
    }
  }

  return (
    <div className="space-y-3">
      <DataTableToolbar
        doctype="Madaar Supplier Category"
        columns={toolbarColumns}
        rows={(rows ?? []) as unknown as Array<Record<string, unknown>>}
        visibleColumnIds={visibleIds}
        onVisibleColumnsChange={(next) => {
          const allIds = toolbarColumns.map((c) => c.id);
          setHiddenColumns(new Set(allIds.filter((id) => !next.has(id))));
        }}
      />

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {!hide('name_ar') && <Th>الاسم بالعربية</Th>}
                {!hide('name_en') && <Th>الاسم بالإنجليزية</Th>}
                {!hide('discount_percentage') && <Th>نسبة الخصم</Th>}
                {!hide('is_active') && <Th>الحالة</Th>}
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && (<tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">جاري التحميل...</td></tr>)}
              {!isLoading && (rows ?? []).length === 0 && (<tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">لا توجد تصنيفات</td></tr>)}
              {(rows ?? []).map((c) => (
                <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  {!hide('name_ar') && <td className="px-5 py-3 text-sm font-semibold text-slate-800 dark:text-white">{c.name_ar ?? c.name}</td>}
                  {!hide('name_en') && <td className="px-5 py-3 text-sm text-slate-500">{c.name_en ?? '—'}</td>}
                  {!hide('discount_percentage') && (<td className="px-5 py-3 text-sm font-mono" dir="ltr">{fmtNum(c.discount_percentage ?? 0)}%</td>)}
                  {!hide('is_active') && (
                    <td className="px-5 py-3">
                      <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (c.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}>
                        {c.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                  )}
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => navigate(`/supplier-categories/${encodeURIComponent(c.name)}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] transition" aria-label="edit">
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => onDelete(c.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" aria-label="delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-5 py-3 text-start whitespace-nowrap">{children}</th>;
}
function fmtNum(n: number): string {
  try {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(n);
  }
}
