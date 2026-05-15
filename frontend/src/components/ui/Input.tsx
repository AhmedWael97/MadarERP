import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={[
          'h-10 w-full rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-app px-3 text-sm outline-none focus:ring-2 ring-primary',
          className ?? '',
        ].join(' ')}
        {...rest}
      />
    );
  },
);
