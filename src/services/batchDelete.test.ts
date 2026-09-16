import { describe, expect, it, vi } from 'vitest';
import * as firestore from 'firebase/firestore';
import { deleteInBatches, MAX_BATCH_OPERATIONS } from './batchDelete';

vi.mock('firebase/firestore', () => ({
  writeBatch: vi.fn(),
}));

const mocked = vi.mocked(firestore);

describe('deleteInBatches', () => {
  it('divide le eliminazioni in gruppi da 500 mantenendo l\'ordine', async () => {
    const batches: { delete: ReturnType<typeof vi.fn>; commit: ReturnType<typeof vi.fn> }[] = [];
    mocked.writeBatch.mockImplementation(() => {
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      batches.push(batch);
      return batch as unknown as firestore.WriteBatch;
    });
    const refs = Array.from({ length: MAX_BATCH_OPERATIONS + 2 }, (_, i) => `doc-${i}`) as unknown as firestore.DocumentReference[];

    await deleteInBatches(refs);

    expect(batches).toHaveLength(2);
    expect(batches[0].delete).toHaveBeenCalledTimes(MAX_BATCH_OPERATIONS);
    expect(batches[1].delete.mock.calls.map(call => call[0])).toEqual([`doc-${MAX_BATCH_OPERATIONS}`, `doc-${MAX_BATCH_OPERATIONS + 1}`]);
    expect(batches.every(batch => batch.commit.mock.calls.length === 1)).toBe(true);
  });

  it('non crea batch se non c\'è nulla da eliminare', async () => {
    await deleteInBatches([]);

    expect(mocked.writeBatch).not.toHaveBeenCalled();
  });
});
