import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { crmCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={crmCfg} />;
}
