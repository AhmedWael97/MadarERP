import { HTMLAttributes } from 'react';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        'rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5 shadow-[var(--shadow-card)]',
        className ?? '',
      ].join(' ')}
      {...rest}
    />
  );
}
