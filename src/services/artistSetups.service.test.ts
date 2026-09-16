import { describe, expect, it, vi } from 'vitest';
import * as firestore from 'firebase/firestore';
import artistSetupsService from './artistSetups.service';
import { createElement, MAX_STAGE_ELEMENTS } from '../utils/stagePlot';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, ...segments: string[]) => segments.join('/')),
  getDoc: vi.fn(),
  runTransaction: vi.fn(),
  Timestamp: { now: vi.fn(() => ({ toMillis: () => 5000 })) },
}));

const mocked = vi.mocked(firestore);

const timestamp = (millis: number) => ({ toMillis: () => millis }) as unknown as firestore.Timestamp;
const user = { uid: 'user-1', name: 'Mario Rossi' };
const drums = createElement('rect', 'e1', { x: 500, y: 300 }, 'Batteria');

// Simula una transazione in cui il documento contiene i dati indicati (null = non esiste)
const mockTransaction = (data: Record<string, unknown> | null) => {
  const transaction = {
    get: vi.fn().mockResolvedValue({ exists: () => data !== null, data: () => data }),
    set: vi.fn(),
  };
  mocked.runTransaction.mockImplementation(((_db: unknown, updateFunction: (t: unknown) => unknown) =>
    Promise.resolve(updateFunction(transaction))) as unknown as typeof firestore.runTransaction);
  return transaction;
};

describe('artistSetupsService', () => {
  it('getSetup legge il documento del setup sotto l\'artista', async () => {
    mocked.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ elements: [drums, { id: 'x', type: 'boh' }], updatedAt: timestamp(1000), updatedBy: 'user-2', updatedByName: 'Anna' }),
    } as unknown as firestore.DocumentSnapshot);

    const setup = await artistSetupsService.getSetup('t1', 'a1', 'b');

    expect(mocked.getDoc).toHaveBeenCalledWith('tours/t1/artists/a1/setups/setupB');
    expect(setup.elements).toEqual([drums]);
    expect(setup.updatedBy).toEqual({ uid: 'user-2', name: 'Anna' });
    expect(setup.updatedAt?.toMillis()).toBe(1000);
  });

  it('getSetup restituisce un setup vuoto se non è mai stato salvato', async () => {
    mocked.getDoc.mockResolvedValue({ exists: () => false } as unknown as firestore.DocumentSnapshot);

    expect(await artistSetupsService.getSetup('t1', 'a1', 'a')).toEqual({ elements: [], updatedAt: null, updatedBy: null });
  });

  it('salva il primo setup se nessuno l\'ha creato nel frattempo', async () => {
    const transaction = mockTransaction(null);

    const result = await artistSetupsService.saveSetup('t1', 'a1', 'a', [drums], { user, baseUpdatedAt: null });

    expect(result.status).toBe('saved');
    expect(transaction.get).toHaveBeenCalledWith('tours/t1/artists/a1/setups/setupA');
    expect(transaction.set).toHaveBeenCalledWith('tours/t1/artists/a1/setups/setupA', expect.objectContaining({
      elements: [drums],
      updatedBy: 'user-1',
      updatedByName: 'Mario Rossi',
    }));
  });

  it('salva se il setup non è cambiato da quando è stato caricato', async () => {
    const transaction = mockTransaction({ elements: [], updatedAt: timestamp(1000), updatedBy: 'user-1' });

    const result = await artistSetupsService.saveSetup('t1', 'a1', 'a', [drums], { user, baseUpdatedAt: timestamp(1000) });

    expect(result).toMatchObject({ status: 'saved', setup: { elements: [drums], updatedBy: user } });
    expect(transaction.set).toHaveBeenCalledTimes(1);
  });

  it('segnala il conflitto senza scrivere se un altro utente ha salvato nel frattempo', async () => {
    const transaction = mockTransaction({ elements: [drums], updatedAt: timestamp(2000), updatedBy: 'user-2', updatedByName: 'Anna' });

    const result = await artistSetupsService.saveSetup('t1', 'a1', 'a', [], { user, baseUpdatedAt: timestamp(1000) });

    expect(result).toMatchObject({ status: 'conflict', remote: { elements: [drums], updatedBy: { uid: 'user-2', name: 'Anna' } } });
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it('segnala il conflitto anche se il setup è stato creato da altri mentre era vuoto', async () => {
    const transaction = mockTransaction({ elements: [drums], updatedAt: timestamp(2000), updatedBy: 'user-2' });

    const result = await artistSetupsService.saveSetup('t1', 'a1', 'b', [], { user, baseUpdatedAt: null });

    expect(result.status).toBe('conflict');
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it('con force sovrascrive anche in caso di conflitto', async () => {
    const transaction = mockTransaction({ elements: [drums], updatedAt: timestamp(2000), updatedBy: 'user-2' });

    const result = await artistSetupsService.saveSetup('t1', 'a1', 'a', [], { user, baseUpdatedAt: timestamp(1000), force: true });

    expect(result.status).toBe('saved');
    expect(transaction.set).toHaveBeenCalledTimes(1);
  });

  it('rifiuta setup con troppe forme', async () => {
    const tooMany = Array.from({ length: MAX_STAGE_ELEMENTS + 1 }, (_, i) => createElement('circle', `e${i}`, { x: 0, y: 0 }));

    await expect(artistSetupsService.saveSetup('t1', 'a1', 'a', tooMany, { user, baseUpdatedAt: null })).rejects.toThrow();
    expect(mocked.runTransaction).not.toHaveBeenCalled();
  });
});
