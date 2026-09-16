import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  getDocs,
  query,
  QueryConstraint,
  runTransaction,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import FirebaseService from './firebase.service';
import {
  appendItem,
  generateItemId,
  ListItem,
  moveItemById,
  NewItem,
  removeItemById,
  sortByOrder,
  updateAllItems,
  updateItemById,
} from '../utils/categoryItems';

export type { ListItem, NewItem } from '../utils/categoryItems';

export interface ChecklistItem extends ListItem {
  text: string;
  completed: boolean;
}

export interface InventoryItem extends ListItem {
  name: string;
  number: number;
}

export interface ConsumableItem extends InventoryItem {
  // Assente nei dati salvati prima dell'introduzione del flag: vale come false
  toRestock?: boolean;
}

export interface ItemCategory<TItem extends ListItem> {
  id: string;
  title: string;
  items: TItem[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CategoryListService<TItem extends ListItem> {
  getCategories(): Promise<ItemCategory<TItem>[]>;
  addCategory(title: string): Promise<ItemCategory<TItem>>;
  renameCategory(categoryId: string, title: string): Promise<void>;
  deleteCategory(categoryId: string): Promise<void>;
  // Le operazioni sugli elementi restituiscono la lista aggiornata letta dal server
  addItem(categoryId: string, data: NewItem<TItem>): Promise<TItem[]>;
  updateItem(categoryId: string, itemId: string, updates: Partial<NewItem<TItem>>): Promise<TItem[]>;
  updateAllItems(categoryId: string, updates: Partial<NewItem<TItem>>): Promise<TItem[]>;
  deleteItem(categoryId: string, itemId: string): Promise<TItem[]>;
  moveItem(categoryId: string, itemId: string, toIndex: number): Promise<TItem[]>;
}

// Dove stanno le categorie di una lista
export interface CategoryScope {
  collectionRef: CollectionReference;
  // Filtri per leggere solo le categorie dell'ambito (es. quelle dell'utente)
  constraints?: QueryConstraint[];
  // Campi aggiunti a ogni nuova categoria (es. userId)
  extraData?: Record<string, unknown>;
}

/**
 * Servizio per collection di "categorie con elementi": ogni documento è una categoria
 * e contiene gli elementi in un array (campo `itemsField`).
 *
 * Ogni modifica agli elementi avviene in una transazione: Firestore rilegge il documento e,
 * se nel frattempo è cambiato (es. modifica da un altro dispositivo), ripete l'operazione
 * sui dati aggiornati. Così nessuna modifica concorrente viene persa.
 */
export const createCategoryListService = <TItem extends ListItem>(
  scope: CategoryScope,
  itemsField: string
): CategoryListService<TItem> => {
  const db = FirebaseService.database;
  const { collectionRef, constraints = [], extraData = {} } = scope;

  const toCategory = (id: string, data: Record<string, unknown>): ItemCategory<TItem> => ({
    id,
    title: data.title as string,
    items: sortByOrder((data[itemsField] as TItem[] | undefined) ?? []),
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  });

  const mutateItems = (categoryId: string, mutate: (items: TItem[]) => TItem[]): Promise<TItem[]> =>
    runTransaction(db, async (transaction) => {
      const categoryRef = doc(collectionRef, categoryId);
      const snapshot = await transaction.get(categoryRef);

      if (!snapshot.exists()) {
        throw new Error('Categoria non trovata');
      }

      const items = mutate(toCategory(snapshot.id, snapshot.data()).items);
      transaction.update(categoryRef, { [itemsField]: items, updatedAt: Timestamp.now() });
      return items;
    });

  return {
    async getCategories() {
      const snapshot = await getDocs(query(collectionRef, ...constraints));

      return snapshot.docs
        .map(categoryDoc => toCategory(categoryDoc.id, categoryDoc.data()))
        // Ordine di creazione, così le categorie non cambiano posizione tra un caricamento e l'altro
        .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
    },

    async addCategory(title) {
      const now = Timestamp.now();
      const data = { ...extraData, title: title.trim(), [itemsField]: [], createdAt: now, updatedAt: now };
      const categoryRef = await addDoc(collectionRef, data);
      return toCategory(categoryRef.id, data);
    },

    async renameCategory(categoryId, title) {
      await updateDoc(doc(collectionRef, categoryId), { title: title.trim(), updatedAt: Timestamp.now() });
    },

    async deleteCategory(categoryId) {
      await deleteDoc(doc(collectionRef, categoryId));
    },

    addItem: (categoryId, data) =>
      mutateItems(categoryId, items => appendItem(items, data, generateItemId())),

    updateItem: (categoryId, itemId, updates) =>
      mutateItems(categoryId, items => updateItemById(items, itemId, updates)),

    updateAllItems: (categoryId, updates) =>
      mutateItems(categoryId, items => updateAllItems(items, updates)),

    deleteItem: (categoryId, itemId) =>
      mutateItems(categoryId, items => removeItemById(items, itemId)),

    moveItem: (categoryId, itemId, toIndex) =>
      mutateItems(categoryId, items => moveItemById(items, itemId, toIndex)),
  };
};

/**
 * Liste personali: collection con un documento per categoria, di proprietà dell'utente (campo userId).
 * Il servizio si ottiene per un utente preciso con forUser(uid).
 */
export const createUserCategoryListService = <TItem extends ListItem>(collectionName: string, itemsField: string) => ({
  forUser: (userId: string): CategoryListService<TItem> =>
    createCategoryListService<TItem>(
      {
        collectionRef: collection(FirebaseService.database, collectionName),
        constraints: [where('userId', '==', userId)],
        extraData: { userId },
      },
      itemsField
    ),
});
