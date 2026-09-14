import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import i18n from '../i18n';

// Nei test Firebase non deve mai essere inizializzato: niente rete, niente dati reali.
// I test che toccano Firestore mockano 'firebase/firestore' esplicitamente.
vi.mock('../services/firebase.service', () => ({
  default: { auth: {}, provider: {}, database: {} },
}));

// I test verificano i testi italiani, indipendentemente dalla lingua del sistema
beforeEach(async () => {
  await i18n.changeLanguage('it');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
