import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { constructionCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={constructionCfg} />;
}
