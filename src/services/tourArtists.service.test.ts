import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as firestore from 'firebase/firestore';
import tourArtistsService from './tourArtists.service';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, ...segments: string[]) => `collection:${segments.join('/')}`),
  doc: vi.fn((_db, ...segments: string[]) => segments.join('/')),
  query: vi.fn(),
  where: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  getCountFromServer: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

const mocked = vi.mocked(firestore);

describe('tourArtistsService', () => {
  const batch = { delete: vi.fn(), commit: vi.fn() };

  beforeEach(() => {
    mocked.writeBatch.mockReturnValue(batch as unknown as firestore.WriteBatch);
  });

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

  it('conta gli artisti del tour senza leggerne i documenti', async () => {
    mocked.getCountFromServer.mockResolvedValue(
      { data: () => ({ count: 3 }) } as unknown as Awaited<ReturnType<typeof firestore.getCountFromServer>>
    );

    expect(await tourArtistsService.countTourArtists('t1')).toBe(3);
    expect(mocked.getCountFromServer).toHaveBeenCalledWith('collection:tours/t1/artists');
    expect(mocked.getDocs).not.toHaveBeenCalled();
  });

  it('aggiunge l\'artista nella sottocollection del tour', async () => {
    mocked.addDoc.mockResolvedValue({ id: 'a3' } as firestore.DocumentReference);

    await tourArtistsService.addTourArtist('t1', { name: 'Luca', role: 'Chitarra' });

    expect(mocked.addDoc).toHaveBeenCalledWith(
      'collection:tours/t1/artists',
      expect.objectContaining({ name: 'Luca', role: 'Chitarra' })
    );
  });

  it('modifica usando il percorso del tour', async () => {
    await tourArtistsService.updateTourArtist('t1', 'a1', { name: 'Anna', role: 'Percussioni' });

    expect(mocked.updateDoc).toHaveBeenCalledWith('tours/t1/artists/a1', expect.objectContaining({ role: 'Percussioni' }));
  });

  it('elimina l\'artista insieme alle categorie delle sue liste', async () => {
    mocked.getDocs.mockImplementation((async (path: string) => ({
      docs: path === 'collection:tours/t1/artists/a1/todos' ? [{ ref: 'tours/t1/artists/a1/todos/c1' }] : [],
    })) as unknown as typeof firestore.getDocs);

    await tourArtistsService.deleteTourArtist('t1', 'a1');

    expect(mocked.getDocs).toHaveBeenCalledWith('collection:tours/t1/artists/a1/spare');
    expect(mocked.getDocs).toHaveBeenCalledWith('collection:tours/t1/artists/a1/consumables');
    expect(batch.delete.mock.calls.map(call => call[0])).toEqual(['tours/t1/artists/a1/todos/c1', 'tours/t1/artists/a1']);
  });

  it('elimina anche i Setup dell\'artista', async () => {
    mocked.getDocs.mockImplementation((async (path: string) => ({
      docs: path === 'collection:tours/t1/artists/a1/setups' ? [{ ref: 'tours/t1/artists/a1/setups/setupA' }] : [],
    })) as unknown as typeof firestore.getDocs);

    await tourArtistsService.deleteTourArtist('t1', 'a1');

    expect(batch.delete.mock.calls.map(call => call[0])).toEqual(['tours/t1/artists/a1/setups/setupA', 'tours/t1/artists/a1']);
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });

  it('getTourArtistById restituisce null se l\'artista non esiste nel tour', async () => {
    mocked.getDoc.mockResolvedValue({ exists: () => false } as unknown as firestore.DocumentSnapshot);

    expect(await tourArtistsService.getTourArtistById('t1', 'altro')).toBeNull();
    expect(mocked.getDoc).toHaveBeenCalledWith('tours/t1/artists/altro');
  });
});
