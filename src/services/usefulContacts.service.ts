import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import FirebaseService from './firebase.service';

export interface Contact {
  id?: string;
  userId: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  notes: string;
  city: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

class UsefulContactsService {
  private db = FirebaseService.database!;
  private collectionName = 'usefulContacts';

  // Ottieni tutti i contatti di un utente
  async getUserContacts(userId: string): Promise<Contact[]> {
    try {
      const contactsRef = collection(this.db, this.collectionName);
      const q = query(
        contactsRef, 
        where('userId', '==', userId)
        // Rimuoviamo temporaneamente orderBy per evitare errori di indice
        // orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const contacts: Contact[] = [];
      
      querySnapshot.forEach((doc) => {
        contacts.push({
          id: doc.id,
          ...doc.data()
        } as Contact);
      });
      
      // Ordiniamo lato client per ora
      return contacts.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return 0;
      });
    } catch (error) {
      console.error('Errore nel recupero dei contatti:', error);
      throw error;
    }
  }

  // Aggiungi un nuovo contatto
  async addContact(userId: string, contactData: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newContact: Omit<Contact, 'id'> = {
        userId,
        ...contactData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(this.db, this.collectionName), newContact);
      console.log('Contatto aggiunto con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Errore nell\'aggiunta del contatto:', error);
      throw error;
    }
  }

  // Aggiorna un contatto esistente
  async updateContact(contactId: string, contactData: Partial<Omit<Contact, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    try {
      const contactRef = doc(this.db, this.collectionName, contactId);
      const updateData = {
        ...contactData,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(contactRef, updateData);
      console.log('Contatto aggiornato con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento del contatto:', error);
      throw error;
    }
  }

  // Elimina un contatto
  async deleteContact(contactId: string): Promise<void> {
    try {
      const contactRef = doc(this.db, this.collectionName, contactId);
      await deleteDoc(contactRef);
      console.log('Contatto eliminato con successo');
    } catch (error) {
      console.error('Errore nell\'eliminazione del contatto:', error);
      throw error;
    }
  }
}

const usefulContactsService = new UsefulContactsService();
export default usefulContactsService;
