import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
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

export interface ItemCategory<TItem extends ListItem> {
  id: string;
  userId: string;
  title: string;
  items: TItem[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CategoryListService<TItem extends ListItem> {
  getUserCategories(userId: string): Promise<ItemCategory<TItem>[]>;
  addCategory(userId: string, title: string): Promise<ItemCategory<TItem>>;
  renameCategory(categoryId: string, title: string): Promise<void>;
  deleteCategory(categoryId: string): Promise<void>;
  // Le operazioni sugli elementi restituiscono la lista aggiornata letta dal server
  addItem(categoryId: string, data: NewItem<TItem>): Promise<TItem[]>;
  updateItem(categoryId: string, itemId: string, updates: Partial<NewItem<TItem>>): Promise<TItem[]>;
  deleteItem(categoryId: string, itemId: string): Promise<TItem[]>;
  moveItem(categoryId: string, itemId: string, toIndex: number): Promise<TItem[]>;
}

/**
 * Servizio per collection di "categorie con elementi": ogni documento è una categoria
 * dell'utente e contiene gli elementi in un array (campo `itemsField`).
 *
 * Ogni modifica agli elementi avviene in una transazione: Firestore rilegge il documento e,
 * se nel frattempo è cambiato (es. modifica da un altro dispositivo), ripete l'operazione
 * sui dati aggiornati. Così nessuna modifica concorrente viene persa.
 */
export const createCategoryListService = <TItem extends ListItem>(
  collectionName: string,
  itemsField: string
): CategoryListService<TItem> => {
  const db = FirebaseService.database;

  const toCategory = (id: string, data: Record<string, unknown>): ItemCategory<TItem> => ({
    id,
    userId: data.userId as string,
    title: data.title as string,
    items: sortByOrder((data[itemsField] as TItem[] | undefined) ?? []),
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  });

  const mutateItems = (categoryId: string, mutate: (items: TItem[]) => TItem[]): Promise<TItem[]> =>
    runTransaction(db, async (transaction) => {
      const categoryRef = doc(db, collectionName, categoryId);
      const snapshot = await transaction.get(categoryRef);

      if (!snapshot.exists()) {
        throw new Error('Categoria non trovata');
      }

      const items = mutate(toCategory(snapshot.id, snapshot.data()).items);
      transaction.update(categoryRef, { [itemsField]: items, updatedAt: Timestamp.now() });
      return items;
    });

  return {
    async getUserCategories(userId) {
      const snapshot = await getDocs(query(collection(db, collectionName), where('userId', '==', userId)));

      return snapshot.docs
        .map(categoryDoc => toCategory(categoryDoc.id, categoryDoc.data()))
        // Ordine di creazione, così le categorie non cambiano posizione tra un caricamento e l'altro
        .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
    },

    async addCategory(userId, title) {
      const now = Timestamp.now();
      const data = { userId, title: title.trim(), [itemsField]: [], createdAt: now, updatedAt: now };
      const categoryRef = await addDoc(collection(db, collectionName), data);
      return toCategory(categoryRef.id, data);
    },

    async renameCategory(categoryId, title) {
      await updateDoc(doc(db, collectionName, categoryId), { title: title.trim(), updatedAt: Timestamp.now() });
    },

    async deleteCategory(categoryId) {
      await deleteDoc(doc(db, collectionName, categoryId));
    },

    addItem: (categoryId, data) =>
      mutateItems(categoryId, items => appendItem(items, data, generateItemId())),

    updateItem: (categoryId, itemId, updates) =>
      mutateItems(categoryId, items => updateItemById(items, itemId, updates)),

    deleteItem: (categoryId, itemId) =>
      mutateItems(categoryId, items => removeItemById(items, itemId)),

    moveItem: (categoryId, itemId, toIndex) =>
      mutateItems(categoryId, items => moveItemById(items, itemId, toIndex)),
  };
};
