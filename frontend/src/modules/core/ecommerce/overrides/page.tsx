import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { ecommerceCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={ecommerceCfg} />;
}
