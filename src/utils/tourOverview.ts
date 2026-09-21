// Conteggi delle liste degli artisti, aggregati per tour nelle pagine To Do - Tour e Inventario - Tour.
// Niente Firestore: le liste passano qui le categorie che hanno già caricato.

import type { ChecklistItem, ConsumableItem, InventoryItem, ItemCategory } from '../services/categoryList.service';

export interface ListStats {
  // Elementi totali della lista
  total: number;
  // Elementi spuntati (solo liste con spunta)
  done: number;
  // Elementi da ricomprare (solo consumabili)
  restock: number;
  // Vero finché la lista sta caricando: i conteggi non sono ancora definitivi
  loading: boolean;
}

export const emptyStats: ListStats = { total: 0, done: 0, restock: 0, loading: false };

const countItems = (categories: { items: unknown[] }[]): number =>
  categories.reduce((total, category) => total + category.items.length, 0);

// Liste con spunta (To Do): totale e fatti
export const checklistStats = (categories: ItemCategory<ChecklistItem>[]): ListStats => ({
  ...emptyStats,
  total: countItems(categories),
  done: categories.reduce((done, category) => done + category.items.filter(item => item.completed).length, 0),
});

// Liste di materiale (Spare): solo il totale
export const inventoryStats = (categories: ItemCategory<InventoryItem>[]): ListStats => ({
  ...emptyStats,
  total: countItems(categories),
});

// Consumabili: totale ed elementi segnati da ricomprare
export const consumableStats = (categories: ItemCategory<ConsumableItem>[]): ListStats => ({
  ...emptyStats,
  total: countItems(categories),
  restock: categories.reduce((restock, category) => restock + category.items.filter(item => item.toRestock).length, 0),
});

// Somma dei conteggi di più liste (tutte quelle degli artisti di un tour)
export const sumStats = (stats: ListStats[]): ListStats => stats.reduce((sum, current) => ({
  total: sum.total + current.total,
  done: sum.done + current.done,
  restock: sum.restock + current.restock,
  loading: sum.loading || current.loading,
}), emptyStats);

// Ricerca su nome del tour, nome e ruolo dell'artista: vuota = nessun filtro
export const matchesSearch = (term: string, ...values: (string | undefined)[]): boolean => {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return values.some(value => value?.toLowerCase().includes(needle));
};
