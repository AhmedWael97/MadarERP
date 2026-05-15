import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';

const DAY_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatToday(locale: string): string {
  const d = new Date();
  if (locale === 'ar') {
    return `${DAY_AR[d.getDay()]}، ${d.getDate()} ${MONTH_AR[d.getMonth()]} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function Footer() {
  const { i18n } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-card)] px-6 py-3 text-[11px] text-[color:var(--color-muted)]">
      <div>{formatToday(i18n.language)}</div>
      <div className="flex items-center gap-1.5">
        <span>طُوّر بواسطة</span>
        <Heart size={11} className="text-[color:var(--color-rose-500)]" fill="currentColor" />
        <span className="font-semibold text-[color:var(--color-slate-700)]">مدار للبرمجيات</span>
      </div>
      <div>© {year} مدار ١٫٨٥ ERP — منصة محاسبية شاملة لإدارة أعمال المؤسسات</div>
    </footer>
  );
}
