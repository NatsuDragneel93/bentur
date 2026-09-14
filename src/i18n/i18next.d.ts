import 'i18next';
import type it from './locales/it';

// Chiavi di traduzione tipizzate: t('chiave.inesistente') è un errore di compilazione
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof it;
    };
  }
}
