import { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned actions slot (e.g., "Add new" button, refresh, etc.) */
  actions?: ReactNode;
  children: ReactNode;
}

// Mirrors reference resources/views/components/page-header.blade.php — same
// flex layout, same Arabic-aware sizing, plus a subtle fade-in.
export function PageShell({ title, subtitle, actions, children }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
