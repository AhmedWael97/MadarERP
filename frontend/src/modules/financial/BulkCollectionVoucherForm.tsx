import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useFrappeCreateDoc,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useSWRConfig,
} from 'frappe-react-sdk';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import SearchableSelect from '@/components/erp/SearchableSelect';

type PartyType = 'Customer' | 'Supplier' | 'Employee' | '';

type VoucherRow = {
  id: number;
  party_type: PartyType;
  party: string;
  custom_payee_name: string;
  amount: number;
  reference_no: string;
  remarks: string;
  other_account: string;
};

interface AccountRow {
  name: string;
  account_name?: string;
  account_number?: string;
  account_type?: string;
  is_group?: 0 | 1;
  parent_account?: string;
}

const INPUT =
  'w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      {children}
    </div>
  );
}

const nextId = (() => {
  let id = 1;
  return () => id++;
})();

function blankRow(): VoucherRow {
  return {
    id: nextId(),
    party_type: 'Customer',
    party: '',
    custom_payee_name: '',
    amount: 0,
    reference_no: '',
    remarks: '',
    other_account: '',
  };
}

export default function BulkCollectionVoucherFormPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [postingDate, setPostingDate] = useState(today);
  const [modeOfPayment, setModeOfPayment] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [rows, setRows] = useState<VoucherRow[]>([blankRow()]);

  const { data: defaults } = useFrappeGetCall<{ message: { default_company?: string } }>(
    'frappe.client.get_value',
    { doctype: 'Global Defaults', fieldname: 'default_company' },
    'gd:default_company:bulk-receipt',
  );
  const defaultCompany = defaults?.message?.default_company;

  const { data: companyDoc } = useFrappeGetDoc<{
    name: string;
    default_receivable_account?: string;
    default_payable_account?: string;
  }>('Company', defaultCompany, defaultCompany ? `co:bulk-receipt:${defaultCompany}` : null);

  const { data: mopList } = useFrappeGetDocList<{ name: string }>('Mode of Payment', {
    fields: ['name'],
    limit: 100,
  });
  const { data: accounts } = useFrappeGetDocList<AccountRow>('Account', {
    fields: ['name', 'account_name', 'account_number', 'account_type', 'is_group', 'parent_account'],
    filters: [['disabled', '=', 0]],
    limit: 500,
    orderBy: { field: 'account_number', order: 'asc' },
  });
  const { data: costCenters } = useFrappeGetDocList<{ name: string }>('Cost Center', {
    fields: ['name'],
    filters: [['disabled', '=', 0]],
    limit: 200,
  });
  const { data: customers } = useFrappeGetDocList<{ name: string; customer_name?: string }>('Customer', {
    fields: ['name', 'customer_name'],
    limit: 400,
  });
  const { data: suppliers } = useFrappeGetDocList<{ name: string; supplier_name?: string }>('Supplier', {
    fields: ['name', 'supplier_name'],
    limit: 400,
  });
  const { data: employees } = useFrappeGetDocList<{ name: string; employee_name?: string }>('Employee', {
    fields: ['name', 'employee_name'],
    limit: 400,
  });

  const cashAccounts = (accounts ?? []).filter((a) => (a.account_type === 'Cash' || a.account_type === 'Bank') && !a.is_group);
  const fullTreeAccounts = (accounts ?? []).map((a) => {
    const depth = Math.max(0, (a.parent_account ? String(a.parent_account).split(' - ').length - 1 : 0));
    const prefix = depth > 0 ? `${' '.repeat(depth * 2)}└ ` : '';
    const label = a.account_number ? `${a.account_number} - ${a.account_name ?? a.name}` : (a.account_name ?? a.name);
    return { value: a.name, label: `${prefix}${label}` };
  });

  const partyOptionsByType = useMemo(() => ({
    Customer: (customers ?? []).map((c) => ({ value: c.name, label: c.customer_name ?? c.name })),
    Supplier: (suppliers ?? []).map((s) => ({ value: s.name, label: s.supplier_name ?? s.name })),
    Employee: (employees ?? []).map((e) => ({ value: e.name, label: e.employee_name ?? e.name })),
  }), [customers, suppliers, employees]);

  const { createDoc, loading } = useFrappeCreateDoc();
  const { mutate: mutateCache } = useSWRConfig();

  function setRow(id: number, patch: Partial<VoucherRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, blankRow()]);
  }

  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  async function submitAll() {
    if (!paidTo) {
      toast.error('اختر خزينة/حساب بنكي أولاً');
      return;
    }
    if (!modeOfPayment) {
      toast.error('اختر طريقة الدفع');
      return;
    }

    const validRows = rows.filter((r) => Number(r.amount) > 0);
    if (validRows.length === 0) {
      toast.error('أضف صفاً واحداً على الأقل بمبلغ أكبر من صفر');
      return;
    }

    let created = 0;
    for (const r of validRows) {
      const partyType = r.party_type || undefined;
      const party = r.party || undefined;
      const amount = Number(r.amount || 0);
      const paidFrom =
        r.party_type === 'Customer' || r.party_type === 'Employee'
          ? companyDoc?.default_receivable_account
          : r.party_type === 'Supplier'
            ? companyDoc?.default_payable_account
            : r.other_account || undefined;

      if (!paidFrom) {
        toast.error(`لا يوجد حساب مقابل للصف ${r.id}. اختر حساباً لصف نوع (إيراد آخر) أو راجع افتراضات الشركة.`);
        return;
      }

      const payload: Record<string, unknown> = {
        payment_type: 'Receive',
        posting_date: postingDate,
        mode_of_payment: modeOfPayment,
        party_type: partyType,
        party,
        custom_payee_name: r.custom_payee_name || undefined,
        paid_amount: amount,
        received_amount: amount,
        source_exchange_rate: 1,
        target_exchange_rate: 1,
        paid_to: paidTo,
        paid_from: paidFrom,
        reference_no: r.reference_no || undefined,
        remarks: r.remarks || undefined,
        cost_center: costCenter || undefined,
      };

      Object.keys(payload).forEach((k) => {
        if (payload[k] === '' || payload[k] === undefined) delete payload[k];
      });

      await createDoc('Payment Entry', payload);
      created += 1;
    }

    mutateCache(
      (key: unknown) => typeof key === 'string' && key.includes('/api/resource/Payment Entry'),
      undefined,
      { revalidate: true },
    );

    toast.success(`تم إنشاء ${created} سند قبض بنجاح`);
    navigate('/financial/receipt-vouchers');
  }

  const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <RequirePerm doctype="Payment Entry" action="create">
      <PageShell
        title="سندات قبض مجمعة"
        subtitle="إدخال عدة سندات قبض مرة واحدة بنفس التاريخ وطريقة الدفع"
        actions={
          <button
            type="button"
            onClick={() => navigate('/financial/receipt-vouchers')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all"
          >
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="التاريخ">
                <input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} className={INPUT} />
              </Field>
              <Field label="طريقة الدفع">
                <SearchableSelect
                  value={modeOfPayment}
                  onChange={setModeOfPayment}
                  options={(mopList ?? []).map((m) => ({ value: m.name, label: m.name }))}
                  listId="bulk-receipt-mop"
                  placeholder="اختر طريقة الدفع"
                  className={INPUT}
                />
              </Field>
              <Field label="الخزينة / الحساب البنكي (إلى)">
                <SearchableSelect
                  value={paidTo}
                  onChange={setPaidTo}
                  options={cashAccounts.map((a) => ({
                    value: a.name,
                    label: a.account_number ? `${a.account_number} - ${a.account_name ?? a.name}` : (a.account_name ?? a.name),
                  }))}
                  listId="bulk-receipt-paid-to"
                  placeholder="اختر الخزينة أو الحساب البنكي"
                  className={INPUT}
                />
              </Field>
              <Field label="مركز التكلفة (اختياري)">
                <SearchableSelect
                  value={costCenter}
                  onChange={setCostCenter}
                  options={(costCenters ?? []).map((c) => ({ value: c.name, label: c.name }))}
                  listId="bulk-receipt-cc"
                  placeholder="بدون"
                  className={INPUT}
                />
              </Field>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">الصفوف</h3>
              <button type="button" onClick={addRow} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
                <Plus size={14} /> إضافة صف
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1050px]">
                <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    <th className="px-3 py-3 text-start">نوع الجهة</th>
                    <th className="px-3 py-3 text-start">الجهة</th>
                    <th className="px-3 py-3 text-start">المستلم منه</th>
                    <th className="px-3 py-3 text-start">حساب مقابل (للإيراد الآخر)</th>
                    <th className="px-3 py-3 text-start">المبلغ</th>
                    <th className="px-3 py-3 text-start">المرجع</th>
                    <th className="px-3 py-3 text-start">البيان</th>
                    <th className="px-3 py-3 text-start">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {rows.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="px-3 py-2">
                        <select
                          value={r.party_type}
                          onChange={(e) => setRow(r.id, { party_type: e.target.value as PartyType, party: '', other_account: '' })}
                          className={INPUT}
                        >
                          <option value="Customer">عميل</option>
                          <option value="Supplier">مورد</option>
                          <option value="Employee">موظف</option>
                          <option value="">إيراد آخر</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <SearchableSelect
                          value={r.party}
                          onChange={(v) => setRow(r.id, { party: v })}
                          options={r.party_type ? partyOptionsByType[r.party_type as 'Customer' | 'Supplier' | 'Employee'] : []}
                          listId={`bulk-row-party-${r.id}`}
                          placeholder="اختيار"
                          className={INPUT}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.custom_payee_name}
                          onChange={(e) => setRow(r.id, { custom_payee_name: e.target.value })}
                          className={INPUT}
                          placeholder="عند عدم اختيار جهة"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <SearchableSelect
                          value={r.other_account}
                          onChange={(v) => setRow(r.id, { other_account: v })}
                          options={fullTreeAccounts}
                          listId={`bulk-row-other-account-${r.id}`}
                          placeholder={r.party_type ? 'تلقائي حسب نوع الجهة' : 'اختر حساباً'}
                          className={INPUT}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={r.amount || ''}
                          onChange={(e) => setRow(r.id, { amount: Number(e.target.value || 0) })}
                          className={INPUT}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.reference_no}
                          onChange={(e) => setRow(r.id, { reference_no: e.target.value })}
                          className={INPUT}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.remarks}
                          onChange={(e) => setRow(r.id, { remarks: e.target.value })}
                          className={INPUT}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(r.id)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              الإجمالي: <span className="font-bold text-slate-900 dark:text-white">{new Intl.NumberFormat('en-US').format(totalAmount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => navigate('/financial/receipt-vouchers')} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all">
                إلغاء
              </button>
              <button type="button" onClick={submitAll} disabled={loading} className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-sm">
                {loading ? 'جاري الإنشاء...' : 'إنشاء السندات'}
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    </RequirePerm>
  );
}
