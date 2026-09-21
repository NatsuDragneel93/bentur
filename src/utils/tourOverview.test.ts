import { describe, expect, it } from 'vitest';
import {
  checklistStats,
  consumableStats,
  emptyStats,
  inventoryStats,
  matchesSearch,
  sumStats,
} from './tourOverview';
import type { ChecklistItem, ConsumableItem, InventoryItem, ItemCategory } from '../services/categoryList.service';

const todo = (id: string, completed: boolean): ChecklistItem => ({ id, order: 0, text: id, completed });

describe('tourOverview', () => {
  describe('checklistStats', () => {
    it('conta elementi e spunte di tutte le categorie', () => {
      const categories: ItemCategory<ChecklistItem>[] = [
        { id: 'c1', title: 'Cavi', items: [todo('t1', true), todo('t2', false)] },
        { id: 'c2', title: 'Palco', items: [todo('t3', true)] },
      ];

      expect(checklistStats(categories)).toEqual({ ...emptyStats, total: 3, done: 2 });
    });

    it('vale zero senza categorie', () => {
      expect(checklistStats([])).toEqual(emptyStats);
    });
  });

  it('inventoryStats conta solo gli elementi', () => {
    const categories: ItemCategory<InventoryItem>[] = [
      { id: 'i1', title: 'Microfoni', items: [{ id: 'm1', order: 0, name: 'SM58', number: 4 }] },
    ];

    expect(inventoryStats(categories)).toEqual({ ...emptyStats, total: 1 });
  });

  it('consumableStats conta gli elementi da ricomprare', () => {
    const categories: ItemCategory<ConsumableItem>[] = [
      {
        id: 'k1',
        title: 'Borsa',
        items: [
          { id: 'p1', order: 0, name: 'Pile AA', number: 8, toRestock: true },
          // Elementi salvati prima del flag: contano come disponibili
          { id: 'p2', order: 1, name: 'Nastro', number: 2 },
        ],
      },
    ];

    expect(consumableStats(categories)).toEqual({ ...emptyStats, total: 2, restock: 1 });
  });

  describe('sumStats', () => {
    it('somma i conteggi delle liste di un tour', () => {
      const sum = sumStats([
        { total: 2, done: 1, restock: 0, loading: false },
        { total: 3, done: 3, restock: 2, loading: false },
      ]);

      expect(sum).toEqual({ total: 5, done: 4, restock: 2, loading: false });
    });

    it('resta in caricamento se lo è anche una sola lista', () => {
      expect(sumStats([{ ...emptyStats }, { ...emptyStats, loading: true }]).loading).toBe(true);
    });

    it('senza liste vale zero', () => {
      expect(sumStats([])).toEqual(emptyStats);
    });
  });

  describe('matchesSearch', () => {
    it('senza testo passa tutto', () => {
      expect(matchesSearch('   ', 'Summer Tour')).toBe(true);
    });

    it('cerca in tutti i valori, ignorando maiuscole e spazi', () => {
      expect(matchesSearch(' bat ', 'Davide Muti', 'Batterista')).toBe(true);
      expect(matchesSearch('voce', 'Davide Muti', 'Batterista')).toBe(false);
    });

    it('ignora i valori mancanti', () => {
      expect(matchesSearch('x', undefined)).toBe(false);
    });
  });
});
