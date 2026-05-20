import ModuleDashboard from '@/components/erp/ModuleDashboard';
import { eventsCfg } from '@/lib/dashboards/configs';

export default function Page() {
  return <ModuleDashboard cfg={eventsCfg} />;
}
