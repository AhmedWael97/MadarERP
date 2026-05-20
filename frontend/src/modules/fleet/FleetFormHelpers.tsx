/** Shared helpers reused across all fleet create/edit form pages. */
import type { ReactNode } from 'react';

export const INPUT =
  'w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)] transition-colors';

export const TEXTAREA =
  'w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-400)] transition-colors resize-y min-h-[80px]';

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
        <h3 className="text-base font-bold text-slate-800 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label}
        {required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function FormFooter({ saving, onCancel, isEdit }: { saving: boolean; onCancel: () => void; isEdit: boolean }) {
  return (
    <div className="flex justify-end items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200 transition-all"
      >
        إلغاء
      </button>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[color:var(--color-brand-500)]/20 hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] transition-all disabled:opacity-60"
      >
        {saving ? 'جاري الحفظ...' : isEdit ? 'تحديث' : 'حفظ'}
      </button>
    </div>
  );
}

export function extractFrappeError(e: any): string | null {
  if (!e) return null;
  if (typeof e._server_messages === 'string') {
    try {
      const msgs = JSON.parse(e._server_messages);
      return Array.isArray(msgs) ? msgs.map((m: any) => {
        try { return JSON.parse(m).message ?? m; } catch { return m; }
      }).join('\n') : String(msgs);
    } catch { return e._server_messages; }
  }
  return e?.message ?? null;
}
