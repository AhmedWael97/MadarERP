/**
 * InvoiceItemsTable — purpose-built items grid for Sales / Purchase invoices & orders.
 *
 * Unlike the generic LineItemsTable, this component:
 *   - Shows a searchable combobox (type-ahead) for the Item column so the user
 *     can quickly find a product by name or code.
 *   - Auto-fills rate / item_name / uom when an item is selected.
 *   - Recalculates `amount = qty × rate` on every qty or rate change.
 *   - Exposes a `priceField` prop so Sales forms use `standard_rate` while
 *     Purchase forms can use `valuation_rate` (falls back to `standard_rate`).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { Plus, Trash2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemDoc {
  name: string;
  item_name?: string;
  standard_rate?: number;
  valuation_rate?: number;
  stock_uom?: string;
}

export interface InvoiceItemsTableProps {
  form: UseFormReturn<any>;
  /** react-hook-form field array name — usually "items". */
  fieldname?: string;
  /**
   * Which price field to pull when an item is selected.
   * `standard_rate` (default) works for both sales and purchases in most setups.
   */
  priceField?: 'standard_rate' | 'valuation_rate';
}

// ─── Shared input class ───────────────────────────────────────────────────────

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)] transition-all disabled:opacity-50';

// ─── Main table ───────────────────────────────────────────────────────────────

export function InvoiceItemsTable({
  form,
  fieldname = 'items',
  priceField = 'standard_rate',
}: InvoiceItemsTableProps) {
  const { fields: rows, append, remove } = useFieldArray({
    control: form.control,
    name: fieldname,
  });

  // Fetch all active items once — passed to every combobox cell.
  const { data: itemsData } = useFrappeGetDocList<ItemDoc>('Item', {
    fields: ['name', 'item_name', 'standard_rate', 'valuation_rate', 'stock_uom'],
    filters: [['disabled', '=', 0]],
    limit: 500,
    orderBy: { field: 'item_name', order: 'asc' },
  });

  const { data: warehousesData } = useFrappeGetDocList<{ name: string }>('Warehouse', {
    fields: ['name'],
    limit: 100,
  });

  const itemsList = itemsData ?? [];
  const warehouseList = warehousesData ?? [];

  // Called when the user picks an item from the combobox.
  function handleItemSelect(idx: number, item: ItemDoc) {
    const price = Number(item[priceField] ?? item.standard_rate ?? 0);
    const qty = Number(form.getValues(`${fieldname}.${idx}.qty`) || 1);
    form.setValue(`${fieldname}.${idx}.item_code`, item.name, { shouldDirty: true });
    form.setValue(`${fieldname}.${idx}.item_name`, item.item_name ?? item.name, { shouldDirty: true });
    form.setValue(`${fieldname}.${idx}.rate`, price, { shouldDirty: true });
    form.setValue(`${fieldname}.${idx}.uom`, item.stock_uom ?? '', { shouldDirty: true });
    form.setValue(`${fieldname}.${idx}.amount`, +(qty * price).toFixed(2), { shouldDirty: true });
  }

  // Recalculate amount whenever qty or rate changes.
  function recalcAmount(idx: number) {
    const qty = Number(form.getValues(`${fieldname}.${idx}.qty`) || 0);
    const rate = Number(form.getValues(`${fieldname}.${idx}.rate`) || 0);
    form.setValue(`${fieldname}.${idx}.amount`, +(qty * rate).toFixed(2), { shouldDirty: true });
  }

  // Running totals shown in the footer row.
  const watchedRows = form.watch(fieldname) as Array<Record<string, unknown>> | undefined;
  const totalQty = useMemo(
    () => (watchedRows ?? []).reduce((s, r) => s + Number(r?.qty || 0), 0),
    [watchedRows],
  );
  const totalAmount = useMemo(
    () => (watchedRows ?? []).reduce((s, r) => s + Number(r?.amount || 0), 0),
    [watchedRows],
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/[0.02]">
            <tr className="text-xs font-bold text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
              <th className="w-8 px-3 py-2.5 text-center">#</th>
              <th className="px-3 py-2.5 text-start min-w-[200px]">الصنف</th>
              <th className="px-3 py-2.5 text-start w-28">الكمية</th>
              <th className="px-3 py-2.5 text-start w-36">
                السعر <em className="not-italic text-red-500">*</em>
              </th>
              <th className="px-3 py-2.5 text-start w-36">
                المبلغ <em className="not-italic text-red-500">*</em>
              </th>
              <th className="px-3 py-2.5 text-start w-40">المخزن</th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-sm text-slate-400"
                >
                  لا توجد أصناف — اضغط &quot;+ إضافة سطر&quot;
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                {/* # */}
                <td className="px-3 py-2 text-center text-xs text-slate-400 font-mono">
                  {idx + 1}
                </td>

                {/* Item combobox */}
                <td className="px-2 py-2">
                  <ItemCombobox
                    value={String(form.watch(`${fieldname}.${idx}.item_code`) ?? '')}
                    displayValue={String(form.watch(`${fieldname}.${idx}.item_name`) ?? '')}
                    items={itemsList}
                    onSelect={(item) => handleItemSelect(idx, item)}
                  />
                </td>

                {/* Qty */}
                <td className="px-2 py-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    dir="ltr"
                    placeholder="1"
                    {...form.register(`${fieldname}.${idx}.qty`, {
                      valueAsNumber: true,
                      onChange: () => recalcAmount(idx),
                    })}
                    className={INPUT_CLS + ' text-end font-mono'}
                  />
                </td>

                {/* Rate */}
                <td className="px-2 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    dir="ltr"
                    placeholder="0.00"
                    required
                    {...form.register(`${fieldname}.${idx}.rate`, {
                      valueAsNumber: true,
                      onChange: () => recalcAmount(idx),
                    })}
                    className={INPUT_CLS + ' text-end font-mono'}
                  />
                </td>

                {/* Amount (read-only, auto-calculated) */}
                <td className="px-2 py-2">
                  <input
                    type="number"
                    step="0.01"
                    dir="ltr"
                    readOnly
                    tabIndex={-1}
                    {...form.register(`${fieldname}.${idx}.amount`, { valueAsNumber: true })}
                    className={
                      INPUT_CLS +
                      ' text-end font-mono bg-slate-50 dark:bg-white/[0.02] cursor-default text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] font-semibold'
                    }
                  />
                </td>

                {/* Warehouse */}
                <td className="px-2 py-2">
                  <select
                    {...form.register(`${fieldname}.${idx}.warehouse`)}
                    className={INPUT_CLS}
                  >
                    <option value="">— المخزن —</option>
                    {warehouseList.map((w) => (
                      <option key={w.name} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Delete */}
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    aria-label="حذف السطر"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}

            {/* Totals footer */}
            {rows.length > 0 && (
              <tr className="bg-slate-50 dark:bg-white/[0.02] border-t-2 border-slate-200 dark:border-white/10 font-semibold text-sm">
                <td />
                <td className="px-3 py-2 text-xs font-bold text-slate-500">الإجمالي</td>
                <td className="px-3 py-2 text-end font-mono text-xs text-slate-600" dir="ltr">
                  {fmtNum(totalQty)}
                </td>
                <td />
                <td
                  className="px-3 py-2 text-end font-mono text-[color:var(--color-brand-600)]"
                  dir="ltr"
                >
                  {fmtNum(totalAmount)}
                </td>
                <td colSpan={2} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() =>
            append({ item_code: '', item_name: '', qty: 1, rate: 0, amount: 0, uom: '', warehouse: '' })
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[color:var(--color-brand-600)] hover:text-[color:var(--color-brand-700)] hover:bg-[color:var(--color-brand-50,#ecfdf5)] dark:hover:bg-[color:var(--color-brand-900,#064e3b)]/20 rounded-lg transition-colors"
        >
          <Plus size={14} /> إضافة سطر
        </button>
      </div>
    </div>
  );
}

// ─── Item Combobox ────────────────────────────────────────────────────────────

interface ItemComboboxProps {
  /** Current `item_code` value (used to highlight the selected option). */
  value: string;
  /** Display name shown in the input when not actively searching. */
  displayValue: string;
  items: ItemDoc[];
  onSelect: (item: ItemDoc) => void;
}

function ItemCombobox({ value, displayValue, items, onSelect }: ItemComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // What the input shows: search query while typing, selected name when idle.
  const inputValue = open ? query : displayValue || value || '';

  // Filter items by query — case-insensitive match on name or item_name.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 60);
    return items
      .filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          (it.item_name ?? '').toLowerCase().includes(q),
      )
      .slice(0, 60);
  }, [items, query]);

  // Close when clicking outside the container.
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        autoComplete="off"
        value={inputValue}
        placeholder="ابحث عن صنف..."
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery('');
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        className={INPUT_CLS}
      />

      {open && (
        <div className="absolute z-50 start-0 mt-1 w-full min-w-[240px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-2xl max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-400">لا توجد نتائج</p>
          ) : (
            filtered.map((it) => (
              <button
                key={it.name}
                type="button"
                onMouseDown={(e) => {
                  // Prevent input blur before the click registers.
                  e.preventDefault();
                  onSelect(it);
                  setQuery('');
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2.5 text-start transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
                  value === it.name
                    ? 'bg-[color:var(--color-brand-50,#ecfdf5)] dark:bg-[color:var(--color-brand-900,#064e3b)]/20'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="block text-sm font-semibold text-slate-800 dark:text-white">
                      {it.item_name ?? it.name}
                    </span>
                    {it.item_name && it.item_name !== it.name && (
                      <span className="block text-xs text-slate-400">{it.name}</span>
                    )}
                  </div>
                  {(it.standard_rate ?? 0) > 0 && (
                    <span className="shrink-0 text-xs font-mono font-semibold text-[color:var(--color-brand-600)]">
                      {fmtNum(Number(it.standard_rate))}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return String(n);
  }
}
