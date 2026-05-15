import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';
import type { Action } from './permissions';

interface Props {
  doctype: string | null | undefined;
  action?: Action;
  children: ReactNode;
}

export function RequirePerm({ doctype, action = 'read', children }: Props) {
  const { can } = useAuth();
  const { t } = useTranslation();

  // A null doctype means the page is generic (eg. dashboard) — let it through.
  if (!doctype) return <>{children}</>;

  if (!can(doctype, action)) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-center">
        <div className="max-w-sm">
          <h2 className="mb-1 text-lg font-semibold text-[color:var(--color-rose-600)]">
            {t('perm.denied.title')}
          </h2>
          <p className="text-sm text-[color:var(--color-muted)]">{t('perm.denied.message')}</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
