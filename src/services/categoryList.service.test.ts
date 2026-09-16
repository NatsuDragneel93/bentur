import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as firestore from 'firebase/firestore';
import { ChecklistItem, createUserCategoryListService } from './categoryList.service';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name: string) => `collection:${name}`),
  doc: vi.fn((ref: string, id: string) => `${ref.replace('collection:', '')}/${id}`),
  query: vi.fn(() => 'query'),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  runTransaction: vi.fn(),
  Timestamp: { now: vi.fn(() => ({ toMillis: () => 1000 })) },
}));

const mocked = vi.mocked(firestore);

const item = (id: string, order: number, completed = false): ChecklistItem => ({ id, order, text: id, completed });

// Simula una transazione: il documento contiene gli elementi indicati nel campo 'tobuys'
const mockTransaction = (items: ChecklistItem[] | null) => {
  const transaction = {
    get: vi.fn().mockResolvedValue({
      id: 'cat-1',
      exists: () => items !== null,
      data: () => ({ userId: 'user-1', title: 'Cavi', tobuys: items }),
    }),
    update: vi.fn(),
  };
  mocked.runTransaction.mockImplementation(((_db: unknown, updateFunction: (t: unknown) => unknown) =>
    Promise.resolve(updateFunction(transaction))) as unknown as typeof firestore.runTransaction);
  return transaction;
};

describe('createUserCategoryListService', () => {
  const service = createUserCategoryListService<ChecklistItem>('user_to_buy', 'tobuys').forUser('user-1');

  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000');
  });

  it('getCategories legge solo le categorie dell\'utente, con elementi ordinati', async () => {
    mocked.getDocs.mockResolvedValue({
      docs: [
        { id: 'b', data: () => ({ userId: 'user-1', title: 'B', tobuys: [item('y', 1), item('x', 0)], createdAt: { toMillis: () => 2 } }) },
        { id: 'a', data: () => ({ userId: 'user-1', title: 'A', tobuys: undefined, createdAt: { toMillis: () => 1 } }) },
      ],
    } as unknown as firestore.QuerySnapshot);

    const categories = await service.getCategories();

    expect(mocked.where).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(categories.map(c => c.id)).toEqual(['a', 'b']);
    expect(categories[0].items).toEqual([]);
    expect(categories[1].items.map(i => i.id)).toEqual(['x', 'y']);
  });

  it('addCategory crea il documento dell\'utente con il campo elementi della collection', async () => {
    mocked.addDoc.mockResolvedValue({ id: 'new-cat' } as firestore.DocumentReference);

    const category = await service.addCategory('  Cavi  ');

    expect(mocked.addDoc).toHaveBeenCalledWith('collection:user_to_buy', expect.objectContaining({
      userId: 'user-1',
      title: 'Cavi',
      tobuys: [],
    }));
    expect(category).toMatchObject({ id: 'new-cat', title: 'Cavi', items: [] });
  });

  it('addItem aggiunge l\'elemento dentro una transazione', async () => {
    const transaction = mockTransaction([item('a', 0)]);

    const items = await service.addItem('cat-1', { text: 'XLR 10m', completed: false });

    expect(transaction.get).toHaveBeenCalledWith('user_to_buy/cat-1');
    expect(items).toEqual([
      item('a', 0),
      { id: '00000000-0000-4000-8000-000000000000', order: 1, text: 'XLR 10m', completed: false },
    ]);
    expect(transaction.update).toHaveBeenCalledWith('user_to_buy/cat-1', expect.objectContaining({ tobuys: items }));
  });

  it('updateItem modifica l\'elemento sui dati letti nella transazione', async () => {
    const transaction = mockTransaction([item('a', 0), item('b', 1)]);

    const items = await service.updateItem('cat-1', 'b', { completed: true });

    expect(items[1].completed).toBe(true);
    expect(transaction.update).toHaveBeenCalledTimes(1);
  });

  it('updateAllItems modifica tutti gli elementi in un\'unica transazione', async () => {
    const transaction = mockTransaction([item('a', 0, true), item('b', 1, true)]);

    const items = await service.updateAllItems('cat-1', { completed: false });

    expect(items.map(i => i.completed)).toEqual([false, false]);
    expect(transaction.update).toHaveBeenCalledTimes(1);
  });

  it('moveItem riordina usando l\'ordine attuale sul server', async () => {
    mockTransaction([item('c', 2), item('a', 0), item('b', 1)]);

    const items = await service.moveItem('cat-1', 'c', 0);

    expect(items.map(i => [i.id, i.order])).toEqual([['c', 0], ['a', 1], ['b', 2]]);
  });

  it('deleteItem rimuove l\'elemento', async () => {
    mockTransaction([item('a', 0), item('b', 1)]);

    const items = await service.deleteItem('cat-1', 'a');

    expect(items).toEqual([item('b', 0)]);
  });

  it('non scrive nulla se la categoria non esiste più', async () => {
    const transaction = mockTransaction(null);

    await expect(service.addItem('cat-1', { text: 'x', completed: false })).rejects.toThrow('Categoria non trovata');
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it('non scrive nulla se l\'elemento è stato eliminato nel frattempo', async () => {
    const transaction = mockTransaction([item('a', 0)]);

    await expect(service.updateItem('cat-1', 'sparito', { completed: true })).rejects.toThrow('Elemento non trovato');
    expect(transaction.update).not.toHaveBeenCalled();
  });
});
