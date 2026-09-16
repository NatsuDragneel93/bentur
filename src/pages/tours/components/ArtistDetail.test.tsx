import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArtistDetail from './ArtistDetail';
import { renderWithAuth } from '../../../test/renderWithAuth';
import tourArtistsService from '../../../services/tourArtists.service';

vi.mock('../../../services/tourArtists.service', () => ({
  default: { getTourArtistById: vi.fn() },
}));

const renderDetail = () =>
  renderWithAuth(<ArtistDetail tourId="t1" artistId="a1" onBack={vi.fn()} />, {
    route: '/tours/t1/artists/a1',
    extraRoutes: { '/tours/t1/artists/a1/lists/:listPath': <div>Lista aperta</div> },
  });

describe('ArtistDetail', () => {
  beforeEach(() => {
    vi.mocked(tourArtistsService).getTourArtistById.mockResolvedValue({
      id: 'a1', tourId: 't1', name: 'Anna', role: 'Voce', createdAt: new Date(), updatedAt: new Date(),
    });
  });

  it('la card To Check Before Showtime apre la lista dell\'artista', async () => {
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: /To Check Before Showtime/ }));

    expect(await screen.findByText('Lista aperta')).toBeInTheDocument();
  });

  it('le card Setup non ancora implementate mostrano un avviso', async () => {
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: /Setup A/ }));

    expect(await screen.findByText('Sezione in arrivo')).toBeInTheDocument();
    expect(screen.queryByText('Lista aperta')).not.toBeInTheDocument();
  });
});
