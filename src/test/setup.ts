import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Nei test Firebase non deve mai essere inizializzato: niente rete, niente dati reali.
// I test che toccano Firestore mockano 'firebase/firestore' esplicitamente.
vi.mock('../services/firebase.service', () => ({
  default: { auth: {}, provider: {}, database: {} },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
