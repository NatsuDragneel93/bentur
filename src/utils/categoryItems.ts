// Operazioni pure sugli elementi di una categoria (to-do, to-buy, inventario...).
// Non toccano Firestore: il servizio le applica dentro una transazione.

export interface ListItem {
  id: string;
  order: number;
}

export type NewItem<TItem extends ListItem> = Omit<TItem, 'id' | 'order'>;

export const sortByOrder = <TItem extends ListItem>(items: TItem[]): TItem[] =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

// Riassegna order = posizione, così resta sempre 0..n-1 senza buchi
export const normalizeOrder = <TItem extends ListItem>(items: TItem[]): TItem[] =>
  items.map((item, index) => (item.order === index ? item : { ...item, order: index }));

export const generateItemId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    // randomUUID esiste solo in contesti sicuri (https/localhost)
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const appendItem = <TItem extends ListItem>(items: TItem[], data: NewItem<TItem>, id: string): TItem[] => [
  ...normalizeOrder(items),
  { ...data, id, order: items.length } as TItem,
];

const indexOfItem = <TItem extends ListItem>(items: TItem[], itemId: string): number => {
  const index = items.findIndex(item => item.id === itemId);
  if (index === -1) {
    throw new Error('Elemento non trovato');
  }
  return index;
};

export const updateItemById = <TItem extends ListItem>(
  items: TItem[],
  itemId: string,
  updates: Partial<NewItem<TItem>>
): TItem[] => {
  indexOfItem(items, itemId);
  return items.map(item => (item.id === itemId ? { ...item, ...updates } : item));
};

// Applica la stessa modifica a tutti gli elementi (es. togliere tutte le spunte)
export const updateAllItems = <TItem extends ListItem>(items: TItem[], updates: Partial<NewItem<TItem>>): TItem[] =>
  items.map(item => ({ ...item, ...updates }));

export const removeItemById =<TItem extends ListItem>(items: TItem[], itemId: string): TItem[] => {
  indexOfItem(items, itemId);
  return normalizeOrder(items.filter(item => item.id !== itemId));
};

export const moveItemById = <TItem extends ListItem>(items: TItem[], itemId: string, toIndex: number): TItem[] => {
  const fromIndex = indexOfItem(items, itemId);
  const target = Math.max(0, Math.min(toIndex, items.length - 1));
  const result = [...items];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(target, 0, moved);
  return normalizeOrder(result);
};

export type CategoryProgress =
  | { status: 'empty' }
  | { status: 'open'; count: number }
  | { status: 'partial'; done: number; total: number }
  | { status: 'done' };

// Avanzamento a partire dai conteggi: nessuna spunta, alcune, tutte
export const progressOf = (done: number, total: number): CategoryProgress => {
  if (total === 0) return { status: 'empty' };
  if (done === 0) return { status: 'open', count: total };
  if (done === total) return { status: 'done' };
  return { status: 'partial', done, total };
};

// Avanzamento di una categoria con spunte
export const categoryProgress = <TItem extends ListItem>(
  items: TItem[],
  isCompleted: (item: TItem) => boolean
): CategoryProgress => progressOf(items.filter(isCompleted).length, items.length);
