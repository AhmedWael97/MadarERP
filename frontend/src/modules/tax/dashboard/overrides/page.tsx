import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { taxCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={taxCfg} />;
}
