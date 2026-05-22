/**
 * Customer Groups — list + CRUD for ERPNext Customer Group doctype.
 * Route: /customer-groups
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useFrappeCreateDoc,
  useFrappeDeleteDoc,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, extractFrappeError } from '@/modules/accounting/AccountForm';

// ── List ─────────────────────────────────────────────────────────────────────

interface GroupRow {
  name: string;
  customer_group_name?: string;
  parent_customer_group?: string;
  is_group?: 0 | 1;
}

export function CustomerGroupList() {
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();

  const { data: rows, isLoading } = useFrappeGetDocList<GroupRow>(
    'Customer Group',
    {
      fields: ['name', 'customer_group_name', 'parent_customer_group', 'is_group'],
      limit: 200,
      orderBy: { field: 'customer_group_name', order: 'asc' },
    },
    `customer-groups:${refreshKey}`,
  );

  async function onDelete(name: string) {
    if (!confirm(`حذف المجموعة "${name}"؟`)) return;
    try {
      await deleteDoc('Customer Group', name);
      toast.success('تم الحذف');
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحذف');
    }
  }

  return (
    <RequirePerm doctype="Customer Group" action="read">
      <PageShell
        title="مجموعات العملاء"
        subtitle="إدارة تصنيفات ومجموعات العملاء"
        actions={
          <Link
            to="/customer-groups/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-(--color-brand-500) to-(--color-brand-600) text-white text-sm font-semibold rounded-xl shadow-lg shadow-(color:--color-brand-500)/20 transition-all"
          >
            <Plus size={16} /> مجموعة جديدة
          </Link>
        }
      >
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
          {isLoading ? (
            <p className="text-center py-10 text-slate-400 text-sm">جارٍ التحميل…</p>
          ) : (rows ?? []).length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-sm">لا توجد مجموعات بعد.</p>
          ) : (
            <table className="w-full text-sm" dir="rtl">
              <thead className="bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">اسم المجموعة</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">المجموعة الأم</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">مجموعة رئيسية</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {(rows ?? []).map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{row.customer_group_name ?? row.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.parent_customer_group || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {row.is_group ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">نعم</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 dark:bg-white/10">لا</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/customer-groups/${encodeURIComponent(row.name)}/edit`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-(--color-brand-500) hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                          title="تعديل"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PageShell>
    </RequirePerm>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────

interface GroupDoc {
  name?: string;
  customer_group_name?: string;
  parent_customer_group?: string;
  is_group?: 0 | 1;
  default_price_list?: string;
}

export function CustomerGroupForm({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';

  const [values, setValues] = useState<GroupDoc>({ is_group: 0 });
  const { data: existing } = useFrappeGetDoc<GroupDoc>('Customer Group', isEdit ? id : undefined, isEdit && id ? `cg:${id}` : null);
  useState(() => { if (existing) setValues((v) => ({ ...v, ...existing })); });

  const { data: allGroups } = useFrappeGetDocList<{ name: string; customer_group_name?: string }>(
    'Customer Group',
    { fields: ['name', 'customer_group_name'], limit: 200 },
  );

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof GroupDoc>(key: K, val: GroupDoc[K]) {
    setValues((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && id) {
        await updateDoc('Customer Group', id, cleaned);
        toast.success('تم التحديث');
      } else {
        await createDoc('Customer Group', cleaned);
        toast.success('تم الحفظ');
      }
      navigate('/customer-groups');
    } catch (err: any) {
      toast.error(extractFrappeError(err) ?? 'تعذر الحفظ');
    }
  }

  return (
    <RequirePerm doctype="Customer Group" action="read">
      <PageShell
        title={isEdit ? 'تعديل مجموعة عملاء' : 'مجموعة عملاء جديدة'}
        subtitle="بيانات المجموعة"
        actions={
          <button
            type="button"
            onClick={() => navigate('/customer-groups')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all"
          >
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <form onSubmit={onSubmit}>
          <Card title="بيانات المجموعة">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="اسم المجموعة" required>
                <input
                  type="text"
                  required
                  value={values.customer_group_name ?? ''}
                  onChange={(e) => set('customer_group_name', e.target.value)}
                  className={INPUT}
                  placeholder="مثال: عملاء الجملة"
                />
              </Field>

              <Field label="المجموعة الأم (اختياري)">
                <select
                  value={values.parent_customer_group ?? ''}
                  onChange={(e) => set('parent_customer_group', e.target.value)}
                  className={INPUT}
                >
                  <option value="">— جذر —</option>
                  {(allGroups ?? [])
                    .filter((g) => g.name !== id)
                    .map((g) => (
                      <option key={g.name} value={g.name}>
                        {g.customer_group_name ?? g.name}
                      </option>
                    ))}
                </select>
              </Field>

              <div className="flex items-center gap-2 pt-7">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!values.is_group}
                    onChange={(e) => set('is_group', e.target.checked ? 1 : 0)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">مجموعة رئيسية (تحتوي على مجموعات فرعية)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-white/5">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-(--color-brand-500) hover:bg-(--color-brand-600) disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all"
              >
                {saving ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة المجموعة'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/customer-groups')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                إلغاء
              </button>
            </div>
          </Card>
        </form>
      </PageShell>
    </RequirePerm>
  );
}
