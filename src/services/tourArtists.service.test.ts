import { describe, expect, it, vi } from 'vitest';
import * as firestore from 'firebase/firestore';
import tourArtistsService from './tourArtists.service';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, ...segments: string[]) => `collection:${segments.join('/')}`),
  doc: vi.fn((_db, ...segments: string[]) => segments.join('/')),
  query: vi.fn(),
  where: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

const mocked = vi.mocked(firestore);

describe('tourArtistsService', () => {
  it('legge gli artisti dalla sottocollection del tour, ordinati per nome', async () => {
    mocked.getDocs.mockResolvedValue({
      docs: [
        { id: 'a2', data: () => ({ name: 'Zoe', role: 'Voce' }) },
        { id: 'a1', data: () => ({ name: 'Anna', role: 'Batteria' }) },
      ],
    } as unknown as firestore.QuerySnapshot);

    const artists = await tourArtistsService.getTourArtists('t1');

    expect(mocked.getDocs).toHaveBeenCalledWith('collection:tours/t1/artists');
    expect(artists.map(a => [a.name, a.tourId])).toEqual([['Anna', 't1'], ['Zoe', 't1']]);
  });

  it('aggiunge l\'artista nella sottocollection del tour', async () => {
    mocked.addDoc.mockResolvedValue({ id: 'a3' } as firestore.DocumentReference);

    await tourArtistsService.addTourArtist('t1', { name: 'Luca', role: 'Chitarra' });

    expect(mocked.addDoc).toHaveBeenCalledWith(
      'collection:tours/t1/artists',
      expect.objectContaining({ name: 'Luca', role: 'Chitarra' })
    );
  });

  it('modifica ed elimina usando il percorso del tour', async () => {
    await tourArtistsService.updateTourArtist('t1', 'a1', { name: 'Anna', role: 'Percussioni' });
    await tourArtistsService.deleteTourArtist('t1', 'a1');

    expect(mocked.updateDoc).toHaveBeenCalledWith('tours/t1/artists/a1', expect.objectContaining({ role: 'Percussioni' }));
    expect(mocked.deleteDoc).toHaveBeenCalledWith('tours/t1/artists/a1');
  });

  it('getTourArtistById restituisce null se l\'artista non esiste nel tour', async () => {
    mocked.getDoc.mockResolvedValue({ exists: () => false } as unknown as firestore.DocumentSnapshot);

    expect(await tourArtistsService.getTourArtistById('t1', 'altro')).toBeNull();
    expect(mocked.getDoc).toHaveBeenCalledWith('tours/t1/artists/altro');
  });
});
