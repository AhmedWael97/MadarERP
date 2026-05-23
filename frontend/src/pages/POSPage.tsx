/**
 * POSPage â€” Retail Point-of-Sale cashier interface.
 *
 * Flow:
 *  1. On load: check `madaar_core.api.current_pos_opening` for the user's open shift.
 *  2. No shift â†’ POS Profile picker + opening-cash dialog â†’ `open_pos_shift`.
 *  3. Shift open â†’ Cashier UI (barcode + search + grid + cart + payment).
 *  4. On close â†’ `close_pos_shift` flips the Opening Entry to Closed.
 *
 * Layout:  [Product catalog (60%)] | [Cart + Customer + Payment (40%)]
 *
 * Backend (custom + ERPNext):
 *  - Profile:   madaar_core.api.{list_pos_profiles,current_pos_opening,open/close_pos_shift}
 *  - Barcode:   madaar_core.api.lookup_item_by_barcode  (Item Barcode + madaar_barcode fallback)
 *  - Modes:     madaar_core.api.get_pos_payment_modes(pos_profile)
 *  - Catalog:   Item / Item Price / Item Group / Customer (frappe.client.get_list)
 *  - Invoice:   POS Invoice (is_pos=1, update_stock, pos_profile, set_warehouse)
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useFrappeGetDocList,
  useFrappeCreateDoc,
  useFrappeGetCall,
  useFrappePostCall,
} from 'frappe-react-sdk';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  FileText,
  X,
  Check,
  User,
  ChevronDown,
  Percent,
  RefreshCw,
  Barcode,
  LogIn,
  LogOut,
  Store,
  Pause,
  Play,
  Truck,
  Utensils,
  LayoutGrid,
  Clock,
} from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface POSItem {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  image?: string;
  price: number;
  stock_uom?: string;
}

interface CartLine {
  item: POSItem;
  qty: number;
  rate: number;          // may be overridden per line
  discount_pct: number;  // 0-100
}

interface PaymentEntry {
  mode: string;
  amount: number;
}

interface PaymentMode {
  mode: string;
  type: string;          // Cash | Bank | General | Phone | ...
  default: number;       // 0 | 1
}

interface POSProfile {
  name: string;
  company: string;
  warehouse: string;
  currency: string;
  customer?: string;
  selling_price_list?: string;
  cost_center?: string;
  write_off_account?: string;
  write_off_cost_center?: string;
}

interface POSOpening {
  name: string;
  pos_profile: string;
  company: string;
  period_start_date: string;
  posting_date: string;
  summary?: { invoice_count: number; total_sales: number };
}

type OrderType = 'walkin' | 'delivery' | 'dinein';

interface RestaurantTable {
  name: string;
  table_number: string;
  hall: string;
  capacity?: number;
  status: string;
}

interface HeldOrder {
  id: string;
  posProfile: string;
  posMode: 'retail' | 'restaurant';
  timestamp: number;
  orderType: OrderType;
  table?: string;
  tableNumber?: string;
  customer: string;
  customerSearch: string;
  cart: CartLine[];
  globalDiscount: number;
}

// â”€â”€â”€ LocalStorage helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function holdKey(posMode: string, profile: string) {
  return `madaar_held_${posMode}_${profile}`;
}
function loadHeldOrders(posMode: string, profile: string): HeldOrder[] {
  try {
    return JSON.parse(localStorage.getItem(holdKey(posMode, profile)) ?? '[]');
  } catch {
    return [];
  }
}
function saveHeldOrders(posMode: string, profile: string, orders: HeldOrder[]) {
  localStorage.setItem(holdKey(posMode, profile), JSON.stringify(orders));
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function cartLineTotal(line: CartLine) {
  return line.qty * line.rate * (1 - line.discount_pct / 100);
}

function formatCurrency(val: number) {
  return val.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

// â”€â”€â”€ Sub-component: OrderTypePicker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OrderTypePicker({
  posMode,
  value,
  onChange,
  isAr,
}: {
  posMode: 'retail' | 'restaurant';
  value: OrderType;
  onChange: (t: OrderType) => void;
  isAr: boolean;
}) {
  const types = [
    { type: 'walkin' as OrderType,   ar: 'Ø­Ø¶ÙˆØ±ÙŠ',      en: 'Walk-in',  icon: <User size={13} /> },
    { type: 'delivery' as OrderType, ar: 'ØªÙˆØµÙŠÙ„',      en: 'Delivery', icon: <Truck size={13} /> },
    ...(posMode === 'restaurant'
      ? [{ type: 'dinein' as OrderType, ar: 'Ø¯Ø§Ø®Ù„ Ø§Ù„ØµØ§Ù„Ø©', en: 'Dine-in', icon: <Utensils size={13} /> }]
      : []),
  ];
  return (
    <div className="flex gap-1.5 flex-wrap">
      {types.map((t) => (
        <button
          key={t.type}
          type="button"
          onClick={() => onChange(t.type)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            value === t.type
              ? 'bg-[color:var(--color-brand-600)] text-white border-[color:var(--color-brand-600)]'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[color:var(--color-brand-400)]'
          }`}
        >
          {t.icon}
          {isAr ? t.ar : t.en}
        </button>
      ))}
    </div>
  );
}

// â”€â”€â”€ Sub-component: TablePickerModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TablePickerModal({
  tables,
  selectedTable,
  onSelect,
  onClose,
  isAr,
}: {
  tables: RestaurantTable[];
  selectedTable: string;
  onSelect: (t: RestaurantTable) => void;
  onClose: () => void;
  isAr: boolean;
}) {
  const halls = useMemo(() => {
    const map: Record<string, RestaurantTable[]> = {};
    tables.forEach((t) => { (map[t.hall] ??= []).push(t); });
    return map;
  }, [tables]);

  function statusColor(status: string) {
    switch (status) {
      case 'Available': return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300';
      case 'Occupied':  return 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300';
      case 'Reserved':  return 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300';
      default:          return 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400';
    }
  }
  function statusLabel(s: string) {
    if (!isAr) return s;
    return s === 'Available' ? 'Ù…ØªØ§Ø­Ø©' : s === 'Occupied' ? 'Ù…Ø´ØºÙˆÙ„Ø©' : s === 'Reserved' ? 'Ù…Ø­Ø¬ÙˆØ²Ø©' : 'Ø®Ø§Ø±Ø¬ Ø§Ù„Ø®Ø¯Ù…Ø©';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 bg-[color:var(--color-brand-600)] text-white shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <LayoutGrid size={20} />
            {isAr ? 'Ø§Ø®ØªØ± Ø·Ø§ÙˆÙ„Ø©' : 'Select a Table'}
          </h2>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="flex gap-4 px-5 py-3 border-b border-slate-100 dark:border-white/5 flex-wrap shrink-0">
          {[['Available', isAr ? 'Ù…ØªØ§Ø­Ø©' : 'Available', 'bg-emerald-400'], ['Occupied', isAr ? 'Ù…Ø´ØºÙˆÙ„Ø©' : 'Occupied', 'bg-rose-400'], ['Reserved', isAr ? 'Ù…Ø­Ø¬ÙˆØ²Ø©' : 'Reserved', 'bg-amber-400'], ['oos', isAr ? 'Ø®Ø§Ø±Ø¬ Ø§Ù„Ø®Ø¯Ù…Ø©' : 'Out of Service', 'bg-slate-400']].map(([, label, dot]) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />{label}
            </span>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {Object.entries(halls).map(([hall, ts]) => (
            <div key={hall}>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{hall}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {ts.map((t) => {
                  const isSel = t.name === selectedTable;
                  const canSel = t.status === 'Available' || isSel;
                  return (
                    <button key={t.name} type="button" disabled={!canSel} onClick={() => onSelect(t)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition font-bold text-sm ${
                        isSel
                          ? 'border-[color:var(--color-brand-600)] bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-900)]/30 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-300)]'
                          : canSel ? `${statusColor(t.status)} hover:border-[color:var(--color-brand-400)] cursor-pointer`
                          : `${statusColor(t.status)} opacity-50 cursor-not-allowed`
                      }`}
                    >
                      <span className="text-xl font-black">{t.table_number}</span>
                      {t.capacity != null && <span className="text-[10px] font-normal opacity-70">{t.capacity} {isAr ? 'Ù…Ù‚Ø¹Ø¯' : 'seats'}</span>}
                      <span className="text-[10px] font-semibold">{statusLabel(t.status)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {tables.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">
              {isAr ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ø§ÙˆÙ„Ø§Øª â€” Ø£Ø¶Ù Ø·Ø§ÙˆÙ„Ø§Øª Ù…Ù† Ù‚Ø³Ù… Ø§Ù„Ù…Ø·Ø¹Ù…' : 'No tables found. Add tables from the Restaurant module.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Sub-component: HeldOrdersModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HeldOrdersModal({
  orders,
  onResume,
  onDelete,
  onClose,
  isAr,
  currency,
}: {
  orders: HeldOrder[];
  onResume: (o: HeldOrder) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isAr: boolean;
  currency: string;
}) {
  const label = (t: OrderType) => ({ walkin: isAr ? 'Ø­Ø¶ÙˆØ±ÙŠ' : 'Walk-in', delivery: isAr ? 'ØªÙˆØµÙŠÙ„' : 'Delivery', dinein: isAr ? 'Ø¯Ø§Ø®Ù„ Ø§Ù„ØµØ§Ù„Ø©' : 'Dine-in' })[t];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 bg-amber-600 text-white shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Pause size={18} />
            {isAr ? `Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ø¹Ù„Ù‚Ø© (${orders.length})` : `Held Orders (${orders.length})`}
          </h2>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {orders.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">{isAr ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©' : 'No held orders'}</p>
          )}
          {orders.map((o) => {
            const raw = o.cart.reduce((s, l) => s + cartLineTotal(l), 0);
            const total = raw * (1 - o.globalDiscount / 100);
            return (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 dark:text-white truncate">
                    {o.customerSearch || (isAr ? 'Ø²Ø§Ø¦Ø±' : 'Walk-in')}
                    {o.tableNumber && <span className="ms-2 text-xs text-[color:var(--color-brand-600)]">{isAr ? `â€¢ Ø·Ø§ÙˆÙ„Ø© ${o.tableNumber}` : `â€¢ Table ${o.tableNumber}`}</span>}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><Clock size={10} />{formatTime(o.timestamp)}</span>
                    <span>{label(o.orderType)}</span>
                    <span>{o.cart.length} {isAr ? 'ØµÙ†Ù' : 'items'}</span>
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-black text-[color:var(--color-brand-600)]">{formatCurrency(total)}</p>
                  <p className="text-[10px] text-slate-400">{currency}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button type="button" onClick={() => onResume(o)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition">
                    <Play size={11} />{isAr ? 'Ø§Ø³ØªÙƒÙ…Ø§Ù„' : 'Resume'}
                  </button>
                  <button type="button" onClick={() => onDelete(o.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200/50 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition">
                    <Trash2 size={11} />{isAr ? 'Ø­Ø°Ù' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Sub-component: Product card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProductCard({
  item,
  onAdd,
  isAr,
}: {
  item: POSItem;
  onAdd: (item: POSItem) => void;
  isAr: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(item)}
      className="group flex flex-col bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-[color:var(--color-brand-400)] hover:shadow-lg transition-all overflow-hidden text-start"
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.item_name}
          className="w-full h-28 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="w-full h-28 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
          <ShoppingCart size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
      )}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="text-xs font-bold text-slate-700 dark:text-white line-clamp-2 leading-tight">
          {item.item_name}
        </p>
        <p className="text-[10px] text-slate-400">{item.item_code}</p>
        <p className="mt-auto text-sm font-black text-[color:var(--color-brand-600)]">
          {formatCurrency(item.price)} {isAr ? 'Ø¬.Ù…' : 'EGP'}
        </p>
      </div>
      <div className="px-3 pb-3">
        <span className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl bg-[color:var(--color-brand-600)] text-white text-xs font-bold group-hover:bg-[color:var(--color-brand-500)] transition">
          <Plus size={12} />
          {isAr ? 'Ø¥Ø¶Ø§ÙØ©' : 'Add'}
        </span>
      </div>
    </button>
  );
}

// â”€â”€â”€ Sub-component: Cart line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CartLineRow({
  line,
  onChange,
  onRemove,
  isAr,
  currency,
}: {
  line: CartLine;
  onChange: (updated: CartLine) => void;
  onRemove: () => void;
  isAr: boolean;
  currency: string;
}) {
  const total = cartLineTotal(line);
  return (
    <div className="flex items-start gap-2 py-2 border-b border-slate-50 dark:border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700 dark:text-white truncate">{line.item.item_name}</p>
        <p className="text-[10px] text-slate-400">{line.item.item_code}</p>
        {/* Rate override */}
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          <span className="text-[10px] text-slate-400">{isAr ? 'Ø§Ù„Ø³Ø¹Ø±:' : 'Price:'}</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={line.rate}
            onChange={(e) => onChange({ ...line, rate: parseFloat(e.target.value) || 0 })}
            className="w-16 px-1 py-0.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-white"
          />
          <span className="text-[10px] text-slate-400 ms-1">{isAr ? 'Ø®ØµÙ…%:' : 'Disc%:'}</span>
          <input
            type="number"
            min={0}
            max={100}
            value={line.discount_pct}
            onChange={(e) => onChange({ ...line, discount_pct: parseFloat(e.target.value) || 0 })}
            className="w-12 px-1 py-0.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-white"
          />
        </div>
      </div>
      {/* Qty stepper */}
      <div className="flex items-center gap-1 mt-1">
        <button
          type="button"
          onClick={() => onChange({ ...line, qty: Math.max(1, line.qty - 1) })}
          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition"
        >
          <Minus size={10} />
        </button>
        <span className="w-7 text-center text-xs font-bold">{line.qty}</span>
        <button
          type="button"
          onClick={() => onChange({ ...line, qty: line.qty + 1 })}
          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition"
        >
          <Plus size={10} />
        </button>
      </div>
      {/* Total + remove */}
      <div className="flex flex-col items-end gap-1 min-w-[56px]">
        <p className="text-xs font-black text-slate-800 dark:text-white">
          {formatCurrency(total)}
        </p>
        <p className="text-[9px] text-slate-400">{currency}</p>
        <button
          type="button"
          onClick={onRemove}
          className="text-rose-400 hover:text-rose-600 transition"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Sub-component: Payment Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PaymentModal({
  isAr,
  total,
  currency,
  modes,
  payments,
  onPaymentsChange,
  onConfirm,
  onClose,
  saving,
}: {
  isAr: boolean;
  total: number;
  currency: string;
  modes: PaymentMode[];
  payments: PaymentEntry[];
  onPaymentsChange: (p: PaymentEntry[]) => void;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const change = Math.max(0, paid - total);
  const remaining = Math.max(0, total - paid);

  function setModeAmount(mode: string, amount: number) {
    const idx = payments.findIndex((p) => p.mode === mode);
    if (idx >= 0) {
      const next = [...payments];
      next[idx] = { mode, amount };
      onPaymentsChange(next);
    } else {
      onPaymentsChange([...payments, { mode, amount }]);
    }
  }

  function getModeAmount(mode: string) {
    return payments.find((p) => p.mode === mode)?.amount ?? 0;
  }

  function iconFor(m: PaymentMode) {
    const t = (m.type || '').toLowerCase();
    if (t === 'cash') return <Banknote size={16} />;
    if (t === 'bank' || t === 'card') return <CreditCard size={16} />;
    return <FileText size={16} />;
  }

  // The cashier's "quick-fill" defaults to a Cash-type mode if one exists.
  const cashMode = modes.find((m) => (m.type || '').toLowerCase() === 'cash')
    ?? modes.find((m) => m.mode.toLowerCase() === 'cash');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[color:var(--color-brand-600)] text-white">
          <h2 className="font-bold text-lg">{isAr ? 'Ø§Ù„Ø¯ÙØ¹' : 'Payment'}</h2>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Total */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5 text-center">
          <p className="text-xs text-slate-500 mb-1">{isAr ? 'Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø³ØªØ­Ù‚' : 'Total due'}</p>
          <p className="text-3xl font-black text-slate-800 dark:text-white">
            {formatCurrency(total)} <span className="text-base font-normal text-slate-500">{currency}</span>
          </p>
        </div>

        {/* Payment modes */}
        <div className="p-5 space-y-3">
          {modes.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              {isAr ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ø±Ù‚ Ø¯ÙØ¹ Ù…ØªØ§Ø­Ø©' : 'No payment modes available'}
            </p>
          )}
          {modes.map((m) => (
            <div key={m.mode} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                {iconFor(m)}
              </div>
              <label className="flex-1 text-sm font-semibold text-slate-700 dark:text-white">
                {m.mode}
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={getModeAmount(m.mode) || ''}
                placeholder="0.00"
                onChange={(e) => setModeAmount(m.mode, parseFloat(e.target.value) || 0)}
                className="w-28 px-3 py-2 text-sm text-end rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-[color:var(--color-brand-500)]"
              />
            </div>
          ))}

          {/* Quick-fill cash button */}
          {cashMode && (
            <button
              type="button"
              onClick={() => setModeAmount(cashMode.mode, total)}
              className="text-xs text-[color:var(--color-brand-600)] hover:underline"
            >
              {isAr ? `â† ØªØ¹Ø¨Ø¦Ø© Ø§Ù„Ù…Ø¨Ù„Øº ÙƒØ§Ù…Ù„Ø§Ù‹ (${cashMode.mode})` : `â† Fill full amount (${cashMode.mode})`}
            </button>
          )}
        </div>

        {/* Summary row */}
        <div className="px-5 pb-4 space-y-1 text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{isAr ? 'Ø§Ù„Ù…Ø¯ÙÙˆØ¹:' : 'Paid:'}</span>
            <span className="font-bold">{formatCurrency(paid)} {currency}</span>
          </div>
          {change > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>{isAr ? 'Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ (ÙÙƒØ©):' : 'Change due:'}</span>
              <span>{formatCurrency(change)} {currency}</span>
            </div>
          )}
          {remaining > 0 && (
            <div className="flex justify-between text-amber-600 font-bold">
              <span>{isAr ? 'Ù†Ø§Ù‚Øµ:' : 'Remaining:'}</span>
              <span>{formatCurrency(remaining)} {currency}</span>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="px-5 pb-5">
          <button
            type="button"
            disabled={paid < total || saving}
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
            {isAr ? 'ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¯ÙØ¹ ÙˆØ·Ø¨Ø§Ø¹Ø© Ø§Ù„ÙØ§ØªÙˆØ±Ø©' : 'Confirm payment & print receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Sub-component: Profile picker (when no shift is open) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProfilePicker({
  isAr,
  profiles,
  loading,
  onPick,
  onBootstrap,
  bootstrapping,
}: {
  isAr: boolean;
  profiles: POSProfile[];
  loading: boolean;
  onPick: (profile: POSProfile, openingAmount: number) => void;
  onBootstrap: () => void;
  bootstrapping: boolean;
}) {
  const [selected, setSelected] = useState<string>('');
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const picked = profiles.find((p) => p.name === selected);

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-r from-[color:var(--color-brand-600)] to-[color:var(--color-brand-500)] text-white">
        <div className="flex items-center gap-3">
          <Store size={22} />
          <div>
            <h2 className="font-bold text-lg">{isAr ? 'ÙØªØ­ ÙˆØ±Ø¯ÙŠØ© Ø¬Ø¯ÙŠØ¯Ø©' : 'Open a new shift'}</h2>
            <p className="text-xs opacity-80">
              {isAr ? 'Ø§Ø®ØªØ± Ù…Ù„Ù Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹ ÙˆØ­Ø¯Ø¯ Ø±ØµÙŠØ¯ Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©' : 'Pick a POS profile and set opening cash'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Profile list */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">
            {isAr ? 'Ù…Ù„Ù Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹' : 'POS Profile'}
          </label>
          {profiles.length === 0 ? (
            <div className="py-6 px-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <p className="text-sm text-slate-400">
                {loading
                  ? (isAr ? 'Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù…ÙŠÙ„â€¦' : 'Loadingâ€¦')
                  : (isAr ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù„ÙØ§Øª Ù†Ù‚Ø·Ø© Ø¨ÙŠØ¹ Ù…ÙØ¹Ù‘Ù„Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…' : 'No POS Profiles enabled for this user')}
              </p>
              {!loading && (
                <button
                  type="button"
                  onClick={onBootstrap}
                  disabled={bootstrapping}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[color:var(--color-brand-600)] text-white text-sm font-bold hover:bg-[color:var(--color-brand-500)] transition disabled:opacity-50"
                >
                  {bootstrapping ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  {isAr ? 'Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù„Ù Ø§ÙØªØ±Ø§Ø¶ÙŠ' : 'Create default profile'}
                </button>
              )}
              {!loading && (
                <p className="text-[10px] text-slate-400">
                  {isAr
                    ? 'Ø³ÙŠØªÙ… Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø´Ø±ÙƒØ© ÙˆØ§Ù„Ù…Ø®Ø²Ù† ÙˆØ¹Ù…Ù„Ø© Ø§ÙØªØ±Ø§Ø¶ÙŠØ© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹'
                    : 'Auto-picks your company, first warehouse, default currency, and Cash payment mode'}
                </p>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {profiles.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setSelected(p.name)}
                  className={`text-start p-3 rounded-xl border transition ${
                    selected === p.name
                      ? 'border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-900)]/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-bold text-slate-700 dark:text-white">{p.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {p.warehouse} Â· {p.currency}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Opening amount */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">
            {isAr ? 'Ø±ØµÙŠØ¯ Ø§Ù„ÙƒØ§Ø´ Ø§Ù„Ø§ÙØªØªØ§Ø­ÙŠ' : 'Opening cash balance'}
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={openingAmount || ''}
            placeholder="0.00"
            onChange={(e) => setOpeningAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:ring-2 focus:ring-[color:var(--color-brand-500)]"
          />
        </div>

        <button
          type="button"
          disabled={!picked || loading}
          onClick={() => picked && onPick(picked, openingAmount)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <LogIn size={16} />}
          {isAr ? 'ÙØªØ­ Ø§Ù„ÙˆØ±Ø¯ÙŠØ©' : 'Open shift'}
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Sub-component: Shift banner (top of cashier when shift is open) â”€â”€â”€â”€â”€â”€â”€
function ShiftBanner({
  isAr,
  opening,
  profile,
  onClose,
  closing,
}: {
  isAr: boolean;
  opening: POSOpening;
  profile?: POSProfile;
  onClose: () => void;
  closing: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-900)]/30 border border-[color:var(--color-brand-200)] dark:border-[color:var(--color-brand-700)]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[color:var(--color-brand-600)] text-white flex items-center justify-center shrink-0">
          <Store size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-700 dark:text-white truncate">
            {opening.pos_profile}
            <span className="ms-2 font-normal text-slate-400">
              Â· {profile?.warehouse ?? 'â€”'} Â· {profile?.currency ?? 'â€”'}
            </span>
          </p>
          <p className="text-[10px] text-slate-400">
            {isAr ? 'Ø§Ù„ÙˆØ±Ø¯ÙŠØ©' : 'Shift'} {opening.name}
            {opening.summary && (
              <>
                {' Â· '}
                {opening.summary.invoice_count} {isAr ? 'ÙØ§ØªÙˆØ±Ø©' : 'invoices'}
                {' Â· '}
                {formatCurrency(opening.summary.total_sales)} {profile?.currency ?? ''}
              </>
            )}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={closing}
        onClick={onClose}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition disabled:opacity-50"
      >
        {closing ? <RefreshCw size={12} className="animate-spin" /> : <LogOut size={12} />}
        {isAr ? 'Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„ÙˆØ±Ø¯ÙŠØ©' : 'Close shift'}
      </button>
    </div>
  );
}

// â”€â”€â”€ Sub-component: Barcode input (auto-focus, Enter to submit) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BarcodeInput({
  isAr,
  onScan,
  disabled,
}: {
  isAr: boolean;
  onScan: (code: string) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');

  useEffect(() => {
    // Keep focus on the barcode input when the cashier hasn't focused anywhere else.
    ref.current?.focus();
  }, []);

  function submit() {
    const v = code.trim();
    if (!v) return;
    onScan(v);
    setCode('');
    // Wedge scanners fire fast â€” refocus so the next scan lands here.
    setTimeout(() => ref.current?.focus(), 0);
  }

  return (
    <div className="relative min-w-[180px] flex-1">
      <Barcode size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
      <input
        ref={ref}
        type="text"
        inputMode="text"
        autoComplete="off"
        value={code}
        disabled={disabled}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={isAr ? 'Ø§Ù…Ø³Ø­ Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ Ø£Ùˆ Ø§ÙƒØªØ¨ Ø§Ù„ÙƒÙˆØ¯â€¦' : 'Scan barcode or type codeâ€¦'}
        className="w-full ps-9 pe-3 py-2.5 text-sm rounded-xl border border-[color:var(--color-brand-300)] dark:border-[color:var(--color-brand-700)] bg-[color:var(--color-brand-50)]/40 dark:bg-slate-900 focus:ring-2 focus:ring-[color:var(--color-brand-500)] disabled:opacity-50"
      />
    </div>
  );
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function POSPage({ mode = 'retail' }: { mode?: 'retail' | 'restaurant' }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // â”€â”€ Core state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);

  // â”€â”€ Order type + table (restaurant) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [orderType, setOrderType] = useState<OrderType>('walkin');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedTableNumber, setSelectedTableNumber] = useState('');
  const [showTablePicker, setShowTablePicker] = useState(false);

  // â”€â”€ Hold / resume â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [showHeld, setShowHeld] = useState(false);

  // â”€â”€ Payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showPayment, setShowPayment] = useState(false);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const customerRef = useRef<HTMLDivElement>(null);

  // â”€â”€ Shift / profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: profilesResp, isLoading: loadingProfiles, mutate: refetchProfiles } = useFrappeGetCall<{
    message: POSProfile[];
  }>('madaar_core.api.list_pos_profiles', undefined, 'pos-profiles');
  const profiles = profilesResp?.message ?? [];

  const { data: openingResp, mutate: refetchOpening } = useFrappeGetCall<{ message: POSOpening | null }>(
    'madaar_core.api.current_pos_opening',
    undefined,
    'pos-opening',
  );
  const opening = openingResp?.message ?? null;

  const activeProfile = useMemo(
    () => profiles.find((p) => p.name === opening?.pos_profile),
    [profiles, opening],
  );
  const currency = activeProfile?.currency ?? 'EGP';
  const sellingPriceList = activeProfile?.selling_price_list;

  // Load held orders for this mode + profile whenever a shift opens
  useEffect(() => {
    if (opening) {
      setHeldOrders(loadHeldOrders(mode, opening.pos_profile));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening?.name, mode]);

  // â”€â”€ Data fetching (catalog, prices, groups, customers, payment modes) â”€â”€â”€â”€
  const { data: itemsResp } = useFrappeGetDocList<{
    name: string;
    item_code: string;
    item_name: string;
    item_group: string;
    image?: string;
    stock_uom?: string;
  }>('Item', {
    filters: [['disabled', '=', 0], ['is_sales_item', '=', 1]],
    fields: ['name', 'item_code', 'item_name', 'item_group', 'image', 'stock_uom'],
    limit: 200,
    orderBy: { field: 'item_name', order: 'asc' },
  }, opening ? undefined : null);

  const priceFilters = useMemo<Array<[string, string, unknown]>>(
    () =>
      sellingPriceList
        ? [['selling', '=', 1], ['price_list', '=', sellingPriceList]]
        : [['selling', '=', 1]],
    [sellingPriceList],
  );
  const { data: pricesResp } = useFrappeGetDocList<{
    item_code: string;
    price_list_rate: number;
    selling: number;
  }>('Item Price', {
    filters: priceFilters as any,
    fields: ['item_code', 'price_list_rate'],
    limit: 500,
  }, opening ? undefined : null);

  const { data: groupsResp } = useFrappeGetDocList<{ name: string }>('Item Group', {
    filters: [['is_group', '=', 0]],
    fields: ['name'],
    limit: 100,
    orderBy: { field: 'name', order: 'asc' },
  }, opening ? undefined : null);

  const { data: customersResp } = useFrappeGetDocList<{ name: string; customer_name: string }>('Customer', {
    fields: ['name', 'customer_name'],
    limit: 200,
    orderBy: { field: 'customer_name', order: 'asc' },
  }, opening ? undefined : null);

  // Restaurant tables (only fetched in restaurant mode when a shift is open)
  const { data: tablesResp, mutate: refetchTables } = useFrappeGetDocList<RestaurantTable>(
    'Madaar Table',
    {
      fields: ['name', 'table_number', 'hall', 'capacity', 'status'],
      limit: 200,
      orderBy: { field: 'table_number', order: 'asc' },
    },
    mode === 'restaurant' && opening ? undefined : null,
  );
  const tables: RestaurantTable[] = tablesResp ?? [];

  // Modes scoped to the active profile when one is open (else all enabled modes).
  const { data: modesResp } = useFrappeGetCall<{ message: PaymentMode[] }>(
    'madaar_core.api.get_pos_payment_modes',
    opening ? { pos_profile: opening.pos_profile } : undefined,
    opening ? `pos-payment-modes-${opening.pos_profile}` : 'pos-payment-modes',
  );

  // Apply the profile's default customer once the shift opens, if the cashier
  // hasn't picked one yet.
  useEffect(() => {
    if (activeProfile?.customer && !customer) {
      setCustomer(activeProfile.customer);
      setCustomerSearch(activeProfile.customer);
    }
  }, [activeProfile, customer]);

  // â”€â”€ Derived data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const priceMap = useMemo(() => {
    const map: Record<string, number> = {};
    (pricesResp ?? []).forEach((p) => {
      if (!(p.item_code in map) || map[p.item_code] === 0) {
        map[p.item_code] = p.price_list_rate;
      }
    });
    return map;
  }, [pricesResp]);

  const items: POSItem[] = useMemo(() => {
    return (itemsResp ?? []).map((it) => ({
      name: it.name,
      item_code: it.item_code,
      item_name: it.item_name,
      item_group: it.item_group,
      image: it.image,
      stock_uom: it.stock_uom,
      price: priceMap[it.item_code] ?? 0,
    }));
  }, [itemsResp, priceMap]);

  const groups = useMemo(() => (groupsResp ?? []).map((g) => g.name), [groupsResp]);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(
      (it) =>
        (!groupFilter || it.item_group === groupFilter) &&
        (!q || it.item_name.toLowerCase().includes(q) || it.item_code.toLowerCase().includes(q)),
    );
  }, [items, search, groupFilter]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    return (customersResp ?? []).filter(
      (c) => !q || c.customer_name.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [customersResp, customerSearch]);

  const paymentModes: PaymentMode[] = modesResp?.message?.length
    ? modesResp.message
    : [
        { mode: 'Cash', type: 'Cash', default: 1 },
        { mode: 'Card', type: 'Bank', default: 0 },
        { mode: 'Credit', type: 'General', default: 0 },
      ];

  // â”€â”€ Cart computations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const subtotal = cart.reduce((s, l) => s + cartLineTotal(l), 0);
  const discountAmt = subtotal * (globalDiscount / 100);
  const total = Math.max(0, subtotal - discountAmt);
  const totalQty = cart.reduce((s, l) => s + l.qty, 0);

  // â”€â”€ Cart actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addItem = useCallback((item: POSItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.item.item_code === item.item_code);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { item, qty: 1, rate: item.price, discount_pct: 0 }];
    });
  }, []);

  function updateLine(idx: number, updated: CartLine) {
    setCart((prev) => {
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  }

  function removeLine(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function clearCart() {
    setCart([]);
    setCustomer('');
    setCustomerSearch('');
    setGlobalDiscount(0);
    setPayments([]);
    setOrderType('walkin');
    setSelectedTable('');
    setSelectedTableNumber('');
  }

  // â”€â”€ Table status helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { call: setTableStatus } = useFrappePostCall<any>('frappe.client.set_value');

  async function markTable(tableName: string, status: 'Occupied' | 'Available') {
    try {
      await setTableStatus({ doctype: 'Madaar Table', name: tableName, fieldname: 'status', value: status });
      void refetchTables();
    } catch { /* non-critical */ }
  }

  async function handleSelectTable(t: RestaurantTable) {
    if (selectedTable && selectedTable !== t.name) await markTable(selectedTable, 'Available');
    await markTable(t.name, 'Occupied');
    setSelectedTable(t.name);
    setSelectedTableNumber(t.table_number);
    setShowTablePicker(false);
  }

  async function handleClearTable() {
    if (!selectedTable) return;
    await markTable(selectedTable, 'Available');
    setSelectedTable('');
    setSelectedTableNumber('');
  }

  // â”€â”€ Hold / resume â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function holdOrder() {
    if (cart.length === 0 || !opening) return;
    const held: HeldOrder = {
      id: genId(),
      posProfile: opening.pos_profile,
      posMode: mode,
      timestamp: Date.now(),
      orderType,
      table: selectedTable || undefined,
      tableNumber: selectedTableNumber || undefined,
      customer,
      customerSearch,
      cart,
      globalDiscount,
    };
    const updated = [...heldOrders, held];
    setHeldOrders(updated);
    saveHeldOrders(mode, opening.pos_profile, updated);
    // Clear cart but keep table Occupied (it belongs to the held order)
    setCart([]);
    setCustomer('');
    setCustomerSearch('');
    setGlobalDiscount(0);
    setPayments([]);
    setOrderType('walkin');
    setSelectedTable('');
    setSelectedTableNumber('');
    setSuccessMsg(isAr ? 'â¸ ØªÙ… ØªØ¹Ù„ÙŠÙ‚ Ø§Ù„Ø·Ù„Ø¨' : 'â¸ Order held');
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function resumeOrder(order: HeldOrder) {
    let updatedHeld = heldOrders.filter((h) => h.id !== order.id);
    // Stash the current cart as a new hold if it has items
    if (cart.length > 0 && opening) {
      const currentHold: HeldOrder = {
        id: genId(),
        posProfile: opening.pos_profile,
        posMode: mode,
        timestamp: Date.now(),
        orderType,
        table: selectedTable || undefined,
        tableNumber: selectedTableNumber || undefined,
        customer,
        customerSearch,
        cart,
        globalDiscount,
      };
      updatedHeld = [...updatedHeld, currentHold];
    }
    setHeldOrders(updatedHeld);
    if (opening) saveHeldOrders(mode, opening.pos_profile, updatedHeld);
    setCart(order.cart);
    setCustomer(order.customer);
    setCustomerSearch(order.customerSearch);
    setGlobalDiscount(order.globalDiscount);
    setOrderType(order.orderType);
    setSelectedTable(order.table ?? '');
    setSelectedTableNumber(order.tableNumber ?? '');
    setShowHeld(false);
  }

  async function deleteHeldOrder(id: string) {
    const order = heldOrders.find((h) => h.id === id);
    if (order?.table && mode === 'restaurant') await markTable(order.table, 'Available');
    const updated = heldOrders.filter((h) => h.id !== id);
    setHeldOrders(updated);
    if (opening) saveHeldOrders(mode, opening.pos_profile, updated);
  }

  // â”€â”€ Submit invoice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { createDoc, loading: saving } = useFrappeCreateDoc();

  async function confirmPayment() {
    setErrorMsg(null);
    try {
      const now = new Date().toISOString().slice(0, 10);
      const warehouse = activeProfile?.warehouse;
      const orderTypeLabels: Record<OrderType, string> = { walkin: 'Walk-in', delivery: 'Delivery', dinein: 'Dine-in' };
      const remarks = [
        `Order Type: ${orderTypeLabels[orderType]}`,
        selectedTableNumber ? `Table: ${selectedTableNumber}` : '',
      ].filter(Boolean).join(' | ');

      await createDoc('POS Invoice', {
        doctype: 'POS Invoice',
        posting_date: now,
        customer: customer || activeProfile?.customer || 'Walk-in Customer',
        company: activeProfile?.company,
        pos_profile: opening?.pos_profile,
        is_pos: 1,
        update_stock: 1,
        set_warehouse: warehouse,
        currency: activeProfile?.currency,
        selling_price_list: sellingPriceList,
        cost_center: activeProfile?.cost_center,
        remarks,
        items: cart.map((l) => ({
          item_code: l.item.item_code,
          item_name: l.item.item_name,
          qty: l.qty,
          rate: l.rate,
          uom: l.item.stock_uom ?? 'Nos',
          warehouse,
          discount_percentage: l.discount_pct,
          amount: cartLineTotal(l),
        })),
        payments: payments
          .filter((p) => p.amount > 0)
          .map((p) => ({ mode_of_payment: p.mode, amount: p.amount })),
        additional_discount_percentage: globalDiscount,
      });

      // Free the table after a successful payment
      if (selectedTable && mode === 'restaurant') await markTable(selectedTable, 'Available');

      setSuccessMsg(isAr ? 'âœ“ ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø¨Ù†Ø¬Ø§Ø­!' : 'âœ“ Invoice created successfully!');
      setShowPayment(false);
      clearCart();
      void refetchOpening();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.exception || err?.message || String(err);
      setErrorMsg(msg);
    }
  }

  // â”€â”€ Bootstrap default profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { call: bootstrapProfile, loading: bootstrappingProfile } = useFrappePostCall<{
    message: { name: string; created: boolean };
  }>('madaar_core.api.create_default_pos_profile');

  async function handleBootstrapProfile() {
    setErrorMsg(null);
    try {
      const res = await bootstrapProfile({});
      setSuccessMsg(
        isAr
          ? `âœ“ ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ù„Ù ${res?.message?.name}`
          : `âœ“ Created profile ${res?.message?.name}`,
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      await refetchProfiles();
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    }
  }

  // â”€â”€ Shift open / close â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { call: openShift, loading: openingShift } = useFrappePostCall<{ message: { name: string } }>(
    'madaar_core.api.open_pos_shift',
  );
  const { call: closeShift, loading: closingShift } = useFrappePostCall<{ message: { status: string } }>(
    'madaar_core.api.close_pos_shift',
  );

  async function handleOpenShift(profile: POSProfile, openingAmount: number) {
    setErrorMsg(null);
    try {
      await openShift({ pos_profile: profile.name, opening_amount: openingAmount });
      void refetchOpening();
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    }
  }

  async function handleCloseShift() {
    if (!opening) return;
    if (!window.confirm(isAr ? 'Ù‡Ù„ ØªØ±ÙŠØ¯ Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„ÙˆØ±Ø¯ÙŠØ©ØŸ' : 'Close the current shift?')) return;
    setErrorMsg(null);
    try {
      await closeShift({ pos_opening_entry: opening.name });
      clearCart();
      void refetchOpening();
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    }
  }

  // â”€â”€ Barcode lookup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { call: lookupBarcode } = useFrappePostCall<{ message: POSItem | null }>(
    'madaar_core.api.lookup_item_by_barcode',
  );

  async function handleBarcode(code: string) {
    setErrorMsg(null);
    const local = items.find(
      (it) => it.item_code.toLowerCase() === code.toLowerCase(),
    );
    if (local) {
      addItem(local);
      return;
    }
    try {
      const res = await lookupBarcode({
        barcode: code,
        ...(sellingPriceList ? { price_list: sellingPriceList } : {}),
      });
      const found = res?.message;
      if (found) {
        addItem(found);
      } else {
        setErrorMsg(isAr ? `Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ù†ØªØ¬ Ø¨Ø§Ù„ÙƒÙˆØ¯ ${code}` : `No item matches barcode ${code}`);
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    }
  }

  // â”€â”€ Page labels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pageTitle = mode === 'restaurant'
    ? (isAr ? 'Ù†Ù‚Ø·Ø© Ø¨ÙŠØ¹ Ø§Ù„Ù…Ø·Ø¹Ù…' : 'Restaurant POS')
    : (isAr ? 'Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹ (POS)' : 'Point of Sale');
  const pageSub = mode === 'restaurant'
    ? (isAr ? 'ÙƒØ§Ø´ÙŠØ± Ø§Ù„Ù…Ø·Ø¹Ù… â€” Ø·Ø§ÙˆÙ„Ø§Øª ÙˆØµØ§Ù„Ø§Øª' : 'Restaurant cashier â€” halls & tables')
    : (isAr ? 'ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„ÙƒØ§Ø´ÙŠØ± â€” Ø§Ù„Ø¨ÙŠØ¹ Ø§Ù„Ø³Ø±ÙŠØ¹' : 'Cashier interface â€” quick sale');

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <PageShell title={pageTitle} subtitle={pageSub}>
      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 text-sm text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* No shift â†’ show profile picker only */}
      {!opening && (
        <ProfilePicker
          isAr={isAr}
          profiles={profiles}
          loading={loadingProfiles || openingShift}
          onPick={handleOpenShift}
          onBootstrap={handleBootstrapProfile}
          bootstrapping={bootstrappingProfile}
        />
      )}

      {opening && (
      <>
      <ShiftBanner
        isAr={isAr}
        opening={opening}
        profile={activeProfile}
        onClose={handleCloseShift}
        closing={closingShift}
      />

      <div className="flex gap-4 h-[calc(100vh-13rem)] min-h-[500px]">

        {/* â•â• LEFT PANEL â€” Product catalog â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Barcode + search + group filter */}
          <div className="flex gap-2 flex-wrap">
            <BarcodeInput isAr={isAr} onScan={handleBarcode} />
            <div className="relative flex-1 min-w-[180px]">
              <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„ÙƒÙˆØ¯â€¦' : 'Search by name or codeâ€¦'}
                className="w-full ps-9 pe-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[color:var(--color-brand-500)]"
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-w-[180px]"
            >
              <option value="">{isAr ? 'ÙƒÙ„ Ø§Ù„ÙØ¦Ø§Øª' : 'All categories'}</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <ShoppingCart size={40} className="opacity-30" />
                <p className="text-sm">{isAr ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù†ØªØ¬Ø§Øª' : 'No products found'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
                {filteredItems.map((item) => (
                  <ProductCard key={item.name} item={item} onAdd={addItem} isAr={isAr} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* â•â• RIGHT PANEL â€” Cart â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="w-[340px] shrink-0 flex flex-col gap-3">

          {/* Order type + table selector */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 p-3 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {isAr ? 'Ù†ÙˆØ¹ Ø§Ù„Ø·Ù„Ø¨' : 'Order type'}
            </p>
            <OrderTypePicker
              posMode={mode}
              value={orderType}
              onChange={(t) => {
                setOrderType(t);
                if (t !== 'dinein' && selectedTable) void handleClearTable();
              }}
              isAr={isAr}
            />
            {/* Table picker â€” restaurant + dine-in only */}
            {mode === 'restaurant' && orderType === 'dinein' && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTablePicker(true)}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition ${
                    selectedTable
                      ? 'border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-900)]/30 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-300)]'
                      : 'border-dashed border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                  }`}
                >
                  <LayoutGrid size={15} />
                  {selectedTable
                    ? (isAr ? `Ø·Ø§ÙˆÙ„Ø© ${selectedTableNumber}` : `Table ${selectedTableNumber}`)
                    : (isAr ? 'Ø§Ø®ØªØ± Ø·Ø§ÙˆÙ„Ø©â€¦' : 'Select tableâ€¦')}
                </button>
                {selectedTable && (
                  <button
                    type="button"
                    onClick={handleClearTable}
                    className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-500/20 transition"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Customer picker */}
          <div ref={customerRef} className="relative">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <User size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setCustomer('');
                  setShowCustomerDrop(true);
                }}
                onFocus={() => setShowCustomerDrop(true)}
                placeholder={isAr ? 'Ø§Ø®ØªØ± Ø¹Ù…ÙŠÙ„ Ø£Ùˆ Ù†Ø²ÙŠÙ„â€¦' : 'Select customer or walk-inâ€¦'}
                className="flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-white placeholder:text-slate-400"
              />
              <ChevronDown size={14} className="text-slate-400" />
            </div>
            {showCustomerDrop && filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setCustomer(c.name);
                      setCustomerSearch(c.customer_name);
                      setShowCustomerDrop(false);
                    }}
                    className="w-full text-start px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white"
                  >
                    {c.customer_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart lines */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
              <p className="text-sm font-bold text-slate-700 dark:text-white">
                {isAr ? 'Ø§Ù„Ø³Ù„Ø©' : 'Cart'}
                {totalQty > 0 && (
                  <span className="ms-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--color-brand-100)] dark:bg-[color:var(--color-brand-900)] text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-300)] font-bold">
                    {totalQty}
                  </span>
                )}
              </p>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-rose-400 hover:text-rose-600 transition"
                  title={isAr ? 'ØªÙØ±ÙŠØº Ø§Ù„Ø³Ù„Ø©' : 'Clear cart'}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600 gap-2 py-8">
                  <ShoppingCart size={36} />
                  <p className="text-xs">{isAr ? 'Ø§Ù„Ø³Ù„Ø© ÙØ§Ø±ØºØ©' : 'Cart is empty'}</p>
                </div>
              ) : (
                cart.map((line, idx) => (
                  <CartLineRow
                    key={line.item.item_code}
                    line={line}
                    isAr={isAr}
                    currency={currency}
                    onChange={(updated) => updateLine(idx, updated)}
                    onRemove={() => removeLine(idx)}
                  />
                ))
              )}
            </div>

            {/* Totals */}
            {cart.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{isAr ? 'Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ Ù‚Ø¨Ù„ Ø§Ù„Ø®ØµÙ…' : 'Subtotal'}</span>
                  <span className="font-bold">{formatCurrency(subtotal)} {currency}</span>
                </div>
                {/* Global discount */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Percent size={11} />
                    {isAr ? 'Ø®ØµÙ… Ø¹Ø§Ù…%' : 'Overall disc%'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={globalDiscount || ''}
                    placeholder="0"
                    onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-xs text-end rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-white"
                  />
                </div>
                {globalDiscount > 0 && (
                  <div className="flex items-center justify-between text-xs text-rose-500">
                    <span>{isAr ? 'Ø§Ù„Ø®ØµÙ…' : 'Discount'}</span>
                    <span>-{formatCurrency(discountAmt)} {currency}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                  <span className="text-sm font-black text-slate-700 dark:text-white">{isAr ? 'Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ' : 'Total'}</span>
                  <span className="text-lg font-black text-[color:var(--color-brand-600)]">
                    {formatCurrency(total)} {currency}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Hold */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={holdOrder}
              title={isAr ? 'ØªØ¹Ù„ÙŠÙ‚ Ø§Ù„Ø·Ù„Ø¨' : 'Hold order'}
              className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Pause size={15} />
              {isAr ? 'ØªØ¹Ù„ÙŠÙ‚' : 'Hold'}
            </button>

            {/* View held orders */}
            <button
              type="button"
              onClick={() => setShowHeld(true)}
              className="relative flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title={isAr ? 'Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ø¹Ù„Ù‚Ø©' : 'Held orders'}
            >
              <Play size={15} />
              {isAr ? 'Ø§Ù„Ù…Ø¹Ù„Ù‚Ø©' : 'Held'}
              {heldOrders.length > 0 && (
                <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] text-[10px] font-black bg-amber-500 text-white rounded-full flex items-center justify-center px-1">
                  {heldOrders.length}
                </span>
              )}
            </button>

            {/* Pay */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => {
                setPayments([]);
                setShowPayment(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-500 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              <Banknote size={18} />
              {isAr ? 'Ø§Ù„Ø¯ÙØ¹' : 'Pay'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          isAr={isAr}
          total={total}
          currency={currency}
          modes={paymentModes}
          payments={payments}
          onPaymentsChange={setPayments}
          onConfirm={confirmPayment}
          onClose={() => setShowPayment(false)}
          saving={saving}
        />
      )}

      {/* Table picker modal (restaurant + dine-in) */}
      {showTablePicker && mode === 'restaurant' && (
        <TablePickerModal
          tables={tables}
          selectedTable={selectedTable}
          onSelect={handleSelectTable}
          onClose={() => setShowTablePicker(false)}
          isAr={isAr}
        />
      )}

      {/* Held orders modal */}
      {showHeld && (
        <HeldOrdersModal
          orders={heldOrders}
          onResume={resumeOrder}
          onDelete={deleteHeldOrder}
          onClose={() => setShowHeld(false)}
          isAr={isAr}
          currency={currency}
        />
      )}
      </>
      )}
    </PageShell>
  );
}

