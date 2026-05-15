import { useTranslation } from 'react-i18next';
import { Wallet, TrendingUp, Users, ShoppingBag, Boxes, Briefcase, Truck, Receipt } from 'lucide-react';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { PageShell } from '../components/erp/PageShell';
import { StatCard } from '../components/erp/StatCard';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth/useAuth';
import { formatCurrency, formatNumber } from '../lib/formatters/numerals';

interface DashboardStats {
  message?: {
    company_exists: boolean;
    sales_today: number;
    purchases_today: number;
    customers: number;
    suppliers: number;
    items: number;
    employees: number;
    invoices: number;
    outstanding_receivables: number;
  };
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const { data, isLoading } = useFrappeGetCall<DashboardStats>(
    'madaar_core.api.dashboard_stats',
    undefined,
    'dashboard:stats',
  );

  const s = data?.message;
  const setupNeeded = s && !s.company_exists;

  const tiles = [
    {
      label: t('dashboard.stats.sales_today'),
      value: formatCurrency(s?.sales_today ?? 0, i18n.language),
      variant: 'orange' as const,
      icon: <Wallet size={28} />,
    },
    {
      label: t('dashboard.stats.purchases_today'),
      value: formatCurrency(s?.purchases_today ?? 0, i18n.language),
      variant: 'teal' as const,
      icon: <ShoppingBag size={28} />,
    },
    {
      label: t('dashboard.stats.customers'),
      value: formatNumber(s?.customers ?? 0, i18n.language),
      variant: 'violet' as const,
      icon: <Users size={28} />,
    },
    {
      label: t('dashboard.stats.profit'),
      value: formatCurrency(s?.outstanding_receivables ?? 0, i18n.language),
      variant: 'yellow' as const,
      icon: <TrendingUp size={28} />,
    },
  ];

  const secondaryTiles = [
    {
      label: t('dashboard.stats.invoices'),
      value: formatNumber(s?.invoices ?? 0, i18n.language),
      icon: <Receipt size={22} />,
    },
    {
      label: t('dashboard.stats.items'),
      value: formatNumber(s?.items ?? 0, i18n.language),
      icon: <Boxes size={22} />,
    },
    {
      label: t('dashboard.stats.suppliers'),
      value: formatNumber(s?.suppliers ?? 0, i18n.language),
      icon: <Truck size={22} />,
    },
    {
      label: t('dashboard.stats.employees'),
      value: formatNumber(s?.employees ?? 0, i18n.language),
      icon: <Briefcase size={22} />,
    },
  ];

  return (
    <PageShell
      title={t('dashboard.welcome', { name: user?.fullName || user?.email || '' })}
      subtitle={t('dashboard.subtitle')}
    >
      {setupNeeded && (
        <div className="mb-5 rounded-[var(--radius-card)] border border-[color:var(--color-orange-400)]/30 bg-[color:var(--color-orange-400)]/10 p-4 text-sm">
          <div className="mb-1 font-semibold text-[color:var(--color-orange-500)]">
            {t('dashboard.no_company')}
          </div>
          <p className="text-[color:var(--color-muted)]">{t('dashboard.complete_setup')}</p>
          <a
            href="http://localhost:8000/app"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs font-medium text-[color:var(--color-primary)] underline"
          >
            {t('common.go_to_setup')} →
          </a>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <StatCard
            key={tile.label}
            label={tile.label}
            value={tile.value}
            variant={tile.variant}
            icon={tile.icon}
            caption={isLoading ? t('common.loading') : undefined}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryTiles.map((tile) => (
          <Card key={tile.label} className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[color:var(--color-muted)]">{tile.label}</div>
              <div className="mt-1 text-2xl font-bold">{tile.value}</div>
            </div>
            <div className="text-[color:var(--color-muted)] opacity-60">{tile.icon}</div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
