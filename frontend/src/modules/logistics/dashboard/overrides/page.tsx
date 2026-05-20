import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { logisticsCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={logisticsCfg} />;
}
