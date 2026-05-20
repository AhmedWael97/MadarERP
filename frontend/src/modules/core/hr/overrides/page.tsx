import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { hrCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={hrCfg} />;
}
