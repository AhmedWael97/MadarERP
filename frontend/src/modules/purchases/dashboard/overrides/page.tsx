import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { purchasesCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={purchasesCfg} />;
}
