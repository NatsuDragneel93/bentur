import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import FirebaseService from './firebase.service';

// Percorsi Firestore dei tour. Gli artisti sono una sottocollection: tours/{tourId}/artists
// (usati anche da scripts/migrate-tours.mjs: tenerli allineati)
export const TOURS_COLLECTION = 'tours';
export const TOUR_ARTISTS_SUBCOLLECTION = 'artists';

export interface Tour {
  id: string;
  name: string;
  stagePlot?: string;
  channelList?: string;
  // Chi ha creato il tour: è l'unico che può modificarlo o eliminarlo
  ownerId: string;
  // Chi può vedere il tour (proprietario compreso); servirà per la condivisione con la crew
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type TourDetails = Pick<Tour, 'name' | 'stagePlot' | 'channelList'>;

const toTour = (id: string, data: Record<string, unknown>): Tour => ({
  ...(data as Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>),
  id,
  memberIds: (data.memberIds as string[] | undefined) ?? [],
  createdAt: (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(),
  updatedAt: (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(),
});

class ToursService {
  private db = FirebaseService.database;

  // Tour di cui l'utente è membro, ordinati per nome
  async getUserTours(userId: string): Promise<Tour[]> {
    try {
      const snapshot = await getDocs(
        query(collection(this.db, TOURS_COLLECTION), where('memberIds', 'array-contains', userId))
      );

      // Ordinamento lato client: orderBy insieme ad array-contains richiederebbe un indice composto
      return snapshot.docs
        .map(tourDoc => toTour(tourDoc.id, tourDoc.data()))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting tours:', error);
      throw error;
    }
  }

  // Crea un tour di proprietà dell'utente
  async addTour(userId: string, details: TourDetails): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(this.db, TOURS_COLLECTION), {
        name: details.name,
        stagePlot: details.stagePlot || '',
        channelList: details.channelList || '',
        ownerId: userId,
        memberIds: [userId],
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding tour:', error);
      throw error;
    }
  }

  // Aggiorna i dati del tour (proprietario e membri non si modificano da qui)
  async updateTour(tourId: string, details: TourDetails): Promise<void> {
    try {
      await updateDoc(doc(this.db, TOURS_COLLECTION, tourId), {
        name: details.name,
        stagePlot: details.stagePlot || '',
        channelList: details.channelList || '',
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
        collection(this.db, TOURS_COLLECTION, tourId, TOUR_ARTISTS_SUBCOLLECTION)
      );
      artistsSnapshot.docs.forEach(artistDoc => batch.delete(artistDoc.ref));
      batch.delete(doc(this.db, TOURS_COLLECTION, tourId));
      await batch.commit();
    } catch (error) {
      console.error('Error deleting tour:', error);
      throw error;
    }
  }

  // Ottieni un singolo tour per ID
  async getTourById(tourId: string): Promise<Tour | null> {
    try {
      const tourDoc = await getDoc(doc(this.db, TOURS_COLLECTION, tourId));
      return tourDoc.exists() ? toTour(tourDoc.id, tourDoc.data()) : null;
    } catch (error) {
      // Tour di cui l'utente non è membro: per lui è come se non esistesse
      if ((error as { code?: string }).code === 'permission-denied') return null;
      console.error('Error getting tour by ID:', error);
      throw error;
    }
  }
}

const toursService = new ToursService();
export default toursService;
