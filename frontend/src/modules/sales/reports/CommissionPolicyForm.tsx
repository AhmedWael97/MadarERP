import { useEffect, useMemo, useState } from 'react';
import { useFrappeGetCall, useFrappeGetDocList, useFrappePostCall } from 'frappe-react-sdk';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface PolicyRow {
  id: string;
  from_amount: number;
  to_amount: number;
  commission_percentage: number;
}

interface SalesPersonRow {
  name: string;
}

interface PolicyResponse {
  message?: {
    company?: string;
    sales_person?: string;
    policy_name?: string | null;
    tiers?: Array<{
      from_amount: number;
      to_amount: number;
      commission_percentage: number;
    }>;
    fallback_used?: boolean;
  };
}

interface SaveResponse {
  message?: {
    policy_name?: string | null;
  };
}

const INPUT =
  'w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)] transition';

export default function CommissionPolicyFormPage() {
  const [salesPerson, setSalesPerson] = useState('');
  const [rows, setRows] = useState<PolicyRow[]>([]);
  const [savedAt, setSavedAt] = useState<string>('');

  const { data: salesPersons } = useFrappeGetDocList<SalesPersonRow>('Sales Person', {
    fields: ['name'],
    limit: 500,
  });

  const { data, mutate, isLoading } = useFrappeGetCall<PolicyResponse>(
    'madaar_core.api.get_commission_policy',
    { sales_person: salesPerson || '' },
    `commission-policy:${salesPerson || 'default'}`,
  );
  const { call: savePolicy, loading: saving } = useFrappePostCall<SaveResponse>(
    'madaar_core.api.save_commission_policy',
  );

  useEffect(() => {
    const loaded = data?.message?.tiers ?? [];
    setRows(
      loaded.map((r, i) => ({
        id: `${i}-${r.from_amount}-${r.to_amount}-${r.commission_percentage}`,
        from_amount: Number(r.from_amount || 0),
        to_amount: Number(r.to_amount || 0),
        commission_percentage: Number(r.commission_percentage || 0),
      })),
    );
  }, [data]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.from_amount - b.from_amount),
    [rows],
  );

  const hasOverlap = useMemo(() => {
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].from_amount <= sorted[i - 1].to_amount) return true;
    }
    return false;
  }, [sorted]);

  function addRow() {
    const lastTo = sorted.length ? sorted[sorted.length - 1].to_amount : 0;
    setRows([
      ...sorted,
      { id: crypto.randomUUID(), from_amount: lastTo + 0.01, to_amount: lastTo + 1000, commission_percentage: 0 },
    ]);
  }

  function updateRow(id: string, patch: Partial<PolicyRow>) {
    setRows(sorted.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows(sorted.filter((r) => r.id !== id));
  }

  async function save() {
    await savePolicy({
      sales_person: salesPerson || '',
      tiers: sorted,
      is_active: 1,
    });
    await mutate();
    setSavedAt(new Date().toLocaleString('ar-EG'));
  }

  return (
    <RequirePerm doctype="Sales Invoice" action="read">
      <PageShell title="سياسة العمولة" subtitle="من مبلغ إلى مبلغ ونسبة العمولة - يمكن تخصيص السياسة لكل مندوب">
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">المندوب</label>
                <select
                  className={INPUT}
                  value={salesPerson}
                  onChange={(e) => setSalesPerson(e.target.value)}
                >
                  <option value="">الافتراضي (الكل)</option>
                  {(salesPersons ?? []).map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 text-sm text-slate-500">
                {savedAt ? `آخر حفظ: ${savedAt}` : isLoading ? 'جاري تحميل السياسة...' : 'لم يتم الحفظ بعد'}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold">شرائح العمولة</h3>
              <button onClick={addRow} className="px-3 py-1.5 rounded-lg bg-(--color-brand-600) text-white text-sm">إضافة شريحة</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                  <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 text-start">من مبلغ</th>
                    <th className="px-4 py-3 text-start">إلى مبلغ</th>
                    <th className="px-4 py-3 text-start">نسبة العمولة %</th>
                    <th className="px-4 py-3 text-start">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {sorted.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">لا توجد شرائح</td></tr>
                  )}
                  {sorted.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={r.from_amount}
                          onChange={(e) => updateRow(r.id, { from_amount: Number(e.target.value) })}
                          className={INPUT}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={r.to_amount}
                          onChange={(e) => updateRow(r.id, { to_amount: Number(e.target.value) })}
                          className={INPUT}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={r.commission_percentage}
                          onChange={(e) => updateRow(r.id, { commission_percentage: Number(e.target.value) })}
                          className={INPUT}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => removeRow(r.id)} className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs">حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {hasOverlap && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              هناك تداخل بين الشرائح. يفضل تعديل حدود "من" و "إلى".
            </div>
          )}

          <div className="flex justify-end">
            <button disabled={saving} onClick={save} className="px-4 py-2 rounded-xl bg-(--color-brand-600) text-white font-semibold disabled:opacity-60">
              {saving ? 'جاري الحفظ...' : 'حفظ السياسة'}
            </button>
          </div>
        </div>
      </PageShell>
    </RequirePerm>
  );
}
