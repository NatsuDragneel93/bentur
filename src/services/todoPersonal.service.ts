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

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  order: number; // Per mantenere l'ordine del drag & drop
}

export interface Category {
  id?: string;
  userId: string;
  title: string;
  todos: Todo[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class TodoPersonalService {
  private db = FirebaseService.database!;
  private collectionName = 'user_todos_personal'; // Collection specifica per i ToDo Personal

  // Ottieni tutte le categorie di un utente
  async getUserCategories(userId: string): Promise<Category[]> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));

      // Ordina i todos all'interno di ogni categoria per mantenere l'ordine
      return categories.map(category => ({
        ...category,
        todos: category.todos.sort((a, b) => a.order - b.order)
      }));
    } catch (error) {
      console.error('Errore nel recupero delle categorie personal:', error);
      throw error;
    }
  }

  // Aggiungi una nuova categoria
  async addCategory(userId: string, title: string): Promise<void> {
    try {
      const newCategory: Omit<Category, 'id'> = {
        userId,
        title: title.trim(),
        todos: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(this.db, this.collectionName), newCategory);
    } catch (error) {
      console.error('Errore nell\'aggiunta della categoria personal:', error);
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
      console.error('Errore nell\'aggiornamento della categoria personal:', error);
      throw error;
    }
  }

  // Elimina una categoria
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Errore nell\'eliminazione della categoria personal:', error);
      throw error;
    }
  }

  // Aggiungi un todo a una categoria
  async addTodo(categoryId: string, text: string): Promise<void> {
    try {
      // Prima ottieni la categoria corrente
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Categoria non trovata');
      }

      const categoryData = categoryDoc.data() as Category;
      const newOrder = categoryData.todos.length; // Metti il nuovo todo alla fine

      const newTodo: Todo = {
        id: `todo_${Date.now()}`, // ID temporaneo unico
        text: text.trim(),
        completed: false,
        order: newOrder
      };

      const updatedTodos = [...categoryData.todos, newTodo];

      await updateDoc(categoryRef, {
        todos: updatedTodos,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiunta del todo personal:', error);
      throw error;
    }
  }

  // Aggiorna un todo specifico
  async updateTodo(categoryId: string, todoId: string, updates: Partial<Omit<Todo, 'id' | 'order'>>): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Categoria non trovata');
      }

      const categoryData = categoryDoc.data() as Category;
      const updatedTodos = categoryData.todos.map(todo =>
        todo.id === todoId ? { ...todo, ...updates } : todo
      );

      await updateDoc(categoryRef, {
        todos: updatedTodos,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento del todo personal:', error);
      throw error;
    }
  }

  // Elimina un todo da una categoria
  async deleteTodo(categoryId: string, todoId: string): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Categoria non trovata');
      }

      const categoryData = categoryDoc.data() as Category;
      const updatedTodos = categoryData.todos
        .filter(todo => todo.id !== todoId)
        .map((todo, index) => ({ ...todo, order: index })); // Riordina gli indici

      await updateDoc(categoryRef, {
        todos: updatedTodos,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'eliminazione del todo personal:', error);
      throw error;
    }
  }

  // Aggiorna l'ordine dei todos dopo drag & drop
  async updateTodoOrder(categoryId: string, todos: Todo[]): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      
      // Riordina i todos con i nuovi indici
      const reorderedTodos = todos.map((todo, index) => ({
        ...todo,
        order: index
      }));

      await updateDoc(categoryRef, {
        todos: reorderedTodos,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'ordine dei todos personal:', error);
      throw error;
    }
  }
}

// Esportiamo un'istanza singleton del servizio
const todoPersonalService = new TodoPersonalService();
export default todoPersonalService;
