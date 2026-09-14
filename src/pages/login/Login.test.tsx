import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { renderWithAuth } from '../../test/renderWithAuth';

const homeRoute = { '/home': <div>Pagina home</div> };

describe('Login', () => {
  it('reindirizza alla home un utente già autenticato', () => {
    renderWithAuth(<Login />, { extraRoutes: homeRoute });

    expect(screen.getByText('Pagina home')).toBeInTheDocument();
  });

  it('esegue il login Google e porta alla home', async () => {
    const { auth } = renderWithAuth(<Login />, { auth: { user: null }, extraRoutes: homeRoute });

    await userEvent.click(screen.getByRole('button', { name: 'Accedi con Google' }));

    expect(auth.signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Pagina home')).toBeInTheDocument();
  });
});
