// AUTO-GENERATED — do not edit. Create src/modules/<module>/<slug>/overrides/page.tsx to override.
import { PageShell } from '@/components/erp/PageShell';
import { TreeView } from '@/components/erp/TreeView';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import meta from './meta';
import { columns } from './meta';

export default function Page() {
  const { t } = useTranslation();
  
  
  return (
    <RequirePerm doctype={meta.doctype} action="read">
      <PageShell title={t(meta.titleKey, { defaultValue: "Chart of Accounts" })} actions={<Link to="/accounting/chart-of-accounts/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm"><Plus size={16} />{t('action.create')}</Link>}>
        <TreeView doctype={meta.doctype!} columns={columns} />
      </PageShell>
    </RequirePerm>
  );
}
