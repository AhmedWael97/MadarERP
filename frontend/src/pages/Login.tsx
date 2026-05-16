import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [usr, setUsr] = useState('Administrator');
  const [pwd, setPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // Bail to the dashboard via <Navigate> rather than calling navigate() during
  // render — react-router v6.4+ throws "navigate() in render" otherwise.
  // MUST come after all hook calls — placing it earlier produced a
  // "rendered fewer hooks than expected" crash on the anonymous→authenticated
  // transition because a useEffect below the return was being skipped.
  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorDetail(null);
    try {
      await login(usr, pwd);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      // Detect network-level failures (backend not yet ready / ECONNREFUSED).
      const isNetwork =
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error' ||
        err?.httpStatus === undefined && !err?.response;
      const detail = isNetwork
        ? 'Backend unreachable — the server may still be starting up (first boot can take 10–20 min). Please wait and try again.'
        : err?.response?.data?.message ||
          err?.response?.data?._error_message ||
          err?.message ||
          String(err);
      setErrorDetail(detail);
      toast.error(isNetwork ? 'Backend not ready yet' : detail || t('auth.login.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-app px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-[var(--radius-card)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 shadow-[var(--shadow-elev)]"
      >
        <h1 className="mb-1 text-2xl font-bold">
          <span className="text-primary">مدار</span> ERP
        </h1>
        <p className="mb-5 text-sm text-[color:var(--color-muted)]">{t('auth.login.title')}</p>

        <label className="mb-3 block">
          <span className="mb-1 inline-block text-xs font-medium text-[color:var(--color-muted)]">
            {t('auth.login.email')}
          </span>
          <Input value={usr} onChange={(e) => setUsr(e.target.value)} autoFocus />
        </label>

        <label className="mb-5 block">
          <span className="mb-1 inline-block text-xs font-medium text-[color:var(--color-muted)]">
            {t('auth.login.password')}
          </span>
          <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </label>

        {errorDetail && (
          <div className="mb-3 rounded-[var(--radius-input)] border border-[color:var(--color-rose-600)]/20 bg-[color:var(--color-rose-600)]/10 px-3 py-2 text-xs text-[color:var(--color-rose-700)]">
            {errorDetail}
          </div>
        )}

        <Button type="submit" loading={submitting} className="w-full">
          {t('auth.login.submit')}
        </Button>

        <p className="mt-4 text-center text-xs text-[color:var(--color-muted)]">
          {i18n.language === 'ar' ? 'English' : 'العربية'}{' '}
          <button
            type="button"
            className="ms-1 text-primary underline"
            onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
          >
            ↔
          </button>
        </p>
      </form>
    </div>
  );
}
