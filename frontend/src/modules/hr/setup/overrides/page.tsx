import { Link } from 'react-router-dom';
import { Users, Briefcase, Calendar, Award, FileText, Building2, ChevronLeft } from 'lucide-react';
import { PageShell } from '@/components/erp/PageShell';
import { useTranslation } from 'react-i18next';

// HR settings hub — replaces the auto-generated "This page is not connected to
// a DocType yet" placeholder with a navigation grid of ERPNext HR setup pages.
// All labels are Arabic per the rest of the side menu.
const CARDS = [
  { to: '/hr/departments',                              ar: 'الأقسام',                en: 'Departments',         icon: Building2, color: 'cyan'    },
  { to: '/app/designation',                             ar: 'المسميات الوظيفية',     en: 'Designations',        icon: Briefcase, color: 'blue',    external: true },
  { to: '/app/employment-type',                         ar: 'أنواع التوظيف',         en: 'Employment Types',    icon: Users,     color: 'violet',  external: true },
  { to: '/app/employee-grade',                          ar: 'درجات الموظفين',       en: 'Employee Grades',     icon: Award,     color: 'amber',   external: true },
  { to: '/app/leave-type',                              ar: 'أنواع الإجازات',        en: 'Leave Types',         icon: Calendar,  color: 'emerald', external: true },
  { to: '/app/holiday-list',                            ar: 'قائمة الإجازات الرسمية', en: 'Holiday Lists',      icon: Calendar,  color: 'teal',    external: true },
  { to: '/app/shift-type',                              ar: 'أنواع الورديات',         en: 'Shift Types',         icon: FileText,  color: 'pink',    external: true },
  { to: '/app/salary-component',                        ar: 'مكونات الراتب',         en: 'Salary Components',   icon: FileText,  color: 'orange',  external: true },
  { to: '/app/salary-structure',                        ar: 'هياكل الرواتب',         en: 'Salary Structures',   icon: FileText,  color: 'rose',    external: true },
];

export default function Page() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  return (
    <PageShell
      title={isAr ? 'تعريفات الموارد البشرية' : 'HR Definitions'}
      subtitle={isAr ? 'إعدادات الأقسام والمسميات والإجازات وهياكل الرواتب' : 'Departments, designations, leaves and salary configuration'}
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
