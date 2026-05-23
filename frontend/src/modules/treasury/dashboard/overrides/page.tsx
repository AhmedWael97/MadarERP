import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { treasuryCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={treasuryCfg} />;
}
