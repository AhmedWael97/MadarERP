/** Supplier detail page — mirrors CustomerDetail (see `customers/show.blade.php`).
 *  Adds the bank-info card the reference shows on the supplier financial side panel. */
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFrappeGetCall, useFrappeGetDoc } from 'frappe-react-sdk';
import { ArrowRight, Pencil } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface SupplierDoc {
  name: string;
  supplier_name?: string;
  supplier_type?: 'Individual' | 'Company';
  tax_id?: string;
  payment_terms?: string;
  disabled?: 0 | 1;
  madaar_supplier_code?: string;
  madaar_name_ar?: string;
  madaar_name_en?: string;
  madaar_city?: string;
  madaar_country?: string;
  madaar_supplier_category?: string;
  madaar_default_payable_account?: string;
  madaar_notes?: string;
  madaar_address?: string;
  madaar_phone?: string;
  madaar_mobile?: string;
  madaar_email?: string;
  madaar_commercial_register?: string;
  madaar_opening_balance?: number;
  madaar_bank_name?: string;
  madaar_bank_account_number?: string;
  madaar_bank_iban?: string;
}

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: s, isLoading } = useFrappeGetDoc<SupplierDoc>('Supplier', id);

  // Authoritative outstanding from `tabGL Entry` (Supplier Aging reads the
  // same source). `party_type='Supplier'` flips the sign so positive =
  // "we owe this supplier", matching the headline number's intuition.
  const { data: balanceResp } = useFrappeGetCall<{ message: Record<string, number> }>(
    'madaar_core.api_balances.get_party_outstanding',
    id ? { parties: [id], party_type: 'Supplier' } : undefined,
    id ? `supplier-balance:${id}` : null,
  );
  const currentBalance = id ? (balanceResp?.message?.[id] ?? 0) : 0;

  if (isLoading) return <Loading />;
  if (!s) return <Empty />;

  const displayName = s.madaar_name_ar || s.supplier_name || s.name;
  const isCompany = s.supplier_type === 'Company';
  const isActive = !s.disabled;
  const subtitle = `${s.madaar_supplier_code ?? s.name} — ${isCompany ? 'شركة' : 'فرد'}`;

  return (
    <RequirePerm doctype="Supplier" action="read">
      <PageShell
        title={displayName}
        subtitle={subtitle}
        actions={
          <>
            <Link to={`/suppliers/${encodeURIComponent(s.name)}/edit`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl transition-all">
              <Pencil size={16} />
              {t('action.edit', { defaultValue: 'تعديل' })}
            </Link>
            <button type="button" onClick={() => navigate('/suppliers')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-sm">
              <ArrowRight size={16} />
              {t('action.back', { defaultValue: 'رجوع' })}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="البيانات الأساسية">
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <FieldRow label="الكود"><p className="text-sm font-mono font-semibold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">{s.madaar_supplier_code ?? s.name}</p></FieldRow>
                <FieldRow label="النوع"><p className="text-sm font-semibold">{isCompany ? 'شركة' : 'فرد'}</p></FieldRow>
                <FieldRow label="الاسم بالعربية"><p className="text-sm font-semibold text-slate-800 dark:text-white">{s.madaar_name_ar ?? '—'}</p></FieldRow>
                <FieldRow label="الاسم بالإنجليزية"><p className="text-sm text-slate-600 dark:text-slate-400">{s.madaar_name_en ?? '—'}</p></FieldRow>
                <FieldRow label="التصنيف"><p className="text-sm">{s.madaar_supplier_category ?? '— بدون —'}</p></FieldRow>
                <FieldRow label="الحالة">
                  <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (isActive ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' : 'bg-red-100 dark:bg-red-500/10 text-red-600')}>
                    {isActive ? 'نشط' : 'معطل'}
                  </span>
                </FieldRow>
              </div>
            </Card>

            <Card title="بيانات الاتصال">
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <FieldRow label="البريد الإلكتروني"><p className="text-sm" dir="ltr">{s.madaar_email ?? '—'}</p></FieldRow>
                <FieldRow label="الهاتف"><p className="text-sm font-mono" dir="ltr">{s.madaar_phone ?? '—'}</p></FieldRow>
                <FieldRow label="الموبايل"><p className="text-sm font-mono" dir="ltr">{s.madaar_mobile ?? '—'}</p></FieldRow>
                <FieldRow label="المدينة"><p className="text-sm">{s.madaar_city ?? '—'}</p></FieldRow>
                <FieldRow label="العنوان" span="full"><p className="text-sm">{s.madaar_address ?? '—'}</p></FieldRow>
                <FieldRow label="الرقم الضريبي"><p className="text-sm font-mono" dir="ltr">{s.tax_id ?? '—'}</p></FieldRow>
                <FieldRow label="السجل التجاري"><p className="text-sm font-mono" dir="ltr">{s.madaar_commercial_register ?? '—'}</p></FieldRow>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="البيانات المالية">
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500 mb-1">الرصيد الحالي</p>
                  <p
                    className={
                      'text-3xl font-bold ' +
                      (currentBalance > 0
                        ? 'text-amber-600 dark:text-amber-400'      // we owe them
                        : currentBalance < 0
                          ? 'text-emerald-600 dark:text-emerald-400'  // advance / prepayment
                          : 'text-slate-500')
                    }
                    dir="ltr"
                    title={
                      currentBalance > 0
                        ? 'مستحق للمورد (دائن لدينا)'
                        : currentBalance < 0
                          ? 'دفعة مقدمة للمورد'
                          : 'لا يوجد رصيد'
                    }
                  >
                    {fmtNum(currentBalance)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">ج.م</p>
                </div>
                <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-3">
                  <Row label="الرصيد الافتتاحي" value={fmtNum(s.madaar_opening_balance ?? 0)} />
                  <Row label="شروط الدفع" value={s.payment_terms ?? 'نقدي'} />
                  <Row label="الحساب" value={s.madaar_default_payable_account ?? '—'} mono />
                </div>
              </div>
            </Card>

            {(s.madaar_bank_name || s.madaar_bank_account_number || s.madaar_bank_iban) && (
              <Card title="بيانات البنك">
                <div className="space-y-3">
                  {s.madaar_bank_name && <Row label="اسم البنك" value={s.madaar_bank_name} />}
                  {s.madaar_bank_account_number && <Row label="رقم الحساب" value={s.madaar_bank_account_number} mono />}
                  {s.madaar_bank_iban && <Row label="IBAN" value={s.madaar_bank_iban} mono />}
                </div>
              </Card>
            )}

            {s.madaar_notes && (
              <Card title="ملاحظات">
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{s.madaar_notes}</p>
              </Card>
            )}
          </div>
        </div>
      </PageShell>
    </RequirePerm>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldRow({ label, span, children }: { label: string; span?: 'full'; children: React.ReactNode }) {
  return (
    <div className={span === 'full' ? 'col-span-2' : ''}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={'text-sm font-semibold ' + (mono ? 'font-mono' : '')} dir={mono ? 'ltr' : undefined}>{value}</span>
    </div>
  );
}

function Loading() {
  return <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-6 text-center text-sm text-slate-500">جاري التحميل...</div>;
}
function Empty() {
  return <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-6 text-center text-sm text-slate-500">المورد غير موجود</div>;
}

function fmtNum(n: number): string {
  try {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(n);
  }
}
