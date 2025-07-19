import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import FirebaseService from './firebase.service';

export interface Manual {
  id?: string;
  userId: string;
  title: string;
  link: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class ManualsService {
  private db = FirebaseService.database!;
  private collectionName = 'manuals';

  async getUserManuals(userId: string): Promise<Manual[]> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Manual));
    } catch (error) {
      console.error('Errore nel recupero dei manuali:', error);
      throw error;
    }
  }

  async addManual(userId: string, manualData: Omit<Manual, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Aggiungi protocollo se mancante
      const processedLink = manualData.link.startsWith('http://') || manualData.link.startsWith('https://')
        ? manualData.link
        : `https://${manualData.link}`;

      const manual: Omit<Manual, 'id'> = {
        ...manualData,
        link: processedLink,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(this.db, this.collectionName), manual);
      return docRef.id;
    } catch (error) {
      console.error('Errore nell\'aggiunta del manuale:', error);
      throw error;
    }
  }

  async updateManual(manualId: string, manualData: Omit<Manual, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      // Aggiungi protocollo se mancante
      const processedLink = manualData.link.startsWith('http://') || manualData.link.startsWith('https://')
        ? manualData.link
        : `https://${manualData.link}`;

      const manualRef = doc(this.db, this.collectionName, manualId);
      await updateDoc(manualRef, {
        ...manualData,
        link: processedLink,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento del manuale:', error);
      throw error;
    }
  }

  async deleteManual(manualId: string): Promise<void> {
    try {
      const manualRef = doc(this.db, this.collectionName, manualId);
      await deleteDoc(manualRef);
    } catch (error) {
      console.error('Errore nell\'eliminazione del manuale:', error);
      throw error;
    }
  }
}

const manualsService = new ManualsService();
export default manualsService;
