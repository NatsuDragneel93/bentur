import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TourOverview, { ArtistListsContext } from './TourOverview';
import { renderWithAuth } from '../../test/renderWithAuth';
import toursService from '../../services/tours.service';
import tourArtistsService from '../../services/tourArtists.service';
import { emptyStats, ListStats } from '../../utils/tourOverview';

vi.mock('../../services/tours.service', () => ({ default: { getUserTours: vi.fn() } }));
vi.mock('../../services/tourArtists.service', () => ({
  default: { getTourArtists: vi.fn(), countTourArtists: vi.fn() },
}));

const mockedTours = vi.mocked(toursService);
const mockedArtists = vi.mocked(tourArtistsService);

const tour = (id: string, name: string) => ({
  id,
  name,
  ownerId: 'user-1',
  memberIds: ['user-1'],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const artist = (id: string, name: string, role: string) => ({
  id,
  tourId: 't1',
  name,
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Finta lista dell'artista: comunica i conteggi come farebbe ArtistListBlock
const FakeList: React.FC<ArtistListsContext & { stats: ListStats }> = ({ artistId, onStats, stats }) => {
  useEffect(() => {
    onStats('toDo', stats);
    // Una sola notifica per artista, come il caricamento reale
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <p>Lista di {artistId}</p>;
};

const renderOverview = (stats: ListStats = { ...emptyStats, total: 4, done: 1 }) =>
  renderWithAuth(
    <TourOverview
      title="To Do - Tour"
      subtitle="Le cose da fare"
      back={{ label: 'To Do', onClick: vi.fn() }}
      tourBadge={({ total, done }) => (total > 0 ? `${done} di ${total} fatti` : null)}
      renderLists={context => <FakeList {...context} stats={stats} />}
    />
  );

describe('TourOverview', () => {
  beforeEach(() => {
    mockedTours.getUserTours.mockResolvedValue([tour('t1', 'Autumn Tour'), tour('t2', 'Summer Tour')]);
    mockedArtists.getTourArtists.mockResolvedValue([artist('a1', 'Davide Muti', 'Batteria')]);
    mockedArtists.countTourArtists.mockResolvedValue(1);
  });

  it('mostra i tour chiusi, senza leggerne gli artisti', async () => {
    renderOverview();

    const toggle = await screen.findByRole('button', { name: /Autumn Tour/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /Summer Tour/ })).toBeInTheDocument();
    expect(mockedArtists.getTourArtists).not.toHaveBeenCalled();
    expect(await screen.findAllByText('1 artista')).toHaveLength(2);
  });

  it('apre un tour, carica gli artisti e mostra le loro liste', async () => {
    renderOverview();

    await userEvent.click(await screen.findByRole('button', { name: /Autumn Tour/ }));

    expect(await screen.findByText('Davide Muti')).toBeInTheDocument();
    expect(screen.getByText('Batteria')).toBeInTheDocument();
    expect(screen.getByText('Lista di a1')).toBeInTheDocument();
    expect(mockedArtists.getTourArtists).toHaveBeenCalledWith('t1');
  });

  it('mostra il contatore del tour solo dopo l\'apertura', async () => {
    renderOverview();
    expect(screen.queryByText('1 di 4 fatti')).not.toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: /Autumn Tour/ }));

    expect(await screen.findByText('1 di 4 fatti')).toBeInTheDocument();
  });

  it('non mostra il contatore finché le liste caricano', async () => {
    renderOverview({ ...emptyStats, loading: true });

    await userEvent.click(await screen.findByRole('button', { name: /Autumn Tour/ }));

    expect(await screen.findByText('Lista di a1')).toBeInTheDocument();
    expect(screen.queryByText(/fatti/)).not.toBeInTheDocument();
  });

  it('riaprendo un tour non rilegge gli artisti', async () => {
    renderOverview();
    const toggle = await screen.findByRole('button', { name: /Autumn Tour/ });

    await userEvent.click(toggle);
    expect(await screen.findByText('Davide Muti')).toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(mockedArtists.getTourArtists).toHaveBeenCalledTimes(1);
  });

  it('più tour possono restare aperti insieme', async () => {
    mockedArtists.getTourArtists.mockResolvedValue([]);
    renderOverview();

    await userEvent.click(await screen.findByRole('button', { name: /Autumn Tour/ }));
    await userEvent.click(screen.getByRole('button', { name: /Summer Tour/ }));

    expect(screen.getByRole('button', { name: /Autumn Tour/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Summer Tour/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('cerca per nome del tour', async () => {
    renderOverview();
    await screen.findByRole('button', { name: /Autumn Tour/ });

    await userEvent.type(screen.getByLabelText('Cerca tour o artista...'), 'summ');

    expect(screen.queryByRole('button', { name: /Autumn Tour/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Summer Tour/ })).toBeInTheDocument();
  });

  it('cerca per nome dell\'artista nei tour già aperti', async () => {
    renderOverview();
    await userEvent.click(await screen.findByRole('button', { name: /Autumn Tour/ }));
    await screen.findByText('Davide Muti');

    await userEvent.type(screen.getByLabelText('Cerca tour o artista...'), 'davide');

    expect(screen.getByRole('button', { name: /Autumn Tour/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Summer Tour/ })).not.toBeInTheDocument();
  });

  it('avvisa se il tour non ha artisti', async () => {
    mockedArtists.getTourArtists.mockResolvedValue([]);
    renderOverview();

    await userEvent.click(await screen.findByRole('button', { name: /Autumn Tour/ }));

    expect(await screen.findByText('Nessun artista in questo tour')).toBeInTheDocument();
  });

  it('avvisa se gli artisti non si caricano', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedArtists.getTourArtists.mockRejectedValue(new Error('offline'));
    renderOverview();

    await userEvent.click(await screen.findByRole('button', { name: /Autumn Tour/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Errore nel caricamento degli artisti');
  });

  it('senza tour propone di andare alla pagina Tour', async () => {
    mockedTours.getUserTours.mockResolvedValue([]);
    renderOverview();

    expect(await screen.findByText(/Non fai ancora parte di nessun tour/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vai ai Tour' })).toHaveAttribute('href', '/tours');
  });

  it('avvisa se i tour non si caricano', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedTours.getUserTours.mockRejectedValue(new Error('offline'));
    renderOverview();

    expect(await screen.findByRole('alert')).toHaveTextContent('Errore nel caricamento dei tour');
  });

  it('collega al dettaglio dell\'artista', async () => {
    renderOverview();
    await userEvent.click(await screen.findByRole('button', { name: /Autumn Tour/ }));

    const link = await screen.findByRole('link', { name: 'Apri Davide Muti' });
    expect(link).toHaveAttribute('href', '/tours/t1/artists/a1');
  });

  it('i tour chiusi restano montati: le liste non si smontano', async () => {
    renderOverview();
    const toggle = await screen.findByRole('button', { name: /Autumn Tour/ });

    await userEvent.click(toggle);
    await screen.findByText('Lista di a1');
    await userEvent.click(toggle);

    // Contenuto nascosto ma ancora nel DOM (nessuna rilettura alla riapertura)
    await waitFor(() => expect(screen.getByText('Lista di a1')).not.toBeVisible());
  });
});
