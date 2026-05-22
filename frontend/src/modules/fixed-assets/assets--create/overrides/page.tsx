/**
 * Fixed Asset — create form override.
 * Mirrors reference fixed-assets/create.blade.php
 *
 * ERPNext doctype: Asset
 *   asset_name                   → name_ar
 *   madaar_name_en               → name_en (Custom Field)
 *   asset_category               → category (Link → Asset Category)
 *   location                     → location
 *   supplier                     → supplier (Link → Supplier)
 *   serial_no                    → serial number
 *   madaar_warranty_expiry       → warranty expiry date (Custom)
 *   purchase_date                → purchase date
 *   gross_purchase_amount        → purchase cost
 *   expected_value_after_useful_life → salvage value
 *   total_number_of_depreciations → useful life months
 *   frequency_of_depreciation    → months per period
 *   depreciation_method          → method
 *   madaar_depreciation_rate     → annual rate (Custom)
 *   available_for_use_date       → depreciation start date
 *   notes                        → notes
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDocList } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight, Check, X } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, extractFrappeError } from '@/modules/accounting/AccountForm';

const DEP_METHODS = [
  { v: 'Straight Line Method',           label: 'القسط الثابت' },
  { v: 'Written Down Value Method',       label: 'القسط المتناقص' },
  { v: 'Double Declining Balance Method', label: 'وحدات الإنتاج' },
];

interface AssetDoc {
  asset_name?: string;
  madaar_name_en?: string;
  asset_category?: string;
  location?: string;
  supplier?: string;
  serial_no?: string;
  madaar_warranty_expiry?: string;
  purchase_date?: string;
  gross_purchase_amount?: number;
  expected_value_after_useful_life?: number;
  total_number_of_depreciations?: number;
  frequency_of_depreciation?: number;
  depreciation_method?: string;
  madaar_depreciation_rate?: number;
  available_for_use_date?: string;
  notes?: string;
  madaar_description?: string;
}

export default function Page() {
  const navigate = useNavigate();
  return (
    <RequirePerm doctype="Asset" action="read">
      <PageShell
        title="إضافة أصل ثابت جديد"
        subtitle="أدخل بيانات الأصل والإهلاك"
        actions={
          <button
            type="button"
            onClick={() => navigate('/fixed-assets/assets')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-sm"
          >
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body onDone={() => navigate('/fixed-assets/assets')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ onDone }: { onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState<AssetDoc>({
    purchase_date: today,
    total_number_of_depreciations: 60,
    frequency_of_depreciation: 1,
    madaar_depreciation_rate: 20,
    depreciation_method: 'Straight Line Method',
    expected_value_after_useful_life: 0,
  });
  const [saving, setSaving] = useState(false);
  const { createDoc } = useFrappeCreateDoc();

  const { data: categories } = useFrappeGetDocList<{ name: string; asset_category_name?: string }>(
    'Asset Category',
    { fields: ['name', 'asset_category_name'], limit: 200 },
  );
  const { data: suppliers } = useFrappeGetDocList<{ name: string; supplier_name?: string }>(
    'Supplier',
    { fields: ['name', 'supplier_name'], limit: 300 },
  );
  const { data: costCenters } = useFrappeGetDocList<{ name: string }>(
    'Cost Center',
    { fields: ['name'], limit: 100 },
  );

  // When category changes, auto-fill depreciation defaults from the category.
  const { data: allCats } = useFrappeGetDocList<{
    name: string;
    total_number_of_depreciations?: number;
    frequency_of_depreciation?: number;
    depreciation_method?: string;
    madaar_depreciation_rate?: number;
  }>(
    'Asset Category',
    {
      fields: ['name', 'total_number_of_depreciations', 'frequency_of_depreciation', 'depreciation_method', 'madaar_depreciation_rate'],
      limit: 200,
    },
  );

  useEffect(() => {
    if (!values.asset_category) return;
    const cat = (allCats ?? []).find((c) => c.name === values.asset_category);
    if (!cat) return;
    setValues((v) => ({
      ...v,
      total_number_of_depreciations: cat.total_number_of_depreciations ?? v.total_number_of_depreciations,
      frequency_of_depreciation: cat.frequency_of_depreciation ?? v.frequency_of_depreciation,
      depreciation_method: cat.depreciation_method ?? v.depreciation_method,
      madaar_depreciation_rate: cat.madaar_depreciation_rate ?? v.madaar_depreciation_rate,
    }));
  }, [values.asset_category, allCats]);

  function set<K extends keyof AssetDoc>(key: K, val: AssetDoc[K]) {
    setValues((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v === '' || v === null || v === undefined) continue;
        payload[k] = v;
      }
      // ERPNext Asset requires item_code or asset_name; set asset_name
      if (!payload.asset_name) {
        toast.error('يرجى إدخال اسم الأصل');
        return;
      }
      await createDoc('Asset', payload as any);
      toast.success('تم حفظ الأصل');
      onDone();
    } catch (err: any) {
      toast.error(extractFrappeError(err) ?? 'تعذر الحفظ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic data */}
      <Card title="البيانات الأساسية">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="الاسم بالعربية" required>
            <input type="text" required value={values.asset_name ?? ''} onChange={(e) => set('asset_name', e.target.value)} className={INPUT} placeholder="مثال: سيارة نيسان" />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input type="text" dir="ltr" value={values.madaar_name_en ?? ''} onChange={(e) => set('madaar_name_en', e.target.value)} className={INPUT} />
          </Field>
          <Field label="التصنيف" required>
            <select required value={values.asset_category ?? ''} onChange={(e) => set('asset_category', e.target.value)} className={INPUT}>
              <option value="">— اختر التصنيف —</option>
              {(categories ?? []).map((c) => (
                <option key={c.name} value={c.name}>{c.asset_category_name ?? c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="المورد">
            <select value={values.supplier ?? ''} onChange={(e) => set('supplier', e.target.value)} className={INPUT}>
              <option value="">— بدون —</option>
              {(suppliers ?? []).map((s) => (
                <option key={s.name} value={s.name}>{s.supplier_name ?? s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="الموقع">
            <input type="text" value={values.location ?? ''} onChange={(e) => set('location', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الرقم التسلسلي">
            <input type="text" dir="ltr" value={values.serial_no ?? ''} onChange={(e) => set('serial_no', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تاريخ انتهاء الضمان">
            <input type="date" value={values.madaar_warranty_expiry ?? ''} onChange={(e) => set('madaar_warranty_expiry', e.target.value)} className={INPUT} />
          </Field>
          <div className="lg:col-span-3">
            <Field label="وصف">
              <textarea rows={2} value={values.madaar_description ?? ''} onChange={(e) => set('madaar_description', e.target.value)} className={INPUT + ' resize-none'} />
            </Field>
          </div>
        </div>
      </Card>

      {/* Financial & depreciation data */}
      <Card title="البيانات المالية والإهلاك">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="تاريخ الشراء" required>
            <input type="date" required value={values.purchase_date ?? today} onChange={(e) => set('purchase_date', e.target.value)} className={INPUT} />
          </Field>
          <Field label="تكلفة الشراء" required>
            <input type="number" required step="0.01" min="0.01" dir="ltr" value={values.gross_purchase_amount ?? ''} onChange={(e) => set('gross_purchase_amount', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="القيمة التخريدية">
            <input type="number" step="0.01" min="0" dir="ltr" value={values.expected_value_after_useful_life ?? 0} onChange={(e) => set('expected_value_after_useful_life', Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="العمر الافتراضي (أشهر)" required>
            <input type="number" required min={1} dir="ltr" id="useful_life" value={values.total_number_of_depreciations ?? 60} onChange={(e) => set('total_number_of_depreciations', Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="طريقة الإهلاك" required>
            <select required value={values.depreciation_method ?? 'Straight Line Method'} onChange={(e) => set('depreciation_method', e.target.value)} className={INPUT}>
              {DEP_METHODS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="نسبة الإهلاك السنوية %">
            <input type="number" step="0.01" min={0} max={100} dir="ltr" value={values.madaar_depreciation_rate ?? 20} onChange={(e) => set('madaar_depreciation_rate', Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="تاريخ بدء الإهلاك">
            <input type="date" value={values.available_for_use_date ?? ''} onChange={(e) => set('available_for_use_date', e.target.value)} className={INPUT} />
            <p className="text-xs text-slate-400 mt-1">إذا ترك فارغاً يستخدم تاريخ الشراء</p>
          </Field>
          <div className="lg:col-span-2">
            <Field label="ملاحظات">
              <textarea rows={2} value={values.notes ?? ''} onChange={(e) => set('notes', e.target.value)} className={INPUT + ' resize-none'} />
            </Field>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onDone} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-sm">
          <X size={16} /> إلغاء
        </button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
          <Check size={16} />
          {saving ? 'جارٍ الحفظ...' : 'حفظ الأصل'}
        </button>
      </div>
    </form>
  );
}
