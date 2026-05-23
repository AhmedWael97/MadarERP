/**
 * POSPage — Retail Point-of-Sale cashier interface.
 *
 * Flow:
 *  1. On load: check `madaar_core.api.current_pos_opening` for the user's open shift.
 *  2. No shift → POS Profile picker + opening-cash dialog → `open_pos_shift`.
 *  3. Shift open → Cashier UI (barcode + search + grid + cart + payment).
 *  4. On close → `close_pos_shift` flips the Opening Entry to Closed.
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
} from 'lucide-react';
import { PageShell } from '../components/erp/PageShell';

// ─── Types ─────────────────────────────────────────────────────────────────
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

// ─── Helpers ───────────────────────────────────────────────────────────────
function cartLineTotal(line: CartLine) {
  return line.qty * line.rate * (1 - line.discount_pct / 100);
}

function formatCurrency(val: number) {
  return val.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Sub-component: Product card ───────────────────────────────────────────
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
          {formatCurrency(item.price)} {isAr ? 'ج.م' : 'EGP'}
        </p>
      </div>
      <div className="px-3 pb-3">
        <span className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl bg-[color:var(--color-brand-600)] text-white text-xs font-bold group-hover:bg-[color:var(--color-brand-500)] transition">
          <Plus size={12} />
          {isAr ? 'إضافة' : 'Add'}
        </span>
      </div>
    </button>
  );
}

// ─── Sub-component: Cart line ───────────────────────────────────────────────
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
          <span className="text-[10px] text-slate-400">{isAr ? 'السعر:' : 'Price:'}</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={line.rate}
            onChange={(e) => onChange({ ...line, rate: parseFloat(e.target.value) || 0 })}
            className="w-16 px-1 py-0.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-white"
          />
          <span className="text-[10px] text-slate-400 ms-1">{isAr ? 'خصم%:' : 'Disc%:'}</span>
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

// ─── Sub-component: Payment Modal ──────────────────────────────────────────
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
          <h2 className="font-bold text-lg">{isAr ? 'الدفع' : 'Payment'}</h2>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Total */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5 text-center">
          <p className="text-xs text-slate-500 mb-1">{isAr ? 'الإجمالي المستحق' : 'Total due'}</p>
          <p className="text-3xl font-black text-slate-800 dark:text-white">
            {formatCurrency(total)} <span className="text-base font-normal text-slate-500">{currency}</span>
          </p>
        </div>

        {/* Payment modes */}
        <div className="p-5 space-y-3">
          {modes.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              {isAr ? 'لا توجد طرق دفع متاحة' : 'No payment modes available'}
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
              {isAr ? `← تعبئة المبلغ كاملاً (${cashMode.mode})` : `← Fill full amount (${cashMode.mode})`}
            </button>
          )}
        </div>

        {/* Summary row */}
        <div className="px-5 pb-4 space-y-1 text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{isAr ? 'المدفوع:' : 'Paid:'}</span>
            <span className="font-bold">{formatCurrency(paid)} {currency}</span>
          </div>
          {change > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>{isAr ? 'المتبقي (فكة):' : 'Change due:'}</span>
              <span>{formatCurrency(change)} {currency}</span>
            </div>
          )}
          {remaining > 0 && (
            <div className="flex justify-between text-amber-600 font-bold">
              <span>{isAr ? 'ناقص:' : 'Remaining:'}</span>
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
            {isAr ? 'تأكيد الدفع وطباعة الفاتورة' : 'Confirm payment & print receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Profile picker (when no shift is open) ─────────────────
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
            <h2 className="font-bold text-lg">{isAr ? 'فتح وردية جديدة' : 'Open a new shift'}</h2>
            <p className="text-xs opacity-80">
              {isAr ? 'اختر ملف نقطة البيع وحدد رصيد البداية' : 'Pick a POS profile and set opening cash'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Profile list */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">
            {isAr ? 'ملف نقطة البيع' : 'POS Profile'}
          </label>
          {profiles.length === 0 ? (
            <div className="py-6 px-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <p className="text-sm text-slate-400">
                {loading
                  ? (isAr ? 'جارٍ التحميل…' : 'Loading…')
                  : (isAr ? 'لا توجد ملفات نقطة بيع مفعّلة لهذا المستخدم' : 'No POS Profiles enabled for this user')}
              </p>
              {!loading && (
                <button
                  type="button"
                  onClick={onBootstrap}
                  disabled={bootstrapping}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[color:var(--color-brand-600)] text-white text-sm font-bold hover:bg-[color:var(--color-brand-500)] transition disabled:opacity-50"
                >
                  {bootstrapping ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  {isAr ? 'إنشاء ملف افتراضي' : 'Create default profile'}
                </button>
              )}
              {!loading && (
                <p className="text-[10px] text-slate-400">
                  {isAr
                    ? 'سيتم اختيار الشركة والمخزن وعملة افتراضية تلقائياً'
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
                    {p.warehouse} · {p.currency}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Opening amount */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">
            {isAr ? 'رصيد الكاش الافتتاحي' : 'Opening cash balance'}
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
          {isAr ? 'فتح الوردية' : 'Open shift'}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-component: Shift banner (top of cashier when shift is open) ───────
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
              · {profile?.warehouse ?? '—'} · {profile?.currency ?? '—'}
            </span>
          </p>
          <p className="text-[10px] text-slate-400">
            {isAr ? 'الوردية' : 'Shift'} {opening.name}
            {opening.summary && (
              <>
                {' · '}
                {opening.summary.invoice_count} {isAr ? 'فاتورة' : 'invoices'}
                {' · '}
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
        {isAr ? 'إغلاق الوردية' : 'Close shift'}
      </button>
    </div>
  );
}

// ─── Sub-component: Barcode input (auto-focus, Enter to submit) ────────────
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
    // Wedge scanners fire fast — refocus so the next scan lands here.
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
        placeholder={isAr ? 'امسح الباركود أو اكتب الكود…' : 'Scan barcode or type code…'}
        className="w-full ps-9 pe-3 py-2.5 text-sm rounded-xl border border-[color:var(--color-brand-300)] dark:border-[color:var(--color-brand-700)] bg-[color:var(--color-brand-50)]/40 dark:bg-slate-900 focus:ring-2 focus:ring-[color:var(--color-brand-500)] disabled:opacity-50"
      />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function POSPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // ── State ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const customerRef = useRef<HTMLDivElement>(null);

  // ── Shift / profile state (loaded before catalog) ────────────────────────
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

  // ── Data fetching (catalog, prices, groups, customers, payment modes) ────
  // Skip fetching anything heavy until we have an open shift — keeps the
  // "open shift" screen snappy and avoids 200-row Item lists for cashiers who
  // are just glancing at the URL.
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

  // When the POS Profile has a selling_price_list, restrict prices to it.
  // Otherwise fall back to any selling price (first match wins).
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

  // ── Derived data ──────────────────────────────────────────────────────────
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

  // Default payment modes if API isn't wired yet (e.g., fresh tenant).
  const paymentModes: PaymentMode[] = modesResp?.message?.length
    ? modesResp.message
    : [
        { mode: 'Cash', type: 'Cash', default: 1 },
        { mode: 'Card', type: 'Bank', default: 0 },
        { mode: 'Credit', type: 'General', default: 0 },
      ];

  // ── Cart computations ─────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, l) => s + cartLineTotal(l), 0);
  const discountAmt = subtotal * (globalDiscount / 100);
  const total = Math.max(0, subtotal - discountAmt);
  const totalQty = cart.reduce((s, l) => s + l.qty, 0);

  // ── Cart actions ──────────────────────────────────────────────────────────
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
  }

  // ── Submit invoice ────────────────────────────────────────────────────────
  const { createDoc, loading: saving } = useFrappeCreateDoc();

  async function confirmPayment() {
    setErrorMsg(null);
    try {
      const now = new Date().toISOString().slice(0, 10);
      const warehouse = activeProfile?.warehouse;
      const invoicePayload: Record<string, unknown> = {
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
      };
      await createDoc('POS Invoice', invoicePayload);
      setSuccessMsg(isAr ? '✓ تم إنشاء الفاتورة بنجاح!' : '✓ Invoice created successfully!');
      setShowPayment(false);
      clearCart();
      // Refresh shift summary (invoice count / total) in the banner.
      void refetchOpening();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.exception || err?.message || String(err);
      setErrorMsg(msg);
    }
  }

  // ── Bootstrap default profile (one-click for empty tenants) ──────────────
  const { call: bootstrapProfile, loading: bootstrappingProfile } = useFrappePostCall<{
    message: { name: string; created: boolean };
  }>('madaar_core.api.create_default_pos_profile');

  async function handleBootstrapProfile() {
    setErrorMsg(null);
    try {
      const res = await bootstrapProfile({});
      setSuccessMsg(
        isAr
          ? `✓ تم إنشاء الملف ${res?.message?.name}`
          : `✓ Created profile ${res?.message?.name}`,
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      await refetchProfiles();
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    }
  }

  // ── Shift open / close ────────────────────────────────────────────────────
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
    if (!window.confirm(isAr ? 'هل تريد إغلاق الوردية؟' : 'Close the current shift?')) return;
    setErrorMsg(null);
    try {
      await closeShift({ pos_opening_entry: opening.name });
      clearCart();
      void refetchOpening();
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    }
  }

  // ── Barcode lookup ────────────────────────────────────────────────────────
  const { call: lookupBarcode } = useFrappePostCall<{ message: POSItem | null }>(
    'madaar_core.api.lookup_item_by_barcode',
  );

  async function handleBarcode(code: string) {
    setErrorMsg(null);
    // Local-first: if it matches an item already in the visible catalogue, skip
    // the round trip. Wedge scanners can fire several scans per second.
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
        setErrorMsg(isAr ? `لا يوجد منتج بالكود ${code}` : `No item matches barcode ${code}`);
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageShell
      title={isAr ? 'نقطة البيع (POS)' : 'Point of Sale'}
      subtitle={isAr ? 'واجهة الكاشير — البيع السريع' : 'Cashier interface — quick sale'}
    >
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

      {/* No shift → show profile picker only. Hides the catalog/cart entirely. */}
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

        {/* ══ LEFT PANEL — Product catalog ══════════════════════════════════ */}
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
                placeholder={isAr ? 'بحث بالاسم أو الكود…' : 'Search by name or code…'}
                className="w-full ps-9 pe-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[color:var(--color-brand-500)]"
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-w-[180px]"
            >
              <option value="">{isAr ? 'كل الفئات' : 'All categories'}</option>
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
                <p className="text-sm">{isAr ? 'لا توجد منتجات' : 'No products found'}</p>
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

        {/* ══ RIGHT PANEL — Cart ════════════════════════════════════════════ */}
        <div className="w-[340px] shrink-0 flex flex-col gap-3">

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
                placeholder={isAr ? 'اختر عميل أو نزيل…' : 'Select customer or walk-in…'}
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
                {isAr ? 'السلة' : 'Cart'}
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
                  title={isAr ? 'تفريغ السلة' : 'Clear cart'}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600 gap-2 py-8">
                  <ShoppingCart size={36} />
                  <p className="text-xs">{isAr ? 'السلة فارغة' : 'Cart is empty'}</p>
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
                  <span>{isAr ? 'المجموع قبل الخصم' : 'Subtotal'}</span>
                  <span className="font-bold">{formatCurrency(subtotal)} {currency}</span>
                </div>
                {/* Global discount */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Percent size={11} />
                    {isAr ? 'خصم عام%' : 'Overall disc%'}
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
                    <span>{isAr ? 'الخصم' : 'Discount'}</span>
                    <span>-{formatCurrency(discountAmt)} {currency}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                  <span className="text-sm font-black text-slate-700 dark:text-white">{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-lg font-black text-[color:var(--color-brand-600)]">
                    {formatCurrency(total)} {currency}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              setPayments([]);
              setShowPayment(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-500 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            <Banknote size={18} />
            {isAr ? 'المتابعة للدفع' : 'Proceed to payment'}
          </button>
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
      </>
      )}
    </PageShell>
  );
}
