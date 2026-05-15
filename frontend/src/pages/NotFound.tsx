import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-dvh place-items-center bg-app text-center">
      <div>
        <h1 className="mb-2 text-3xl font-bold">404</h1>
        <p className="mb-4 text-[color:var(--color-muted)]">{t('notFound.title')}</p>
        <Link to="/dashboard" className="text-primary underline">
          {t('notFound.back')}
        </Link>
      </div>
    </div>
  );
}
