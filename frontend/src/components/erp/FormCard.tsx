import { ReactNode } from 'react';

// Mirrors reference resources/views/components/form-card.blade.php.
// Card with a gradient-coloured header strip (per accent), padded body, and
// an optional footer row for actions.
type Color = 'brand' | 'teal' | 'emerald' | 'amber' | 'red' | 'rose' | 'purple' | 'violet' | 'blue';

const HEADER_GRADIENT: Record<Color, string> = {
  brand:   'background: linear-gradient(to left, #4f46e5, #6366f1);',
  teal:    'background: linear-gradient(to left, #0d9488, #14b8a6);',
  emerald: 'background: linear-gradient(to left, #059669, #10b981);',
  amber:   'background: linear-gradient(to left, #d97706, #f59e0b);',
  red:     'background: linear-gradient(to left, #dc2626, #ef4444);',
  rose:    'background: linear-gradient(to left, #e11d48, #f43f5e);',
  purple:  'background: linear-gradient(to left, #7c3aed, #8b5cf6);',
  violet:  'background: linear-gradient(to left, #7c3aed, #8b5cf6);',
  blue:    'background: linear-gradient(to left, #2563eb, #3b82f6);',
};

interface Props {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  color?: Color;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function FormCard({ title, subtitle, icon, color = 'brand', footer, className = '', children }: Props) {
  return (
    <div className={['bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 animate-slide-up overflow-hidden', className].join(' ')}>
      {title && (
        <div className="px-6 py-4" style={cssFromString(HEADER_GRADIENT[color])}>
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              {subtitle && (
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
          {footer}
        </div>
      )}
    </div>
  );
}

function cssFromString(css: string): React.CSSProperties {
  // Turn a single `background: linear-gradient(...)` rule into a React style obj.
  const obj: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const [prop, ...rest] = decl.split(':');
    if (!prop || rest.length === 0) continue;
    const key = prop.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    obj[key] = rest.join(':').trim();
  }
  return obj as React.CSSProperties;
}
