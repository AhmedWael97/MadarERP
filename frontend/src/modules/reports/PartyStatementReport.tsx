import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import SearchableSelect from '@/components/erp/SearchableSelect';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface PartyDoc {
  name: string;
  customer_name?: string;
  supplier_name?: string;
  madaar_customer_code?: string;
  madaar_supplier_code?: string;
  madaar_sales_person?: string;
  customer_type?: string;
  supplier_type?: string;
  tax_id?: string;
  payment_terms?: string;
  madaar_city?: string;
  madaar_country?: string;
  madaar_phone?: string;
  madaar_mobile?: string;
  madaar_email?: string;
}

interface GLEntry {
  name: string;
  posting_date: string;
  party_type: string;
  party: string;
  voucher_type: string;
  voucher_no: string;
  against_voucher_type?: string;
  against_voucher?: string;
  remarks?: string;
  debit: number;
  credit: number;
}

const INPUT =
  'w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)] transition';

type Mode = 'customers' | 'suppliers' | 'both';

export default function PartyStatementReport({ mode }: { mode: Mode }) {
  const title = mode === 'customers' ? 'كشف حساب العملاء' : mode === 'suppliers' ? 'كشف حساب الموردين' : 'كشف الحساب الموحّد (عملاء/موردين)';
  const subtitle = mode === 'customers'
    ? 'اختر عميل/مندوب/فترة زمنية مع فلاتر تفصيلية'
    : mode === 'suppliers'
      ? 'اختر مورد/فترة زمنية مع فلاتر تفصيلية'
      : 'كشف حساب موحّد لكل الأطراف (العملاء والموردين)';

  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [fromDate, setFromDate] = useState(yearStart);
  const [toDate, setToDate] = useState(today);
  const [partyType, setPartyType] = useState<'Customer' | 'Supplier' | ''>(
    mode === 'customers' ? 'Customer' : mode === 'suppliers' ? 'Supplier' : '',
  );
  const [party, setParty] = useState('');
  const [salesRep, setSalesRep] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxId, setTaxId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [voucherType, setVoucherType] = useState('');

  const allowCustomer = mode !== 'suppliers';
  const allowSupplier = mode !== 'customers';

  const customerFilters: Array<[string, string, unknown]> = [];
  if (salesRep) customerFilters.push(['madaar_sales_person', '=', salesRep]);
  if (city) customerFilters.push(['madaar_city', 'like', `%${city}%`]);
  if (country) customerFilters.push(['madaar_country', 'like', `%${country}%`]);
  if (phone) customerFilters.push(['madaar_phone', 'like', `%${phone}%`]);
  if (email) customerFilters.push(['madaar_email', 'like', `%${email}%`]);
  if (taxId) customerFilters.push(['tax_id', 'like', `%${taxId}%`]);
  if (paymentTerms) customerFilters.push(['payment_terms', '=', paymentTerms]);

  const supplierFilters: Array<[string, string, unknown]> = [];
  if (city) supplierFilters.push(['madaar_city', 'like', `%${city}%`]);
  if (country) supplierFilters.push(['madaar_country', 'like', `%${country}%`]);
  if (phone) supplierFilters.push(['madaar_phone', 'like', `%${phone}%`]);
  if (email) supplierFilters.push(['madaar_email', 'like', `%${email}%`]);
  if (taxId) supplierFilters.push(['tax_id', 'like', `%${taxId}%`]);
  if (paymentTerms) supplierFilters.push(['payment_terms', '=', paymentTerms]);

  const { data: customers } = useFrappeGetDocList<PartyDoc>(
    'Customer',
    {
      fields: ['name', 'customer_name', 'madaar_customer_code', 'madaar_sales_person', 'customer_type', 'tax_id', 'payment_terms', 'madaar_city', 'madaar_country', 'madaar_phone', 'madaar_mobile', 'madaar_email'],
      filters: customerFilters as any,
      limit: 500,
    },
    allowCustomer ? undefined : null,
  );

  const { data: suppliers } = useFrappeGetDocList<PartyDoc>(
    'Supplier',
    {
      fields: ['name', 'supplier_name', 'madaar_supplier_code', 'supplier_type', 'tax_id', 'payment_terms', 'madaar_city', 'madaar_country', 'madaar_phone', 'madaar_mobile', 'madaar_email'],
      filters: supplierFilters as any,
      limit: 500,
    },
    allowSupplier ? undefined : null,
  );

  const partyOptions = useMemo(() => {
    if (partyType === 'Customer') {
      return (customers ?? []).map((c) => ({
        value: c.name,
        label: `${c.madaar_customer_code ?? ''}${c.madaar_customer_code ? ' - ' : ''}${c.customer_name ?? c.name}`,
      }));
    }
    if (partyType === 'Supplier') {
      return (suppliers ?? []).map((s) => ({
        value: s.name,
        label: `${s.madaar_supplier_code ?? ''}${s.madaar_supplier_code ? ' - ' : ''}${s.supplier_name ?? s.name}`,
      }));
    }
    const allCustomers = (customers ?? []).map((c) => ({
      value: c.name,
      label: `عميل: ${c.customer_name ?? c.name}`,
      type: 'Customer' as const,
    }));
    const allSuppliers = (suppliers ?? []).map((s) => ({
      value: s.name,
      label: `مورد: ${s.supplier_name ?? s.name}`,
      type: 'Supplier' as const,
    }));
    return [...allCustomers, ...allSuppliers].map((x) => ({ value: `${x.type}:${x.value}`, label: x.label }));
  }, [partyType, customers, suppliers]);

  const { data: salesPersons } = useFrappeGetDocList<{ name: string }>('Sales Person', {
    fields: ['name'],
    limit: 200,
  });

  const customerNameSet = useMemo(() => new Set((customers ?? []).map((c) => c.name)), [customers]);
  const supplierNameSet = useMemo(() => new Set((suppliers ?? []).map((s) => s.name)), [suppliers]);

  const glFilters = useMemo(() => {
    const f: Array<[string, string, unknown]> = [
      ['is_cancelled', '=', 0],
      ['posting_date', '>=', fromDate],
      ['posting_date', '<=', toDate],
    ];

    if (voucherType) f.push(['voucher_type', '=', voucherType]);

    if (partyType === 'Customer') {
      f.push(['party_type', '=', 'Customer']);
      if (party) f.push(['party', '=', party]);
      else if (customers && customers.length > 0) f.push(['party', 'in', customers.map((c) => c.name)] as any);
    } else if (partyType === 'Supplier') {
      f.push(['party_type', '=', 'Supplier']);
      if (party) f.push(['party', '=', party]);
      else if (suppliers && suppliers.length > 0) f.push(['party', 'in', suppliers.map((s) => s.name)] as any);
    } else {
      const all = [
        ...Array.from(customerNameSet).map((p) => ({ t: 'Customer', p })),
        ...Array.from(supplierNameSet).map((p) => ({ t: 'Supplier', p })),
      ];
      if (party) {
        const [t, p] = party.includes(':') ? party.split(':') : ['', party];
        if (t === 'Customer' || t === 'Supplier') {
          f.push(['party_type', '=', t]);
          f.push(['party', '=', p]);
        }
      } else if (all.length > 0) {
        f.push(['party', 'in', all.map((x) => x.p)] as any);
      }
    }

    return f;
  }, [fromDate, toDate, voucherType, partyType, party, customers, suppliers, customerNameSet, supplierNameSet]);

  const { data: glRows, isLoading } = useFrappeGetDocList<GLEntry>('GL Entry', {
    fields: ['name', 'posting_date', 'party_type', 'party', 'voucher_type', 'voucher_no', 'against_voucher_type', 'against_voucher', 'remarks', 'debit', 'credit'],
    filters: glFilters as any,
    limit: 1000,
    orderBy: { field: 'posting_date', order: 'asc' },
  });

  const rows = useMemo(() => {
    let running = 0;
    return (glRows ?? []).map((r) => {
      running += Number(r.debit ?? 0) - Number(r.credit ?? 0);
      return { ...r, running };
    });
  }, [glRows]);

  const totals = useMemo(() => {
    const debit = (glRows ?? []).reduce((a, r) => a + Number(r.debit ?? 0), 0);
    const credit = (glRows ?? []).reduce((a, r) => a + Number(r.credit ?? 0), 0);
    return { debit, credit, balance: debit - credit };
  }, [glRows]);

  return (
    <RequirePerm doctype="GL Entry" action="read">
      <PageShell title={title} subtitle={subtitle}>
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {mode === 'both' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">نوع الطرف</label>
                  <SearchableSelect
                    value={partyType}
                    onChange={(v) => {
                      setPartyType(v as 'Customer' | 'Supplier' | '');
                      setParty('');
                    }}
                    options={[
                      { value: '', label: 'الكل' },
                      { value: 'Customer', label: 'العملاء' },
                      { value: 'Supplier', label: 'الموردين' },
                    ]}
                    listId="stmt-party-type"
                    className={INPUT}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">الطرف</label>
                <SearchableSelect
                  value={party}
                  onChange={setParty}
                  options={partyOptions}
                  listId="stmt-party"
                  className={INPUT}
                  placeholder="الكل"
                />
              </div>

              {mode !== 'suppliers' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">مندوب المبيعات</label>
                  <SearchableSelect
                    value={salesRep}
                    onChange={setSalesRep}
                    options={(salesPersons ?? []).map((s) => ({ value: s.name, label: s.name }))}
                    listId="stmt-sales-rep"
                    className={INPUT}
                    placeholder="الكل"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">نوع المصدر</label>
                <SearchableSelect
                  value={voucherType}
                  onChange={setVoucherType}
                  options={[
                    { value: '', label: 'الكل' },
                    { value: 'Sales Invoice', label: 'فاتورة مبيعات' },
                    { value: 'Purchase Invoice', label: 'فاتورة مشتريات' },
                    { value: 'Payment Entry', label: 'سندات' },
                    { value: 'Journal Entry', label: 'قيد يومية' },
                    { value: 'Sales Order', label: 'أمر بيع' },
                    { value: 'Purchase Order', label: 'أمر شراء' },
                  ]}
                  listId="stmt-vt"
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">من تاريخ</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">إلى تاريخ</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">المدينة</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={INPUT} placeholder="اختياري" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">الدولة</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className={INPUT} placeholder="اختياري" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">الهاتف</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} placeholder="اختياري" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">البريد</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} placeholder="اختياري" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">الرقم الضريبي</label>
                <input value={taxId} onChange={(e) => setTaxId(e.target.value)} className={INPUT} placeholder="اختياري" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">شروط الدفع</label>
                <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={INPUT} placeholder="اختياري" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card label="إجمالي مدين" value={totals.debit} color="text-red-600" />
            <Card label="إجمالي دائن" value={totals.credit} color="text-emerald-600" />
            <Card label="الرصيد" value={totals.balance} color={totals.balance >= 0 ? 'text-red-600' : 'text-emerald-600'} />
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                  <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 text-start">التاريخ</th>
                    <th className="px-4 py-3 text-start">الطرف</th>
                    <th className="px-4 py-3 text-start">النوع</th>
                    <th className="px-4 py-3 text-start">المرجع</th>
                    <th className="px-4 py-3 text-start">الوصف</th>
                    <th className="px-4 py-3 text-start">مدين</th>
                    <th className="px-4 py-3 text-start">دائن</th>
                    <th className="px-4 py-3 text-start">الرصيد الجاري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {isLoading && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">جاري التحميل...</td></tr>
                  )}
                  {!isLoading && rows.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">لا توجد بيانات</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.name} className="hover:bg-slate-50 dark:hover:bg-white/2">
                      <td className="px-4 py-2.5 font-mono">{r.posting_date}</td>
                      <td className="px-4 py-2.5">
                        <Link to={r.party_type === 'Customer' ? `/customers/${encodeURIComponent(r.party)}` : `/suppliers/${encodeURIComponent(r.party)}`} className="text-(--color-brand-600) hover:underline">
                          {r.party}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{r.voucher_type}</td>
                      <td className="px-4 py-2.5 font-mono">{r.voucher_no}</td>
                      <td className="px-4 py-2.5">{r.remarks ?? '—'}</td>
                      <td className="px-4 py-2.5 font-mono text-red-600">{fmt(r.debit)}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-600">{fmt(r.credit)}</td>
                      <td className="px-4 py-2.5 font-mono">{fmt((r as any).running)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageShell>
    </RequirePerm>
  );
}

function Card({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{fmt(value)}</p>
    </div>
  );
}

function fmt(n?: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n ?? 0));
}
