import { Link } from 'react-router-dom';
import { Truck, Wrench, Fuel, MapPin, AlertTriangle, Tag, ChevronLeft } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { useTranslation } from 'react-i18next';

// Fleet settings hub — replaces the auto-generated "This page is not connected
// to a DocType yet" placeholder with a navigation grid for the fleet master
// data the rest of the module references.
const CARDS = [
  { to: '/fleet/vehicles',                        ar: 'المركبات',           en: 'Vehicles',          icon: Truck,         color: 'cyan' },
  { to: '/fleet/drivers',                         ar: 'السائقين',          en: 'Drivers',           icon: Truck,         color: 'blue' },
  { to: '/fleet/routes',                          ar: 'المسارات',          en: 'Routes',            icon: MapPin,        color: 'violet' },
  { to: '/app/madaar-vehicle-type',               ar: 'أنواع المركبات',     en: 'Vehicle Types',     icon: Tag,           color: 'emerald', external: true },
  { to: '/app/madaar-fuel-type',                  ar: 'أنواع الوقود',       en: 'Fuel Types',        icon: Fuel,          color: 'amber',  external: true },
  { to: '/app/madaar-maintenance-type',           ar: 'أنواع الصيانة',      en: 'Maintenance Types', icon: Wrench,        color: 'orange', external: true },
  { to: '/app/madaar-violation-type',             ar: 'أنواع المخالفات',    en: 'Violation Types',   icon: AlertTriangle, color: 'rose',   external: true },
  { to: '/app/madaar-accident-severity',          ar: 'درجات الحوادث',      en: 'Accident Severity', icon: AlertTriangle, color: 'pink',   external: true },
];

export default function Page() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  return (
    <PageShell
      title={isAr ? 'تعريفات الأسطول' : 'Fleet Definitions'}
      subtitle={isAr ? 'بيانات المركبات والسائقين والمسارات وتعريفات الصيانة والوقود' : 'Vehicles, drivers, routes and fleet master-data'}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          const inner = (
            <div className="group flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-brand-100)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-800 dark:text-white">{isAr ? c.ar : c.en}</div>
              </div>
              <ChevronLeft size={16} className={['shrink-0 text-slate-300 dark:text-slate-600 transition-colors group-hover:text-[color:var(--color-brand-500)]', isAr ? '' : 'rotate-180'].join(' ')} />
            </div>
          );
          return c.external
            ? <a key={c.to} href={c.to} target="_blank" rel="noopener noreferrer">{inner}</a>
            : <Link key={c.to} to={c.to}>{inner}</Link>;
        })}
      </div>
    </PageShell>
  );
}
