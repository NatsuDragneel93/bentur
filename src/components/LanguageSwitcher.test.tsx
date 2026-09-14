import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import Header from './Header';
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n';
import { AuthContext } from '../context/auth.context';
import { fakeUser } from '../test/renderWithAuth';

const renderHeader = () =>
  render(
    <AuthContext.Provider value={{ user: fakeUser, loading: false, signInWithGoogle: async () => {}, logout: async () => {} }}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('Cambio lingua', () => {
  it('passa all\'inglese dal menu profilo e ricorda la scelta', async () => {
    const user = userEvent.setup();
    renderHeader();

    expect(screen.getByRole('link', { name: 'Manuali' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Profilo' }));
    const italian = screen.getByRole('button', { name: 'IT' });
    expect(italian).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByRole('link', { name: 'Manuals' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Logout/ })).toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('usa l\'italiano come lingua di ripiego per lingue non supportate', async () => {
    await i18n.changeLanguage('de');

    expect(i18n.resolvedLanguage).toBe('it');
    expect(i18n.t('nav.manuals')).toBe('Manuali');
  });
});
