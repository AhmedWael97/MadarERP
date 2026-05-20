import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { inventoryCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={inventoryCfg} />;
}
