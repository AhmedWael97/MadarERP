import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { fixedAssetsCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={fixedAssetsCfg} />;
}
