import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';
import enPages from './locales/en/pages.json';
import arPages from './locales/ar/pages.json';

const STORAGE_KEY = 'madaar.locale';

function detectInitialLocale(): 'ar' | 'en' {
  if (typeof window === 'undefined') return 'ar';
  const stored = localStorage.getItem(STORAGE_KEY) as 'ar' | 'en' | null;
  if (stored === 'ar' || stored === 'en') return stored;
  return 'ar';
}

export function initI18n() {
  if (i18n.isInitialized) return i18n;
  i18n
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      lng: detectInitialLocale(),
      fallbackLng: 'ar',
      supportedLngs: ['ar', 'en'],
      ns: ['common', 'pages'],
      defaultNS: 'common',
      resources: {
        // The `pages` namespace is rebuilt by scripts/generate-pages.mjs each time the
        // scan is re-run; it carries one entry per generated route. The runtime looks
        // up `pages:page.<module>.<slug>.title` against this namespace, falling back
        // to the `defaultValue` baked into the generated index.tsx when missing.
        en: { common: enCommon, pages: enPages },
        ar: { common: arCommon, pages: arPages },
      },
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
      },
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
  return i18n;
}

export function setLocale(lng: 'ar' | 'en') {
  localStorage.setItem(STORAGE_KEY, lng);
  void i18n.changeLanguage(lng);
}

export default i18n;
