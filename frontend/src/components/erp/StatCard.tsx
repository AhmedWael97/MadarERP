import { ReactNode } from 'react';

type Variant = 'orange' | 'teal' | 'violet' | 'rose' | 'yellow' | 'emerald' | 'sky';

const VARIANT_CLASS: Record<Variant, string> = {
  orange: 'from-[color:var(--color-orange-400)] to-[color:var(--color-orange-500)]',
  teal: 'from-[color:var(--color-teal-400)] to-[color:var(--color-teal-600)]',
  violet: 'from-[color:var(--color-violet-400)] to-[color:var(--color-violet-600)]',
  rose: 'from-[color:var(--color-rose-400)] to-[color:var(--color-rose-600)]',
  yellow: 'from-[color:var(--color-yellow-400)] to-[color:var(--color-yellow-600)]',
  emerald: 'from-[color:var(--color-emerald-500)] to-[color:var(--color-emerald-600)]',
  sky: 'from-[color:var(--color-sky-500)] to-[color:var(--color-indigo-500)]',
};

interface Props {
  label: string;
  value: ReactNode;
  caption?: string;
  variant?: Variant;
  icon?: ReactNode;
}

export function StatCard({ label, value, caption, variant = 'emerald', icon }: Props) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-[var(--radius-card)] p-5 text-white shadow-[var(--shadow-card)]',
        'bg-gradient-to-br',
        VARIANT_CLASS[variant],
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-90">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {caption && <p className="mt-1 text-xs opacity-80">{caption}</p>}
        </div>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
    </div>
  );
}
