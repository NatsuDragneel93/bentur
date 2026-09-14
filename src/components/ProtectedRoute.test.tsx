import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { renderWithAuth } from '../test/renderWithAuth';

const protectedPage = <ProtectedRoute><div>Contenuto protetto</div></ProtectedRoute>;

describe('ProtectedRoute', () => {
  it('mostra il caricamento finché lo stato di autenticazione non è noto', () => {
    renderWithAuth(protectedPage, { route: '/manuals', auth: { user: null, loading: true } });

    expect(screen.getByText('Caricamento...')).toBeInTheDocument();
    expect(screen.queryByText('Contenuto protetto')).not.toBeInTheDocument();
  });

  it('reindirizza al login se l\'utente non è autenticato', () => {
    renderWithAuth(protectedPage, {
      route: '/manuals',
      auth: { user: null },
      extraRoutes: { '/': <div>Pagina login</div> },
    });

    expect(screen.getByText('Pagina login')).toBeInTheDocument();
    expect(screen.queryByText('Contenuto protetto')).not.toBeInTheDocument();
  });

  it('mostra il contenuto se l\'utente è autenticato', () => {
    renderWithAuth(protectedPage, { route: '/manuals' });

    expect(screen.getByText('Contenuto protetto')).toBeInTheDocument();
  });
});
