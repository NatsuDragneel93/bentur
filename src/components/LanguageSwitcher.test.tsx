import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../pages/home/Home';
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n';
import { renderWithAuth } from '../test/renderWithAuth';

describe('Cambio lingua', () => {
  it('passa all\'inglese dalla home e ricorda la scelta', async () => {
    const user = userEvent.setup();
    renderWithAuth(<Home />);

    expect(screen.getByRole('link', { name: /Manuali/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Italiano' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'English' }));

    expect(screen.getByRole('link', { name: /Manuals/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('usa l\'italiano come lingua di ripiego per lingue non supportate', async () => {
    await i18n.changeLanguage('de');

    expect(i18n.resolvedLanguage).toBe('it');
    expect(i18n.t('nav.manuals')).toBe('Manuali');
  });
});
