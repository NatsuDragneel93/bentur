import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopBar } from './PageLayout';
import { renderWithAuth } from '../../test/renderWithAuth';

describe('TopBar', () => {
  it('mostra il pulsante Home fuori dalla home', () => {
    renderWithAuth(
      <TopBar back={{ label: 'Manuali', onClick: vi.fn() }} />,
      { route: '/manuals', path: '/manuals' }
    );

    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manuali' })).toBeInTheDocument();
  });

  it('naviga alla home al click su Home', async () => {
    renderWithAuth(
      <TopBar back={{ label: 'Manuali', onClick: vi.fn() }} />,
      {
        route: '/manuals',
        path: '/manuals',
        extraRoutes: {
          '/home': <div>Home page</div>,
        },
      }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Home' }));

    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });

  it('nasconde Home nella pagina home', () => {
    renderWithAuth(
      <TopBar back={{ label: 'Manuali', onClick: vi.fn() }} />,
      { route: '/home', path: '/home' }
    );

    expect(screen.queryByRole('button', { name: 'Home' })).not.toBeInTheDocument();
  });

  it('consente di intercettare il click Home', async () => {
    const onHomeClick = vi.fn();

    renderWithAuth(
      <TopBar back={{ label: 'Manuali', onClick: vi.fn() }} onHomeClick={onHomeClick} />,
      { route: '/manuals', path: '/manuals' }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Home' }));

    expect(onHomeClick).toHaveBeenCalledTimes(1);
  });
});
