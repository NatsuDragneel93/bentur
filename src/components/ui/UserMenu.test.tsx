import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserMenu from './UserMenu';
import { renderWithAuth } from '../../test/renderWithAuth';

describe('UserMenu', () => {
  it('mostra l\'iniziale se manca la foto e apre nome, email ed "Esci"', async () => {
    renderWithAuth(<UserMenu />, { route: '/home', extraRoutes: { '/': <div>Pagina di login</div> } });

    const avatar = screen.getByRole('button', { name: 'Profilo' });
    expect(avatar).toHaveTextContent('M');
    await userEvent.click(avatar);

    expect(screen.getByText('Mario Rossi')).toBeInTheDocument();
    expect(screen.getByText('mario@example.com')).toBeInTheDocument();
  });

  it('esce e torna al login', async () => {
    const { auth } = renderWithAuth(<UserMenu />, { route: '/home', extraRoutes: { '/': <div>Pagina di login</div> } });

    await userEvent.click(screen.getByRole('button', { name: 'Profilo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Esci' }));

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Pagina di login')).toBeInTheDocument();
  });

  it('si chiude con Esc', async () => {
    renderWithAuth(<UserMenu />, { route: '/home' });

    await userEvent.click(screen.getByRole('button', { name: 'Profilo' }));
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('button', { name: 'Esci' })).not.toBeInTheDocument();
  });
});
