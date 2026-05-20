// AUTO-GENERATED — do not edit. Create src/modules/<module>/<slug>/overrides/page.tsx to override.
import { PageShell } from '@/components/erp/PageShell';
import { ModuleHubCards } from '@/components/erp/ModuleHub';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { useTranslation } from 'react-i18next';
import meta from './meta';

export default function Page() {
  const { t } = useTranslation();
  
  
  return (
    <PageShell title={t(meta.titleKey, { defaultValue: "Tax Compliance Dashboard" })} >
      <ModuleHubCards module={meta.module} currentPath={meta.routePath} />
    </PageShell>
  );
}
