import { describe, expect, it, vi } from 'vitest';
import * as firestore from 'firebase/firestore';
import {
  artistCheckBeforeShowService,
  artistConsumablesService,
  artistSpareService,
  artistToDoService,
} from './artistLists.service';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, ...segments: string[]) => `collection:${segments.join('/')}`),
  doc: vi.fn(),
  query: vi.fn((ref: string, ...constraints: unknown[]) => ({ ref, constraints })),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  runTransaction: vi.fn(),
  Timestamp: { now: vi.fn(() => ({ toMillis: () => 1000 })) },
}));

const mocked = vi.mocked(firestore);

describe('servizi delle liste artista', () => {
  it.each([
    ['Spare', artistSpareService, 'spare'],
    ['To Do', artistToDoService, 'todos'],
    ['Consumabili', artistConsumablesService, 'consumables'],
    ['To Check Before Showtime', artistCheckBeforeShowService, 'showtime_checks'],
  ])('%s usa la sottocollection dell\'artista', (_name, service, subcollection) => {
    service.forArtist('t1', 'a1');

    expect(mocked.collection).toHaveBeenCalledWith({}, 'tours', 't1', 'artists', 'a1', subcollection);
  });

  it('legge tutte le categorie dell\'artista, senza filtro per utente', async () => {
    mocked.getDocs.mockResolvedValue({ docs: [] } as unknown as firestore.QuerySnapshot);

    await artistSpareService.forArtist('t1', 'a1').getCategories();

    expect(mocked.query).toHaveBeenCalledWith('collection:tours/t1/artists/a1/spare');
    expect(mocked.where).not.toHaveBeenCalled();
  });

  it('crea le categorie senza userId, con gli elementi nel campo items', async () => {
    mocked.addDoc.mockResolvedValue({ id: 'cat-1' } as firestore.DocumentReference);

    await artistConsumablesService.forArtist('t1', 'a1').addCategory('Borsa');

    const data = mocked.addDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(data).toMatchObject({ title: 'Borsa', items: [] });
    expect(data).not.toHaveProperty('userId');
  });
});
