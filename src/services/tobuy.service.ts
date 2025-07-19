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

export interface ToBuy {
  id: string;
  text: string;
  completed: boolean;
  order: number; // Per mantenere l'ordine del drag & drop
}

export interface ToBuyCategory {
  id?: string;
  userId: string;
  title: string;
  tobuys: ToBuy[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class ToBuyService {
  private db = FirebaseService.database!;
  private collectionName = 'user_to_buy'; // Collection specifica per i ToBuy

  // Ottieni tutte le categorie di un utente
  async getUserCategories(userId: string): Promise<ToBuyCategory[]> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ToBuyCategory));

      // Ordina i tobuys all'interno di ogni categoria per mantenere l'ordine
      return categories.map(category => ({
        ...category,
        tobuys: category.tobuys.sort((a, b) => a.order - b.order)
      }));
    } catch (error) {
      console.error('Errore nel recupero delle categorie ToBuy:', error);
      throw error;
    }
  }

  // Aggiungi una nuova categoria
  async addCategory(userId: string, title: string): Promise<void> {
    try {
      const newCategory: Omit<ToBuyCategory, 'id'> = {
        userId,
        title: title.trim(),
        tobuys: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(this.db, this.collectionName), newCategory);
    } catch (error) {
      console.error('Errore nell\'aggiunta della categoria ToBuy:', error);
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
      console.error('Errore nell\'aggiornamento della categoria ToBuy:', error);
      throw error;
    }
  }

  // Elimina una categoria
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Errore nell\'eliminazione della categoria ToBuy:', error);
      throw error;
    }
  }

  // Aggiungi un tobuy a una categoria
  async addToBuy(categoryId: string, tobuyText: string, completed: boolean = false): Promise<void> {
    try {
      // Prima ottieni la categoria corrente
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Categoria non trovata');
      }

      const categoryData = categoryDoc.data() as ToBuyCategory;
      const newOrder = categoryData.tobuys.length; // Metti il nuovo tobuy alla fine

      const newToBuy: ToBuy = {
        id: `tobuy_${Date.now()}`, // ID temporaneo unico
        text: tobuyText.trim(),
        completed,
        order: newOrder
      };

      const updatedToBuys = [...categoryData.tobuys, newToBuy];

      await updateDoc(categoryRef, {
        tobuys: updatedToBuys,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiunta del ToBuy:', error);
      throw error;
    }
  }

  // Aggiorna un tobuy specifico
  async updateToBuy(categoryId: string, tobuyId: string, updates: Partial<Omit<ToBuy, 'id' | 'order'>>): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Categoria non trovata');
      }

      const categoryData = categoryDoc.data() as ToBuyCategory;
      const updatedToBuys = categoryData.tobuys.map(tobuy =>
        tobuy.id === tobuyId ? { ...tobuy, ...updates } : tobuy
      );

      await updateDoc(categoryRef, {
        tobuys: updatedToBuys,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento del ToBuy:', error);
      throw error;
    }
  }

  // Elimina un tobuy specifico
  async deleteToBuy(categoryId: string, tobuyId: string): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Categoria non trovata');
      }

      const categoryData = categoryDoc.data() as ToBuyCategory;
      const updatedToBuys = categoryData.tobuys.filter(tobuy => tobuy.id !== tobuyId);

      await updateDoc(categoryRef, {
        tobuys: updatedToBuys,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'eliminazione del ToBuy:', error);
      throw error;
    }
  }

  // Aggiorna l'ordine dei tobuys dopo drag & drop
  async updateToBuysOrder(categoryId: string, reorderedToBuys: ToBuy[]): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      
      await updateDoc(categoryRef, {
        tobuys: reorderedToBuys,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'ordine dei ToBuy:', error);
      throw error;
    }
  }
}

// Esporta un'istanza singleton del servizio
const toBuyService = new ToBuyService();
export default toBuyService;
