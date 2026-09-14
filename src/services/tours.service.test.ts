import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as firestore from 'firebase/firestore';
import toursService from './tours.service';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, ...segments: string[]) => `collection:${segments.join('/')}`),
  doc: vi.fn((_db, ...segments: string[]) => segments.join('/')),
  query: vi.fn(() => 'query'),
  where: vi.fn(),
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

  it('getUserTours legge solo i tour di cui l\'utente è membro, ordinati per nome', async () => {
    mocked.getDocs.mockResolvedValue({
      docs: [
        { id: 't2', data: () => ({ name: 'Tour invernale', ownerId: 'user-1', memberIds: ['user-1'] }) },
        { id: 't1', data: () => ({ name: 'Tour estivo', ownerId: 'user-1', memberIds: ['user-1'] }) },
      ],
    } as unknown as firestore.QuerySnapshot);

    const tours = await toursService.getUserTours('user-1');

    expect(mocked.where).toHaveBeenCalledWith('memberIds', 'array-contains', 'user-1');
    expect(tours.map(t => t.name)).toEqual(['Tour estivo', 'Tour invernale']);
  });

  it('addTour crea il tour con l\'utente come proprietario e unico membro', async () => {
    mocked.addDoc.mockResolvedValue({ id: 'new' } as firestore.DocumentReference);

    await toursService.addTour('user-1', { name: 'Tour estivo', stagePlot: 'https://plot', channelList: '' });

    expect(mocked.addDoc).toHaveBeenCalledWith('collection:tours', expect.objectContaining({
      name: 'Tour estivo',
      stagePlot: 'https://plot',
      channelList: '',
      ownerId: 'user-1',
      memberIds: ['user-1'],
    }));
  });

  it('updateTour non modifica proprietario e membri', async () => {
    await toursService.updateTour('t1', { name: 'Nuovo nome', stagePlot: '', channelList: '' });

    const updates = mocked.updateDoc.mock.calls[0][1] as unknown as Record<string, unknown>;
    expect(updates).toMatchObject({ name: 'Nuovo nome' });
    expect(updates).not.toHaveProperty('ownerId');
    expect(updates).not.toHaveProperty('memberIds');
  });

  // Regressione: eliminando un tour gli artisti restavano orfani
  it('deleteTour elimina il tour e tutti i suoi artisti in un unico batch', async () => {
    mocked.getDocs.mockResolvedValue({
      docs: [{ ref: 'tours/t1/artists/a1' }, { ref: 'tours/t1/artists/a2' }],
    } as unknown as firestore.QuerySnapshot);

    await toursService.deleteTour('t1');

    expect(mocked.getDocs).toHaveBeenCalledWith('collection:tours/t1/artists');
    expect(batch.delete).toHaveBeenCalledWith('tours/t1/artists/a1');
    expect(batch.delete).toHaveBeenCalledWith('tours/t1/artists/a2');
    expect(batch.delete).toHaveBeenCalledWith('tours/t1');
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });

  it('getTourById restituisce null se il tour non esiste', async () => {
    mocked.getDoc.mockResolvedValue({ exists: () => false } as unknown as firestore.DocumentSnapshot);

    expect(await toursService.getTourById('inesistente')).toBeNull();
  });

  it('getTourById restituisce null se l\'utente non è membro del tour', async () => {
    mocked.getDoc.mockRejectedValue(Object.assign(new Error('denied'), { code: 'permission-denied' }));

    expect(await toursService.getTourById('altrui')).toBeNull();
  });

  it('getTourById converte i timestamp in Date', async () => {
    const createdAt = new Date('2025-08-01');
    mocked.getDoc.mockResolvedValue({
      id: 't1',
      exists: () => true,
      data: () => ({ name: 'Tour estivo', ownerId: 'user-1', memberIds: ['user-1'], createdAt: { toDate: () => createdAt } }),
    } as unknown as firestore.DocumentSnapshot);

    const tour = await toursService.getTourById('t1');

    expect(tour).toMatchObject({ id: 't1', name: 'Tour estivo', ownerId: 'user-1', createdAt });
    expect(tour?.updatedAt).toBeInstanceOf(Date);
  });
});
