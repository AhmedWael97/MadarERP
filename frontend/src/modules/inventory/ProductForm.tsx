/**
 * Inventory > Products — create/edit form override.
 * Matches reference `inventory/products/form.blade.php`.
 *
 * ERPNext doctype: Item. Map:
 *   code           → item_code (autoname when blank)
 *   name_ar        → item_name
 *   name_en        → madaar_name_en       (Custom Field)
 *   barcode        → madaar_barcode       (Custom Field — ERPNext native is a child table)
 *   product_type   → product / service / consumable → mapped to `is_stock_item` + `madaar_product_type`
 *   category_id    → item_group + madaar_product_category
 *   brand_id       → brand
 *   stock_uom      → stock_uom
 *   sale_price     → standard_rate (close enough — ERPNext separates Item Price docs but reference inlines)
 *   purchase_price → madaar_purchase_price (Custom Field)
 *   reorder_level  → safety_stock
 *   default_warehouse → default_warehouse (Custom Field via brand or use madaar_default_warehouse)
 *   is_active      → disabled (inverse)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFrappeCreateDoc, useFrappeGetDoc, useFrappeGetDocList, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { INPUT, Card, Field, Footer, extractFrappeError } from '../accounting/AccountForm';

interface ItemDoc {
  name?: string;
  item_code?: string;
  item_name?: string;
  item_group?: string;
  brand?: string;
  stock_uom?: string;
  standard_rate?: number;
  safety_stock?: number;
  is_stock_item?: 0 | 1;
  disabled?: 0 | 1;
  description?: string;
  madaar_name_en?: string;
  madaar_barcode?: string;
  madaar_product_type?: 'product' | 'service' | 'consumable';
  madaar_product_category?: string;
  madaar_purchase_price?: number;
  madaar_default_warehouse?: string;
}

export default function ProductFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = mode === 'edit';
  return (
    <RequirePerm doctype="Item" action="read">
      <PageShell
        title={isEdit ? 'تعديل منتج' : 'إضافة منتج جديد'}
        subtitle="بيانات المنتج الأساسية والأسعار"
        actions={
          <button type="button" onClick={() => navigate('/inventory/products')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-sm">
            <ArrowRight size={16} /> رجوع
          </button>
        }
      >
        <Body mode={mode} name={id} onDone={() => navigate('/inventory/products')} />
      </PageShell>
    </RequirePerm>
  );
}

function Body({ mode, name, onDone }: { mode: 'create' | 'edit'; name?: string; onDone: () => void }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<ItemDoc>({
    madaar_product_type: 'product',
    is_stock_item: 1,
    disabled: 0,
    stock_uom: 'Nos',
  });

  const { data: existing } = useFrappeGetDoc<ItemDoc>('Item', isEdit ? name : undefined, isEdit && name ? `item:${name}` : null);
  useEffect(() => { if (existing) setValues((v) => ({ ...v, ...existing })); }, [existing]);

  const { data: groups } = useFrappeGetDocList<{ name: string }>('Item Group', { fields: ['name'], limit: 200 });
  const { data: brands } = useFrappeGetDocList<{ name: string }>('Brand', { fields: ['name'], limit: 200 });
  const { data: uoms } = useFrappeGetDocList<{ name: string }>('UOM', { fields: ['name'], limit: 100 });
  const { data: warehouses } = useFrappeGetDocList<{ name: string }>('Warehouse', { fields: ['name'], limit: 100 });
  const { data: categories } = useFrappeGetDocList<{ name: string }>('Madaar Product Category', { fields: ['name'], limit: 200 });

  const { createDoc, loading: creating } = useFrappeCreateDoc();
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const saving = creating || updating;

  function set<K extends keyof ItemDoc>(key: K, val: ItemDoc[K]) {
    setValues((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // ERPNext requires both item_code and item_name. Mirror name_ar into both when code is blank.
    const payload: ItemDoc = {
      ...values,
      item_code: values.item_code || values.item_name,
      // Services/consumables don't carry stock in ERPNext.
      is_stock_item: values.madaar_product_type === 'service' ? 0 : 1,
    };
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v === '' || v === null || v === undefined) continue;
      cleaned[k] = v;
    }
    try {
      if (isEdit && name) {
        await updateDoc('Item', name, cleaned);
        toast.success('تحديث المنتج');
      } else {
        await createDoc('Item', cleaned);
        toast.success('تم الحفظ');
      }
      onDone();
    } catch (e: any) {
      toast.error(extractFrappeError(e) ?? 'تعذر الحفظ');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card title="البيانات الأساسية">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="الاسم بالعربي" required>
            <input type="text" required value={values.item_name ?? ''} onChange={(e) => set('item_name', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الاسم بالإنجليزي">
            <input type="text" dir="ltr" value={values.madaar_name_en ?? ''} onChange={(e) => set('madaar_name_en', e.target.value)} className={INPUT} />
          </Field>
          <Field label="الكود">
            <input type="text" dir="ltr" placeholder="تلقائي" value={values.item_code ?? ''} onChange={(e) => set('item_code', e.target.value)} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="الباركود">
            <input type="text" dir="ltr" placeholder="EAN-13" value={values.madaar_barcode ?? ''} onChange={(e) => set('madaar_barcode', e.target.value)} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="النوع" required>
            <select required value={values.madaar_product_type ?? 'product'} onChange={(e) => set('madaar_product_type', e.target.value as ItemDoc['madaar_product_type'])} className={INPUT}>
              <option value="product">منتج</option>
              <option value="service">خدمة</option>
              <option value="consumable">مستهلك</option>
            </select>
          </Field>
          <Field label="مجموعة الأصناف (Frappe)">
            <select value={values.item_group ?? ''} onChange={(e) => set('item_group', e.target.value)} className={INPUT}>
              <option value="">— اختر —</option>
              {(groups ?? []).map((g) => (<option key={g.name} value={g.name}>{g.name}</option>))}
            </select>
          </Field>
          <Field label="تصنيف مدار">
            <select value={values.madaar_product_category ?? ''} onChange={(e) => set('madaar_product_category', e.target.value)} className={INPUT}>
              <option value="">— بدون —</option>
              {(categories ?? []).map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
            </select>
          </Field>
          <Field label="العلامة التجارية">
            <select value={values.brand ?? ''} onChange={(e) => set('brand', e.target.value)} className={INPUT}>
              <option value="">— بدون —</option>
              {(brands ?? []).map((b) => (<option key={b.name} value={b.name}>{b.name}</option>))}
            </select>
          </Field>
          <Field label="وحدة المخزون">
            <select value={values.stock_uom ?? ''} onChange={(e) => set('stock_uom', e.target.value)} className={INPUT}>
              {(uoms ?? []).map((u) => (<option key={u.name} value={u.name}>{u.name}</option>))}
            </select>
          </Field>
        </div>
      </Card>

      <Card title="الأسعار والمخزون">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="سعر البيع">
            <input type="number" step="0.01" min={0} dir="ltr" placeholder="0.00" value={values.standard_rate ?? ''} onChange={(e) => set('standard_rate', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="سعر الشراء">
            <input type="number" step="0.01" min={0} dir="ltr" placeholder="0.00" value={values.madaar_purchase_price ?? ''} onChange={(e) => set('madaar_purchase_price', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="حد إعادة الطلب">
            <input type="number" step="0.01" min={0} dir="ltr" placeholder="0" value={values.safety_stock ?? ''} onChange={(e) => set('safety_stock', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT + ' font-mono'} />
          </Field>
          <Field label="المخزن الافتراضي">
            <select value={values.madaar_default_warehouse ?? ''} onChange={(e) => set('madaar_default_warehouse', e.target.value)} className={INPUT}>
              <option value="">— بدون —</option>
              {(warehouses ?? []).map((w) => (<option key={w.name} value={w.name}>{w.name}</option>))}
            </select>
          </Field>
        </div>

        <div className="mt-5">
          <Field label="الوصف">
            <textarea rows={3} value={values.description ?? ''} onChange={(e) => set('description', e.target.value)} className={INPUT + ' resize-none'} />
          </Field>
        </div>

        <div className="flex items-center gap-6 mt-5 pt-5 border-t border-slate-100 dark:border-white/5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!values.disabled} onChange={(e) => set('disabled', e.target.checked ? 0 : 1)} className="w-4 h-4 rounded border-slate-300 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)]" />
            <span className="text-sm text-slate-600 dark:text-slate-400">نشط</span>
          </label>
        </div>

        <Footer onDone={onDone} saving={saving} isEdit={isEdit} />
      </Card>
    </form>
  );
}
