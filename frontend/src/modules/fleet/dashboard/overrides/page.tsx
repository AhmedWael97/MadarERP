import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { fleetCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={fleetCfg} />;
}
