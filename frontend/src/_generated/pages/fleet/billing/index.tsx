// AUTO-GENERATED — do not edit. Create src/modules/<module>/<slug>/overrides/page.tsx to override.
import { PageShell } from '@/components/erp/PageShell';
import { DataTable } from '@/components/erp/DataTable';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import meta from './meta';
import { columns } from './meta';

export default function Page() {
  const { t } = useTranslation();
  
  
  return (
    <PageShell title={t(meta.titleKey, { defaultValue: "Billing" })} actions={<Link to="/fleet/billing/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm"><Plus size={16} />{t('action.create')}</Link>}>
      <div className="rounded-[var(--radius-card)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-card)] px-6 py-10 text-center text-sm text-[color:var(--color-muted)] shadow-[var(--shadow-card)]">{t('page.unmapped', { defaultValue: 'This page is not connected to a DocType yet.' })}</div>
    </PageShell>
  );
}
