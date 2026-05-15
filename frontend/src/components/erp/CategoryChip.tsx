import { ReactNode } from 'react';

type Kind = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'neutral';

const KIND_CLASS: Record<Kind, string> = {
  asset: 'bg-[color:var(--color-sky-500)]/15 text-[color:var(--color-sky-500)]',
  liability: 'bg-[color:var(--color-orange-500)]/15 text-[color:var(--color-orange-500)]',
  equity: 'bg-[color:var(--color-violet-600)]/15 text-[color:var(--color-violet-600)]',
  revenue: 'bg-[color:var(--color-emerald-600)]/15 text-[color:var(--color-emerald-600)]',
  expense: 'bg-[color:var(--color-pink-500)]/15 text-[color:var(--color-pink-500)]',
  neutral: 'bg-[color:var(--color-muted)]/15 text-[color:var(--color-muted)]',
};

export function CategoryChip({ kind = 'neutral', children }: { kind?: Kind; children: ReactNode }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        KIND_CLASS[kind],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
