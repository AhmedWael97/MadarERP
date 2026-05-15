import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:opacity-90',
  secondary:
    'bg-[color:var(--color-card)] border border-[color:var(--color-border)] hover:bg-app',
  ghost: 'hover:bg-app',
  danger: 'bg-[color:var(--color-rose-600)] text-white hover:opacity-90',
};

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className, loading, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-input)] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT[variant],
        SIZE[size],
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {loading && <Loader2 className="animate-spin" style={{ width: '1em', height: '1em' }} />}
      {children}
    </button>
  );
});
