import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { User } from 'firebase/auth';
import { vi } from 'vitest';
import { AuthContext, AuthContextValue } from '../context/auth.context';
import { ToastProvider } from '../context/ToastProvider';

export const fakeUser = {
  uid: 'user-1',
  displayName: 'Mario Rossi',
  email: 'mario@example.com',
  photoURL: null,
} as unknown as User;

interface Options {
  auth?: Partial<AuthContextValue>;
  // URL iniziale del router
  route?: string;
  // Rotte aggiuntive, utili per verificare i redirect
  extraRoutes?: Record<string, React.ReactNode>;
  path?: string;
}

// Renderizza un componente dentro router, notifiche e contesto di autenticazione finto
export const renderWithAuth = (ui: React.ReactElement, options: Options = {}) => {
  const auth: AuthContextValue = {
    user: fakeUser,
    loading: false,
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    ...options.auth,
  };
  const route = options.route ?? '/';

  const result = render(
    <AuthContext.Provider value={auth}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={options.path ?? route} element={ui} />
            {Object.entries(options.extraRoutes ?? {}).map(([path, element]) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );

  return { ...result, auth };
};
