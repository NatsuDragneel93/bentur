import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import FirebaseService from './firebase.service';

export interface Tour {
  id: string;
  name: string;
  stagePlot?: string;
  channelList?: string;
  createdAt: Date;
  updatedAt: Date;
}

class ToursService {
  private collectionName = 'tours';
  private db = FirebaseService.database!;

  // Ottieni tutti i tour ordinati per nome
  async getAllTours(): Promise<Tour[]> {
    try {
      const toursRef = collection(this.db!, this.collectionName);
      const q = query(toursRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Tour[];
    } catch (error) {
      console.error('Error getting tours:', error);
      throw error;
    }
  }

  // Aggiungi un nuovo tour
  async addTour(name: string, stagePlot?: string, channelList?: string): Promise<string> {
    try {
      const now = new Date();
      const tourData = {
        name,
        stagePlot: stagePlot || '',
        channelList: channelList || '',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(this.db!, this.collectionName), tourData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding tour:', error);
      throw error;
    }
  }

  // Aggiorna un tour esistente
  async updateTour(tourId: string, updates: Partial<Omit<Tour, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const tourRef = doc(this.db!, this.collectionName, tourId);
      await updateDoc(tourRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating tour:', error);
      throw error;
    }
  }

  // Elimina un tour insieme ai suoi artisti, in un'unica operazione atomica
  async deleteTour(tourId: string): Promise<void> {
    try {
      const batch = writeBatch(this.db);
      const artistsSnapshot = await getDocs(
        query(collection(this.db, 'tour_artists'), where('tourId', '==', tourId))
      );
      artistsSnapshot.docs.forEach(artistDoc => batch.delete(artistDoc.ref));
      batch.delete(doc(this.db, this.collectionName, tourId));
      await batch.commit();
    } catch (error) {
      console.error('Error deleting tour:', error);
      throw error;
    }
  }

  // Ottieni un singolo tour per ID
  async getTourById(tourId: string): Promise<Tour | null> {
    try {
      const tourDoc = await getDoc(doc(this.db, this.collectionName, tourId));
      if (!tourDoc.exists()) return null;

      const data = tourDoc.data();
      return {
        id: tourDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Tour;
    } catch (error) {
      console.error('Error getting tour by ID:', error);
      throw error;
    }
  }
}

const toursService = new ToursService();
export default toursService;
