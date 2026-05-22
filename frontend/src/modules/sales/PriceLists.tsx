/**
 * Sales Price Lists — list + CRUD for ERPNext Price List doctype.
 * Mirrors the sidebar link /sales/price-lists.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useFrappeCreateDoc,
  useFrappeDeleteDoc,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, extractFrappeError } from '@/modules/accounting/AccountForm';

// ─────────────────────────────────────────────────────────────────────────────
// List page
// ─────────────────────────────────────────────────────────────────────────────
interface PriceListRow {
  name: string;
  price_list_name?: string;
  currency?: string;
  enabled?: 0 | 1;
  buying?: 0 | 1;
  selling?: 0 | 1;
}

export function PriceListPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { deleteDoc } = useFrappeDeleteDoc();

  const { data: rows, isLoading } = useFrappeGetDocList<PriceListRow>(
    'Price List',
    {
      fields: ['name', 'price_list_name', 'currency', 'enabled', 'buying', 'selling'],
      limit: 200,
      orderBy: { field: 'modified', order: 'desc' },
    },
    `price-lists:${refreshKey}`,
  );

  async function onDelete(name: string) {
    if (!confirm(`حذف قائمة الأسعار "${name}"؟`)) return;
    try {
      await deleteDoc('Price List', name);
      toast.success('تم الحذف');
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحذف');
    }
  }

  return (
    <RequirePerm doctype="Price List" action="read">
      <PageShell
        title="قوائم الأسعار"
        subtitle="إدارة قوائم أسعار البيع والشراء"
        actions={
          <button
            type="button"
            onClick={() => navigate('/sales/price-lists/create')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 transition-all"
          >
            <Plus size={16} /> قائمة أسعار جديدة
          </button>
        }
      >
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
          {isLoading ? (
            <p className="text-center py-10 text-slate-400 text-sm">جارٍ التحميل…</p>
          ) : (rows ?? []).length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-sm">لا توجد قوائم أسعار بعد.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">اسم القائمة</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">العملة</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">مبيعات</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">مشتريات</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">نشطة</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {(rows ?? []).map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{row.price_list_name ?? row.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{row.currency || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {row.selling ? <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">نعم</span> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.buying ? <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">نعم</span> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.enabled ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">نشطة</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">معطلة</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/sales/price-lists/${encodeURIComponent(row.name)}/edit`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-50)] dark:hover:bg-[color:var(--color-brand-900)]/20 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

// ─────────────────────────────────────────────────────────────────────────────
// Form (create / edit)
// ─────────────────────────────────────────────────────────────────────────────
interface PriceListDoc {
  name?: string;
  price_list_name?: string;
  currency?: string;
  enabled?: 0 | 1;
  buying?: 0 | 1;
  selling?: 0 | 1;
}

export function PriceListForm({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';

  const [values, setValues] = useState<PriceListDoc>({ enabled: 1, selling: 1, buying: 0 });
  const { data: existing } = useFrappeGetDoc<PriceListDoc>('Price List', isEdit ? id : undefined, isEdit && id ? `pl:${id}` : null);
  useState(() => { if (existing) setValues((v) => ({ ...v, ...existing })); });

  const { data: currencies } = useFrappeGetDocList<{ name: string }>(
    'Currency',
    { fields: ['name'], filters: [['enabled', '=', 1]], limit: 100 } as any,
  );

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof PriceListDoc>(key: K, val: PriceListDoc[K]) {
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
        await updateDoc('Price List', id, cleaned);
        toast.success('تحديث');
      } else {
        await createDoc('Price List', cleaned);
        toast.success('تم الحفظ');
      }
      navigate('/sales/price-lists');
    } catch (err: any) {
      toast.error(extractFrappeError(err) ?? 'تعذر الحفظ');
    }
  }

  return (
    <RequirePerm doctype="Price List" action="read">
      <PageShell
        title={isEdit ? 'تعديل قائمة أسعار' : 'قائمة أسعار جديدة'}
        subtitle="بيانات قائمة الأسعار"
        actions={
          <button
            type="button"
            onClick={() => navigate('/sales/price-lists')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all"
          >
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <form onSubmit={onSubmit}>
          <Card title="بيانات قائمة الأسعار">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="اسم القائمة" required>
                <input
                  type="text"
                  required
                  value={values.price_list_name ?? ''}
                  onChange={(e) => set('price_list_name', e.target.value)}
                  className={INPUT}
                  placeholder="مثال: أسعار التجزئة"
                />
              </Field>

              <Field label="العملة" required>
                <select
                  required
                  value={values.currency ?? ''}
                  onChange={(e) => set('currency', e.target.value)}
                  className={INPUT}
                >
                  <option value="">— اختر العملة —</option>
                  {(currencies ?? []).map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <div className="flex items-center gap-6 md:col-span-2 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!values.selling}
                    onChange={(e) => set('selling', e.target.checked ? 1 : 0)}
                    className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">قائمة مبيعات</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!values.buying}
                    onChange={(e) => set('buying', e.target.checked ? 1 : 0)}
                    className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">قائمة مشتريات</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!values.enabled}
                    onChange={(e) => set('enabled', e.target.checked ? 1 : 0)}
                    className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">نشطة</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-white/5">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                <Check size={16} />
                {saving ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'حفظ القائمة'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/sales/price-lists')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                <X size={16} /> إلغاء
              </button>
            </div>
          </Card>
        </form>
      </PageShell>
    </RequirePerm>
  );
}

export default PriceListPage;
