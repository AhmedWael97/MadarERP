/**
 * Customer detail/show page — matches reference Blade
 *   `H:/coupons/Madaar ERP/Madaar ERP/resources/views/customers/show.blade.php`.
 *
 * 3-column layout on lg+:
 *   - Main info card (basic data: code, name, type, status, category)
 *   - Contact info card (email, phones, city, address, tax info)
 *   - Side panel: financial summary (credit/opening/payment terms/account)
 *   - Optional notes card
 */
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFrappeGetDoc } from 'frappe-react-sdk';
import { ArrowRight, Pencil } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';

interface CustomerDoc {
  name: string;
  customer_name?: string;
  customer_type?: 'Individual' | 'Company';
  tax_id?: string;
  payment_terms?: string;
  disabled?: 0 | 1;
  madaar_customer_code?: string;
  madaar_name_ar?: string;
  madaar_name_en?: string;
  madaar_city?: string;
  madaar_country?: string;
  madaar_customer_category?: string;
  madaar_default_receivable_account?: string;
  madaar_discount_percentage?: number;
  madaar_sales_person?: string;
  madaar_notes?: string;
  madaar_address?: string;
  madaar_phone?: string;
  madaar_mobile?: string;
  madaar_email?: string;
  madaar_postal_code?: string;
  madaar_commercial_register?: string;
  madaar_credit_limit?: number;
  madaar_opening_balance?: number;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: c, isLoading } = useFrappeGetDoc<CustomerDoc>('Customer', id);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-6 text-center text-sm text-slate-500">
        جاري التحميل...
      </div>
    );
  }
  if (!c) {
    return (
      <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-6 text-center text-sm text-slate-500">
        العميل غير موجود
      </div>
    );
  }

  const displayName = c.madaar_name_ar || c.customer_name || c.name;
  const isCompany = c.customer_type === 'Company';
  const isActive = !c.disabled;
  const subtitle = `${c.madaar_customer_code ?? c.name} — ${isCompany ? 'شركة' : 'فرد'}`;

  return (
    <RequirePerm doctype="Customer" action="read">
      <PageShell
        title={displayName}
        subtitle={subtitle}
        actions={
          <>
            <Link
              to={`/customers/${encodeURIComponent(c.name)}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl transition-all"
            >
              <Pencil size={16} />
              {t('action.edit', { defaultValue: 'تعديل' })}
            </Link>
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-sm"
            >
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
                <Field label="الكود">
                  <p className="text-sm font-mono font-semibold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
                    {c.madaar_customer_code ?? c.name}
                  </p>
                </Field>
                <Field label="النوع">
                  <p className="text-sm font-semibold">{isCompany ? 'شركة' : 'فرد'}</p>
                </Field>
                <Field label="الاسم بالعربية">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {c.madaar_name_ar ?? '—'}
                  </p>
                </Field>
                <Field label="الاسم بالإنجليزية">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {c.madaar_name_en ?? '—'}
                  </p>
                </Field>
                <Field label="التصنيف">
                  <p className="text-sm">{c.madaar_customer_category ?? '— بدون —'}</p>
                </Field>
                <Field label="الحالة">
                  <span
                    className={
                      'text-xs font-semibold px-2 py-0.5 rounded-full ' +
                      (isActive
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600'
                        : 'bg-red-100 dark:bg-red-500/10 text-red-600')
                    }
                  >
                    {isActive ? 'نشط' : 'معطل'}
                  </span>
                </Field>
              </div>
            </Card>

            <Card title="بيانات الاتصال">
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <Field label="البريد الإلكتروني">
                  <p className="text-sm" dir="ltr">{c.madaar_email ?? '—'}</p>
                </Field>
                <Field label="الهاتف">
                  <p className="text-sm font-mono" dir="ltr">{c.madaar_phone ?? '—'}</p>
                </Field>
                <Field label="الموبايل">
                  <p className="text-sm font-mono" dir="ltr">{c.madaar_mobile ?? '—'}</p>
                </Field>
                <Field label="المدينة">
                  <p className="text-sm">{c.madaar_city ?? '—'}</p>
                </Field>
                <Field label="العنوان" span="full">
                  <p className="text-sm">{c.madaar_address ?? '—'}</p>
                </Field>
                <Field label="الرقم الضريبي">
                  <p className="text-sm font-mono" dir="ltr">{c.tax_id ?? '—'}</p>
                </Field>
                <Field label="السجل التجاري">
                  <p className="text-sm font-mono" dir="ltr">{c.madaar_commercial_register ?? '—'}</p>
                </Field>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="البيانات المالية">
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500 mb-1">الرصيد الحالي</p>
                  {/* No native balance field on ERPNext Customer — opening_balance shown as a stand-in.
                      Future: call frappe.utils.get_balance_on(party=...) to compute live balance. */}
                  <p
                    className={
                      'text-3xl font-bold ' +
                      ((c.madaar_opening_balance ?? 0) > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400')
                    }
                    dir="ltr"
                  >
                    {fmtNum(c.madaar_opening_balance ?? 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">ج.م</p>
                </div>
                <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-3">
                  <Row label="حد الائتمان" value={fmtNum(c.madaar_credit_limit ?? 0)} />
                  <Row label="الرصيد الافتتاحي" value={fmtNum(c.madaar_opening_balance ?? 0)} />
                  <Row label="شروط الدفع" value={c.payment_terms ?? 'نقدي'} />
                  <Row label="الحساب" value={c.madaar_default_receivable_account ?? '—'} mono />
                </div>
              </div>
            </Card>

            {c.madaar_notes && (
              <Card title="ملاحظات">
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {c.madaar_notes}
                </p>
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

function Field({
  label,
  span,
  children,
}: {
  label: string;
  span?: 'full';
  children: React.ReactNode;
}) {
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
      <span className={'text-sm font-semibold ' + (mono ? 'font-mono' : '')} dir={mono ? 'ltr' : undefined}>
        {value}
      </span>
    </div>
  );
}

function fmtNum(n: number): string {
  try {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(n);
  }
}
