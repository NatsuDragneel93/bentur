import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArtistList from './ArtistList';
import { artistListKeyFromPath, artistListPath } from './artistListPaths';
import { renderWithAuth } from '../../../test/renderWithAuth';
import tourArtistsService from '../../../services/tourArtists.service';
import * as artistLists from '../../../services/artistLists.service';

vi.mock('../../../services/tourArtists.service', () => ({
  default: { getTourArtistById: vi.fn() },
}));

vi.mock('../../../services/artistLists.service', () => {
  const fake = () => ({
    getCategories: vi.fn().mockResolvedValue([]),
    addCategory: vi.fn(),
    renameCategory: vi.fn(),
    deleteCategory: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    updateAllItems: vi.fn(),
    deleteItem: vi.fn(),
    moveItem: vi.fn(),
  });
  return {
    artistSpareService: { forArtist: vi.fn(fake) },
    artistToDoService: { forArtist: vi.fn(fake) },
    artistConsumablesService: { forArtist: vi.fn(fake) },
    artistCheckBeforeShowService: { forArtist: vi.fn(fake) },
  };
});

const mockedArtists = vi.mocked(tourArtistsService);
const PATH = '/tours/:tourId/artists/:artistId/lists/:listPath';

const renderList = (listPath: string) =>
  renderWithAuth(<ArtistList />, {
    route: `/tours/t1/artists/a1/lists/${listPath}`,
    path: PATH,
    extraRoutes: { '/tours/:tourId/artists/:artistId': <div>Dettaglio artista</div> },
  });

describe('artistListPaths', () => {
  it('converte chiave e segmento dell\'URL nei due sensi', () => {
    expect(artistListPath('t1', 'a1', 'checkBeforeShow')).toBe('/tours/t1/artists/a1/lists/check-before-show');
    expect(artistListKeyFromPath('to-do')).toBe('toDo');
    expect(artistListKeyFromPath('setup-a')).toBeNull();
    expect(artistListKeyFromPath(undefined)).toBeNull();
  });
});

describe('ArtistList', () => {
  beforeEach(() => {
    mockedArtists.getTourArtistById.mockResolvedValue({
      id: 'a1', tourId: 't1', name: 'Anna', role: 'Voce', createdAt: new Date(), updatedAt: new Date(),
    });
  });

  it.each([
    ['spare', 'Spare', artistLists.artistSpareService],
    ['to-do', 'To Do', artistLists.artistToDoService],
    ['consumables', 'Consumabili', artistLists.artistConsumablesService],
    ['check-before-show', 'To Check Before Showtime', artistLists.artistCheckBeforeShowService],
  ])('/%s mostra la lista "%s" dell\'artista', async (listPath, title, service) => {
    renderList(listPath);

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText('Anna · Voce')).toBeInTheDocument();
    expect(service.forArtist).toHaveBeenCalledWith('t1', 'a1');
  });

  it('solo To Check Before Showtime ha l\'azzeramento delle spunte', async () => {
    renderList('check-before-show');
    expect(await screen.findByRole('button', { name: /Azzera tutte le spunte/ })).toBeDisabled();
  });

  it('torna al dettaglio dell\'artista', async () => {
    renderList('spare');

    await userEvent.click(await screen.findByRole('button', { name: 'Anna' }));

    expect(await screen.findByText('Dettaglio artista')).toBeInTheDocument();
  });

  it('con una lista inesistente torna al dettaglio dell\'artista', async () => {
    renderList('setup-a');

    expect(await screen.findByText('Dettaglio artista')).toBeInTheDocument();
  });

  it('mostra "non trovato" se l\'artista non esiste o non è accessibile', async () => {
    mockedArtists.getTourArtistById.mockResolvedValue(null);
    renderList('spare');

    expect(await screen.findByText('Artista non trovato')).toBeInTheDocument();
    await waitFor(() => expect(artistLists.artistSpareService.forArtist).not.toHaveBeenCalled());
  });
});
