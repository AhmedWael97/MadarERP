import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { salesCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={salesCfg} />;
}
