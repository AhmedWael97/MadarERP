import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';
import enPages from './locales/en/pages.json';
import arPages from './locales/ar/pages.json';
import enForms from './locales/en/forms.json';
import arForms from './locales/ar/forms.json';
import enLegacy from './locales/en/legacy.json';
import arLegacy from './locales/ar/legacy.json';

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
      ns: ['common', 'pages', 'forms', 'legacy'],
      defaultNS: 'common',
      resources: {
        // `pages` is rebuilt by scripts/generate-pages.mjs each scan run.
        // `forms` translates DocType field / section labels.
        // `legacy` mirrors the reference Laravel `lang/{en,ar}.json` — keys are
        // Arabic source phrases, values are translations. Use the `tx(ar)`
        // helper below to look up reference labels verbatim.
        en: { common: enCommon, pages: enPages, forms: enForms, legacy: enLegacy },
        ar: { common: arCommon, pages: arPages, forms: arForms, legacy: arLegacy },
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
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  }
}

/**
 * Look up an Arabic source phrase in the legacy namespace, matching the
 * Laravel reference's `__('Arabic text')` semantics. Falls back to the
 * Arabic text itself if no translation exists for the current locale.
 *
 * Usage:  tx('فاتورة جديدة')   →  "New Invoice" (en) / "فاتورة جديدة" (ar)
 */
export function tx(arabic: string): string {
  if (!i18n.isInitialized) return arabic;
  const translated = i18n.t(arabic, { ns: 'legacy', defaultValue: arabic });
  return translated;
}

export default i18n;
