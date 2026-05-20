import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { lmsCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={lmsCfg} />;
}
