import { ReactNode } from 'react';

// Tailwind colour family — used both for the icon disc bg and the icon ink.
// Mirrors reference resources/views/components/stat-card.blade.php where the
// `color` prop drives a `bg-{color}-100` disc and `text-{color}-600` icon.
type Color = 'brand' | 'teal' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'cyan' | 'orange' | 'pink' | 'sky' | 'slate';

const DISC_BG: Record<Color, string> = {
  brand:   'bg-[color:var(--color-brand-100)] dark:bg-[color:var(--color-brand-500)]/10',
  teal:    'bg-teal-100 dark:bg-teal-500/10',
  emerald: 'bg-emerald-100 dark:bg-emerald-500/10',
  amber:   'bg-amber-100 dark:bg-amber-500/10',
  rose:    'bg-rose-100 dark:bg-rose-500/10',
  violet:  'bg-violet-100 dark:bg-violet-500/10',
  blue:    'bg-blue-100 dark:bg-blue-500/10',
  cyan:    'bg-cyan-100 dark:bg-cyan-500/10',
  orange:  'bg-orange-100 dark:bg-orange-500/10',
  pink:    'bg-pink-100 dark:bg-pink-500/10',
  sky:     'bg-sky-100 dark:bg-sky-500/10',
  slate:   'bg-slate-100 dark:bg-slate-500/10',
};
const DISC_INK: Record<Color, string> = {
  brand:   'text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]',
  teal:    'text-teal-600 dark:text-teal-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber:   'text-amber-600 dark:text-amber-400',
  rose:    'text-rose-600 dark:text-rose-400',
  violet:  'text-violet-600 dark:text-violet-400',
  blue:    'text-blue-600 dark:text-blue-400',
  cyan:    'text-cyan-600 dark:text-cyan-400',
  orange:  'text-orange-600 dark:text-orange-400',
  pink:    'text-pink-600 dark:text-pink-400',
  sky:     'text-sky-600 dark:text-sky-400',
  slate:   'text-slate-600 dark:text-slate-400',
};

interface Props {
  label: string;
  value: ReactNode;
  caption?: string;
  /** Accent colour family for the icon disc. */
  color?: Color;
  /** Legacy alias for `color` — many existing callers pass `variant`. */
  variant?: Color;
  /** Icon node (lucide-react element). Pass directly, e.g. `<Receipt size={22} />`. */
  icon?: ReactNode;
  /** Small label rendered above the value, e.g. "Today", "+12%". */
  suffix?: string;
}

// Mirrors `<x-stat-card>` from the reference: WHITE card, coloured icon disc
// top-left, large bold value, muted label below.
export function StatCard({ label, value, caption, color, variant, icon, suffix }: Props) {
  const c: Color = color ?? variant ?? 'brand';
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-white/5">
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div className={['w-12 h-12 rounded-xl flex items-center justify-center', DISC_BG[c], DISC_INK[c]].join(' ')}>
            {icon}
          </div>
        )}
        {suffix && (
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{suffix}</span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      {caption && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{caption}</p>
      )}
    </div>
  );
}
