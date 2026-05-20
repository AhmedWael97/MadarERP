import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { mfgCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={mfgCfg} />;
}
