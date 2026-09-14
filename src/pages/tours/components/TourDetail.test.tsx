import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import TourDetail from './TourDetail';
import toursService, { Tour } from '../../../services/tours.service';
import tourArtistsService from '../../../services/tourArtists.service';
import { renderWithAuth } from '../../../test/renderWithAuth';

vi.mock('../../../services/tours.service', () => ({
  default: { getTourById: vi.fn() },
}));

vi.mock('../../../services/tourArtists.service', () => ({
  default: {
    getTourArtists: vi.fn(),
    addTourArtist: vi.fn(),
    updateTourArtist: vi.fn(),
    deleteTourArtist: vi.fn(),
  },
}));

const tour = (ownerId: string): Tour => ({
  id: 't1',
  name: 'Tour estivo',
  ownerId,
  memberIds: [ownerId, 'user-1'],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const renderDetail = () => renderWithAuth(<TourDetail tourId="t1" onBack={vi.fn()} />);

describe('TourDetail', () => {
  it('il proprietario può aggiungere, modificare ed eliminare artisti', async () => {
    vi.mocked(toursService.getTourById).mockResolvedValue(tour('user-1'));
    vi.mocked(tourArtistsService.getTourArtists).mockResolvedValue([
      { id: 'a1', tourId: 't1', name: 'Anna', role: 'Batteria', createdAt: new Date(), updatedAt: new Date() },
    ]);
    renderDetail();

    expect(await screen.findByText('Anna')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifica Anna' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Elimina Anna' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aggiungi artista' })).toBeInTheDocument();
  });

  it('un membro che non è proprietario vede gli artisti ma non può modificarli', async () => {
    vi.mocked(toursService.getTourById).mockResolvedValue(tour('altro-utente'));
    vi.mocked(tourArtistsService.getTourArtists).mockResolvedValue([
      { id: 'a1', tourId: 't1', name: 'Anna', role: 'Batteria', createdAt: new Date(), updatedAt: new Date() },
    ]);
    renderDetail();

    expect(await screen.findByText('Anna')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifica Anna' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aggiungi artista' })).not.toBeInTheDocument();
  });

  it('mostra "Tour non trovato" senza leggere gli artisti se il tour non è accessibile', async () => {
    vi.mocked(toursService.getTourById).mockResolvedValue(null);
    renderDetail();

    expect(await screen.findByText('Tour non trovato')).toBeInTheDocument();
    expect(tourArtistsService.getTourArtists).not.toHaveBeenCalled();
  });
});
