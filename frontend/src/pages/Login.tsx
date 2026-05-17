import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth/useAuth';

// Module tiles mirror the reference login screen (resources/views/auth/login.blade.php).
// Order, labels and image filenames match 1:1 — assets live in frontend/public/images/modules/.
const MODULES: Array<{ key: string; nameAr: string; nameEn: string; img: string }> = [
  { key: 'accounting',    nameAr: 'الحسابات العامة',     nameEn: 'Accounting',         img: 'accounting' },
  { key: 'sales',         nameAr: 'المبيعات',            nameEn: 'Sales',              img: 'sales' },
  { key: 'purchases',     nameAr: 'المشتريات',           nameEn: 'Purchases',          img: 'purchases' },
  { key: 'inventory',     nameAr: 'المخزون',             nameEn: 'Inventory',          img: 'inventory' },
  { key: 'projects',      nameAr: 'المشاريع',            nameEn: 'Projects',           img: 'projects' },
  { key: 'manufacturing', nameAr: 'التصنيع',             nameEn: 'Manufacturing',      img: 'manufacturing' },
  { key: 'pos',           nameAr: 'نقطة البيع',          nameEn: 'POS',                img: 'pos' },
  { key: 'commissions',   nameAr: 'العمولات',            nameEn: 'Commissions',        img: 'commissions' },
  { key: 'hr',            nameAr: 'الموارد البشرية',      nameEn: 'HR',                 img: 'hr' },
  { key: 'distribution',  nameAr: 'التوزيع',             nameEn: 'Distribution',       img: 'distribution' },
  { key: 'property',      nameAr: 'إدارة الممتلكات',      nameEn: 'Property',           img: 'property' },
  { key: 'construction',  nameAr: 'المقاولات',           nameEn: 'Construction',       img: 'construction' },
  { key: 'logistics',     nameAr: 'اللوجستيك',           nameEn: 'Logistics',          img: 'logistics' },
  { key: 'fleet',         nameAr: 'الأسطول',             nameEn: 'Fleet',              img: 'fleet' },
  { key: 'maintenance',   nameAr: 'الصيانة',             nameEn: 'Maintenance',        img: 'maintenance' },
  { key: 'ecommerce',     nameAr: 'التجارة الإلكترونية',  nameEn: 'E-Commerce',         img: 'ecommerce' },
  { key: 'car_service',   nameAr: 'صيانة السيارات',       nameEn: 'Car Service',        img: 'car_service' },
  { key: 'contacts',      nameAr: 'العملاء والموردين',    nameEn: 'Contacts',           img: 'contacts' },
  { key: 'restaurant',    nameAr: 'إدارة المطاعم',        nameEn: 'Restaurant',         img: 'restaurant' },
];

export default function Login() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [usr, setUsr] = useState('Administrator');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [dark, setDark] = useState<boolean>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('madaar_dark_mode', String(next)); } catch { /* no-op */ }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorDetail(null);
    try {
      await login(usr, pwd);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const isNetwork =
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error' ||
        (err?.httpStatus === undefined && !err?.response);
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
    <div className="login-page h-screen flex overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ═════ Branding side — module grid (hidden on small screens) ═════ */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/50 to-slate-100 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="login-orb login-orb-1" />
          <div className="login-orb login-orb-2" />
          <div className="login-orb login-orb-3" />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* Shimmer line on inner edge */}
          <div
            className={[
              'absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[color:var(--color-brand-500)] to-transparent login-shimmer-line',
              isAr ? 'left-0' : 'right-0',
            ].join(' ')}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full h-full px-6 py-4">
          {/* Logo + tagline */}
          <div className="mb-3 text-center login-fade-in shrink-0" style={{ animationDelay: '0.1s' }}>
            <img
              src="/images/madaar-logo.png"
              alt="Madaar Enterprise"
              className="h-20 mx-auto dark:brightness-0 dark:invert opacity-95 mb-2"
            />
            <p className="text-slate-700 dark:text-slate-300 text-lg font-bold leading-relaxed max-w-md">
              {isAr ? 'نظام إدارة موارد المؤسسات المتكامل' : 'Integrated Enterprise Resource Planning'}
            </p>
          </div>

          {/* Module tile grid */}
          <div className="overflow-y-auto overflow-x-hidden flex-1 w-full rounded-xl -mx-1 px-1">
            <div className="grid grid-cols-6 gap-2 w-full">
              {MODULES.map((m, i) => (
                <div
                  key={m.key}
                  className="module-card-v2 login-fade-in"
                  style={{ animationDelay: `${0.3 + i * 0.04}s` }}
                >
                  <div className="module-card-inner group relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] backdrop-blur-sm cursor-default transition-all duration-400 hover:bg-white dark:hover:bg-white/[0.10] hover:border-[color:var(--color-brand-300)] dark:hover:border-[color:var(--color-brand-500)]/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)] dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:-translate-y-0.5">
                    <div className="w-full aspect-square rounded-lg flex items-center justify-center transition-transform duration-500 group-hover:scale-105 overflow-hidden">
                      <img
                        src={`/images/modules/${m.img}.png`}
                        alt={isAr ? m.nameAr : m.nameEn}
                        className="w-full h-full object-contain drop-shadow-md transition-all duration-500 group-hover:drop-shadow-[0_4px_12px_rgba(99,102,241,0.3)] group-hover:scale-110"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center leading-tight group-hover:text-[color:var(--color-brand-600)] dark:group-hover:text-white transition-colors duration-300 shrink-0">
                      {isAr ? m.nameAr : m.nameEn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═════ Form side ═════ */}
      <div className="w-full lg:w-[480px] lg:min-w-[480px] h-screen flex flex-col justify-center relative bg-white dark:bg-slate-900">
        {/* Decorative blurs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[color:var(--color-brand-500)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 px-8 lg:px-12 py-6 max-w-md mx-auto w-full">
          {/* Mobile-only logo */}
          <div className="lg:hidden mb-8 text-center">
            <img src="/images/madaar-logo.png" alt="Madaar Enterprise" className="h-14 mx-auto mb-3" />
          </div>

          <div className="text-center mb-6 login-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">
              {isAr ? 'مرحباً بعودتك 👋' : 'Welcome back 👋'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isAr
                ? 'سجّل دخولك للوصول إلى لوحة التحكم'
                : 'Sign in to access your dashboard'}
            </p>
          </div>

          {errorDetail && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20">
              <div className="flex items-center gap-2 flex-row-reverse">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">{errorDetail}</p>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email / Username */}
            <div className="login-fade-in" style={{ animationDelay: '0.3s' }}>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {isAr ? 'البريد الإلكتروني' : 'Email / Username'}
              </label>
              <div className="relative">
                <div className={['absolute inset-y-0 flex items-center pointer-events-none', isAr ? 'right-0 pr-4' : 'left-0 pl-4'].join(' ')}>
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="email"
                  value={usr}
                  onChange={(e) => setUsr(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder={isAr ? 'البريد الإلكتروني' : 'Email'}
                  dir="ltr"
                  className={[
                    'w-full py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 input-focus hover:border-[color:var(--color-brand-300)] dark:hover:border-[color:var(--color-brand-500)]/30 transition-all',
                    isAr ? 'pr-12 pl-4 text-left' : 'pl-12 pr-4 text-left',
                  ].join(' ')}
                  style={{ textAlign: 'left' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-fade-in" style={{ animationDelay: '0.4s' }}>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <div className={['absolute inset-y-0 flex items-center pointer-events-none', isAr ? 'right-0 pr-4' : 'left-0 pl-4'].join(' ')}>
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  id="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  dir="ltr"
                  className={[
                    'w-full py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 input-focus hover:border-[color:var(--color-brand-300)] dark:hover:border-[color:var(--color-brand-500)]/30 transition-all',
                    isAr ? 'pr-12 pl-12 text-left' : 'pl-12 pr-12 text-left',
                  ].join(' ')}
                  style={{ textAlign: 'left' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className={[
                    'absolute inset-y-0 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors',
                    isAr ? 'left-0 pl-4' : 'right-0 pr-4',
                  ].join(' ')}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {!showPwd ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between login-fade-in" style={{ animationDelay: '0.5s' }}>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[color:var(--color-brand-500)] focus:ring-[color:var(--color-brand-500)] transition-all"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                  {isAr ? 'تذكرني' : 'Remember me'}
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="login-fade-in" style={{ animationDelay: '0.6s' }}>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-brand-600)] hover:from-[color:var(--color-brand-600)] hover:to-[color:var(--color-brand-700)] text-white font-semibold rounded-2xl shadow-lg shadow-[color:var(--color-brand-500)]/30 hover:shadow-xl hover:shadow-[color:var(--color-brand-500)]/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-80 disabled:pointer-events-none"
              >
                {!submitting ? (
                  <span className="flex items-center gap-2">
                    {isAr ? 'تسجيل الدخول' : 'Sign in'}
                    <svg className={isAr ? 'w-5 h-5 rotate-180' : 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {isAr ? 'جاري الدخول...' : 'Signing in…'}
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Language + Dark mode toggle row */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-3 login-fade-in" style={{ animationDelay: '0.7s' }}>
            <button
              type="button"
              onClick={toggleDark}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              {dark
                ? (isAr ? '☀️ الوضع النهاري' : '☀️ Light mode')
                : (isAr ? '🌙 الوضع الليلي' : '🌙 Dark mode')}
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              {isAr ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </div>

      {/* Scoped login-page styles — orbs, shimmer, fade-in (mirrored 1:1 from
       *  resources/views/auth/login.blade.php). */}
      <style>{`
        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }
        .login-orb-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%);
          top: -100px; right: -100px;
          animation: loginOrbFloat 8s ease-in-out infinite;
        }
        .login-orb-2 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(20,184,166,0.3), transparent 70%);
          bottom: -80px; left: -80px;
          animation: loginOrbFloat 10s ease-in-out 2s infinite;
        }
        .login-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%);
          top: 50%; left: 30%;
          animation: loginOrbFloat 12s ease-in-out 4s infinite;
        }
        @keyframes loginOrbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25%      { transform: translate(30px, -20px) scale(1.05); }
          50%      { transform: translate(-20px, 30px) scale(0.95); }
          75%      { transform: translate(20px, 10px) scale(1.02); }
        }
        .login-shimmer-line { animation: loginShimmer 3s ease-in-out infinite; }
        @keyframes loginShimmer {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 0.8; }
        }
        .login-fade-in {
          opacity: 0;
          transform: translateY(20px);
          animation: loginFadeInUp 0.7s ease-out forwards;
        }
        @keyframes loginFadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .module-card-inner::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 1rem;
          background: linear-gradient(135deg, rgba(99,102,241,0), rgba(99,102,241,0));
          transition: background 0.5s ease;
          z-index: -1;
        }
        .module-card-inner:hover::before {
          background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05));
        }
        .module-card-inner:hover img { animation: moduleImgPulse 0.6s ease-in-out; }
        @keyframes moduleImgPulse {
          0%   { transform: scale(1.1); }
          50%  { transform: scale(1.18); }
          100% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
