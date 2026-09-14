import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import it from './locales/it';
import en from './locales/en';

export const SUPPORTED_LANGUAGES = ['it', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Chiave con cui la lingua scelta viene ricordata sul dispositivo
export const LANGUAGE_STORAGE_KEY = 'bentur.language';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    // Lingua scelta in precedenza, altrimenti quella del browser; se non supportata, italiano
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: 'it',
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      // React fa già l'escape dei testi
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

const syncHtmlLang = (language: string) => {
  document.documentElement.lang = language;
};

i18n.on('languageChanged', syncHtmlLang);
syncHtmlLang(i18n.resolvedLanguage ?? 'it');

export default i18n;
