import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetupEditor from './SetupEditor';
import { renderWithAuth } from '../../../test/renderWithAuth';
import tourArtistsService from '../../../services/tourArtists.service';

vi.mock('../../../services/tourArtists.service', () => ({
  default: { getTourArtistById: vi.fn() },
}));

// jsdom non ha il canvas: le forme Konva diventano semplici elementi HTML
vi.mock('react-konva', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Stage: passthrough,
    Layer: passthrough,
    Group: ({ children, id, onMouseDown }: { children?: React.ReactNode; id: string; onMouseDown: () => void }) => (
      <div data-testid="stage-element" data-id={id} onClick={onMouseDown}>{children}</div>
    ),
    Rect: () => null,
    Ellipse: () => null,
    Line: () => null,
    Text: ({ text }: { text: string }) => <span>{text}</span>,
    Transformer: () => null,
  };
});

const renderEditor = (setupKey = 'a') =>
  renderWithAuth(<SetupEditor />, {
    route: `/tours/t1/artists/a1/setup/${setupKey}`,
    path: '/tours/:tourId/artists/:artistId/setup/:setupKey',
    extraRoutes: { '/tours/:tourId/artists/:artistId': <div>Dettaglio artista</div> },
  });

describe('SetupEditor', () => {
  beforeEach(() => {
    vi.mocked(tourArtistsService).getTourArtistById.mockResolvedValue({
      id: 'a1', tourId: 't1', name: 'Anna', role: 'Voce', createdAt: new Date(), updatedAt: new Date(),
    });
  });

  it('mostra il titolo del setup e il nome dell\'artista', async () => {
    renderEditor('b');

    expect(screen.getByRole('heading', { name: 'Setup B' })).toBeInTheDocument();
    expect(await screen.findByText('Anna')).toBeInTheDocument();
  });

  it('aggiunge forme dalla palette ed elimina quella selezionata', async () => {
    renderEditor();

    await userEvent.click(await screen.findByRole('button', { name: 'Aggiungi Rettangolo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Aggiungi Testo' }));

    expect(screen.getAllByTestId('stage-element')).toHaveLength(2);
    // Il testo nasce con un'etichetta predefinita ed è selezionato
    expect(within(screen.getAllByTestId('stage-element')[1]).getByText('Testo')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Elimina forma' }));

    const remaining = screen.getAllByTestId('stage-element');
    expect(remaining).toHaveLength(1);
    expect(within(remaining[0]).queryByText('Testo')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Elimina forma' })).toBeDisabled();
  });

  it('seleziona una forma cliccandola', async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole('button', { name: 'Aggiungi Cerchio' }));
    await userEvent.click(screen.getByRole('button', { name: 'Elimina forma' }));
    await userEvent.click(screen.getByRole('button', { name: 'Aggiungi Quadrato' }));
    await userEvent.click(screen.getByRole('button', { name: 'Aggiungi Triangolo' }));

    await userEvent.click(screen.getAllByTestId('stage-element')[0]);
    await userEvent.keyboard('{Delete}');

    expect(screen.getAllByTestId('stage-element')).toHaveLength(1);
  });

  it('con un setup inesistente torna al dettaglio dell\'artista', async () => {
    renderEditor('c');

    expect(await screen.findByText('Dettaglio artista')).toBeInTheDocument();
  });

  it('mostra "non trovato" se l\'artista non è accessibile', async () => {
    vi.mocked(tourArtistsService).getTourArtistById.mockResolvedValue(null);
    renderEditor();

    expect(await screen.findByText('Artista non trovato')).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });
});
