import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as firestore from 'firebase/firestore';
import toursService from './tours.service';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name: string) => `collection:${name}`),
  doc: vi.fn((_db, name: string, id: string) => `${name}/${id}`),
  query: vi.fn(() => 'query'),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

const mocked = vi.mocked(firestore);

describe('toursService', () => {
  const batch = { delete: vi.fn(), commit: vi.fn() };

  beforeEach(() => {
    mocked.writeBatch.mockReturnValue(batch as unknown as firestore.WriteBatch);
  });

  // Regressione: eliminando un tour gli artisti restavano orfani
  it('deleteTour elimina il tour e tutti i suoi artisti in un unico batch', async () => {
    mocked.getDocs.mockResolvedValue({
      docs: [{ ref: 'tour_artists/a1' }, { ref: 'tour_artists/a2' }],
    } as unknown as firestore.QuerySnapshot);

    await toursService.deleteTour('t1');

    expect(mocked.where).toHaveBeenCalledWith('tourId', '==', 't1');
    expect(batch.delete).toHaveBeenCalledWith('tour_artists/a1');
    expect(batch.delete).toHaveBeenCalledWith('tour_artists/a2');
    expect(batch.delete).toHaveBeenCalledWith('tours/t1');
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });

  it('getTourById restituisce null se il tour non esiste', async () => {
    mocked.getDoc.mockResolvedValue({ exists: () => false } as unknown as firestore.DocumentSnapshot);

    expect(await toursService.getTourById('inesistente')).toBeNull();
  });

  it('getTourById converte i timestamp in Date', async () => {
    const createdAt = new Date('2025-08-01');
    mocked.getDoc.mockResolvedValue({
      id: 't1',
      exists: () => true,
      data: () => ({ name: 'Tour estivo', createdAt: { toDate: () => createdAt } }),
    } as unknown as firestore.DocumentSnapshot);

    const tour = await toursService.getTourById('t1');

    expect(tour).toMatchObject({ id: 't1', name: 'Tour estivo', createdAt });
    expect(tour?.updatedAt).toBeInstanceOf(Date);
  });
});
