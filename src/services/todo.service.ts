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

class TodoService {
  private db = FirebaseService.database!;
  private collectionName = 'user_todos'; // Collection specifica per i ToDo

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
      console.error('Errore nel recupero delle categorie:', error);
      throw error;
    }
  }

  // Aggiungi una nuova categoria
  async addCategory(userId: string, title: string): Promise<string> {
    try {
      const category: Omit<Category, 'id'> = {
        userId,
        title: title.trim(),
        todos: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(this.db, this.collectionName), category);
      return docRef.id;
    } catch (error) {
      console.error('Errore nell\'aggiunta della categoria:', error);
      throw error;
    }
  }

  // Aggiorna una categoria (titolo)
  async updateCategory(categoryId: string, title: string): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      await updateDoc(categoryRef, {
        title: title.trim(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento della categoria:', error);
      throw error;
    }
  }

  // Elimina una categoria
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Errore nell\'eliminazione della categoria:', error);
      throw error;
    }
  }

  // Aggiungi un todo a una categoria
  async addTodo(categoryId: string, todoText: string, completed: boolean = false): Promise<void> {
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
        text: todoText.trim(),
        completed,
        order: newOrder
      };

      const updatedTodos = [...categoryData.todos, newTodo];

      await updateDoc(categoryRef, {
        todos: updatedTodos,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiunta del todo:', error);
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
      console.error('Errore nell\'aggiornamento del todo:', error);
      throw error;
    }
  }

  // Elimina un todo
  async deleteTodo(categoryId: string, todoId: string): Promise<void> {
    try {
      const categoryRef = doc(this.db, this.collectionName, categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Categoria non trovata');
      }

      const categoryData = categoryDoc.data() as Category;
      const updatedTodos = categoryData.todos.filter(todo => todo.id !== todoId);

      await updateDoc(categoryRef, {
        todos: updatedTodos,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'eliminazione del todo:', error);
      throw error;
    }
  }

  // Aggiorna l'ordine dei todos (per drag & drop)
  async updateTodosOrder(categoryId: string, reorderedTodos: Todo[]): Promise<void> {
    try {
      // Aggiorna gli indici order
      const todosWithNewOrder = reorderedTodos.map((todo, index) => ({
        ...todo,
        order: index
      }));

      const categoryRef = doc(this.db, this.collectionName, categoryId);
      await updateDoc(categoryRef, {
        todos: todosWithNewOrder,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'ordine:', error);
      throw error;
    }
  }
}

const todoService = new TodoService();
export default todoService;
