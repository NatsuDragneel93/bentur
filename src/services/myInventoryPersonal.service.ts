import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  Timestamp,
  getDoc
} from 'firebase/firestore';
import FirebaseService from './firebase.service';

export interface InventoryItem {
  id: string;
  name: string;
  number: number;
  order: number; // Per mantenere l'ordine
}

export interface InventoryCategory {
  id?: string;
  userId: string;
  title: string;
  data: InventoryItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class MyInventoryPersonalService {
  private db = FirebaseService.database!;
  private collectionName = 'user_inventory_personal'; // Collection specifica per l'inventario personale

  // Ottieni tutte le categorie di un utente
  async getUserCategories(userId: string): Promise<InventoryCategory[]> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InventoryCategory));

      // Ordina gli items all'interno di ogni categoria per mantenere l'ordine
      return categories.map(category => ({
        ...category,
        data: category.data.sort((a, b) => a.order - b.order)
      }));
    } catch (error) {
      console.error('Errore nel recupero delle categorie dell\'inventario:', error);
      throw error;
    }
  }

  // Aggiungi una nuova categoria
  async addCategory(userId: string, title: string): Promise<InventoryCategory> {
    try {
      const newCategory: Omit<InventoryCategory, 'id'> = {
        userId,
        title: title.trim(),
        data: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(this.db, this.collectionName), newCategory);
      
      return {
        id: docRef.id,
        ...newCategory
      } as InventoryCategory;
    } catch (error) {
      console.error('Errore nell\'aggiunta della categoria inventario:', error);
      throw error;
    }
  }

  // Aggiorna una categoria esistente
  async updateCategory(categoryId: string, title: string): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      await updateDoc(categoryRef, {
        title: title.trim(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento della categoria inventario:', error);
      throw error;
    }
  }

  // Elimina una categoria
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Errore nell\'eliminazione della categoria inventario:', error);
      throw error;
    }
  }

  // Aggiungi un item a una categoria
  async addItem(categoryId: string, name: string, number: number): Promise<InventoryItem> {
    try {
      // Prima ottieni la categoria corrente
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Categoria non trovata');
      }

      const categoryData = categoryDoc.data() as InventoryCategory;
      const newOrder = categoryData.data.length; // Metti il nuovo item alla fine

      const newItem: InventoryItem = {
        id: `item_${Date.now()}`, // ID temporaneo unico
        name: name.trim(),
        number,
        order: newOrder
      };

      const updatedItems = [...categoryData.data, newItem];

      await updateDoc(categoryRef, {
        data: updatedItems,
        updatedAt: Timestamp.now()
      });
      
      return newItem;
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'item:', error);
      throw error;
    }
  }

  // Aggiorna un item specifico
  async updateItem(categoryId: string, itemId: string, updates: Partial<Omit<InventoryItem, 'id' | 'order'>>): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Categoria non trovata');
      }

      const categoryData = categoryDoc.data() as InventoryCategory;
      const updatedItems = categoryData.data.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );

      await updateDoc(categoryRef, {
        data: updatedItems,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'item:', error);
      throw error;
    }
  }

  // Elimina un item specifico
  async deleteItem(categoryId: string, itemId: string): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Categoria non trovata');
      }

      const categoryData = categoryDoc.data() as InventoryCategory;
      const updatedItems = categoryData.data.filter(item => item.id !== itemId);

      await updateDoc(categoryRef, {
        data: updatedItems,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'item:', error);
      throw error;
    }
  }

  // Aggiorna l'ordine degli items dopo riordinamento
  async updateItemsOrder(categoryId: string, reorderedItems: InventoryItem[]): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      
      await updateDoc(categoryRef, {
        data: reorderedItems,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'ordine degli item:', error);
      throw error;
    }
  }
}

// Esporta un'istanza singleton del servizio
const myInventoryPersonalService = new MyInventoryPersonalService();
export default myInventoryPersonalService;
