// AUTO-GENERATED — do not edit. Create src/modules/<module>/<slug>/overrides/page.tsx to override.
import { PageShell } from '@/components/erp/PageShell';
import { FormShell } from '@/components/erp/FormShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import meta from './meta';

export default function Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  return (
    <RequirePerm doctype={meta.doctype} action="read">
      <PageShell title={t(meta.titleKey, { defaultValue: "Edit — Workshop Invoices" })} actions={<button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-500 transition-all shadow-sm"><ArrowRight size={16} />{t('action.back')}</button>}>
        <FormShell doctype={meta.doctype!} name={id} onSuccess={() => navigate("/workshop/invoices")} />
      </PageShell>
    </RequirePerm>
  );
}
