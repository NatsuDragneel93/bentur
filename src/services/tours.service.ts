import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  DocumentReference
} from 'firebase/firestore';
import FirebaseService from './firebase.service';
import { deleteInBatches } from './batchDelete';

// Percorsi Firestore dei tour. Gli artisti sono una sottocollection: tours/{tourId}/artists
// (usati anche da scripts/migrate-tours.mjs: tenerli allineati)
export const TOURS_COLLECTION = 'tours';
export const TOUR_ARTISTS_SUBCOLLECTION = 'artists';

// Liste di ogni artista: tours/{tourId}/artists/{artistId}/{sottocollection}
// (i nomi sono elencati anche in firestore.rules)
export const ARTIST_LIST_SUBCOLLECTIONS = {
  spare: 'spare',
  toDo: 'todos',
  consumables: 'consumables',
  checkBeforeShow: 'showtime_checks',
} as const;

export type ArtistListKey = keyof typeof ARTIST_LIST_SUBCOLLECTIONS;

// Setup A/B di ogni artista: tours/{tourId}/artists/{artistId}/setups/{setupA|setupB}
// (nomi elencati anche in firestore.rules)
export const ARTIST_SETUPS_SUBCOLLECTION = 'setups';
export const SETUP_KEYS = ['a', 'b'] as const;
export type SetupKey = (typeof SETUP_KEYS)[number];
export const SETUP_DOC_IDS: Record<SetupKey, string> = { a: 'setupA', b: 'setupB' };

/**
 * Documenti da eliminare insieme a un artista: prima liste e setup, poi l'artista.
 * Firestore non elimina da solo le sottocollection.
 */
export const artistDocumentsToDelete = async (tourId: string, artistId: string): Promise<DocumentReference[]> => {
  const db = FirebaseService.database;
  const subcollections = [...Object.values(ARTIST_LIST_SUBCOLLECTIONS), ARTIST_SETUPS_SUBCOLLECTION];
  const lists = await Promise.all(
    subcollections.map(subcollection =>
      getDocs(collection(db, TOURS_COLLECTION, tourId, TOUR_ARTISTS_SUBCOLLECTION, artistId, subcollection))
    )
  );

  return [
    ...lists.flatMap(snapshot => snapshot.docs.map(childDoc => childDoc.ref)),
    doc(db, TOURS_COLLECTION, tourId, TOUR_ARTISTS_SUBCOLLECTION, artistId),
  ];
};

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

  // Elimina un tour insieme ai suoi artisti e alle loro liste (il tour per ultimo: le regole dei figli lo leggono)
  async deleteTour(tourId: string): Promise<void> {
    try {
      const artistsSnapshot = await getDocs(
        collection(this.db, TOURS_COLLECTION, tourId, TOUR_ARTISTS_SUBCOLLECTION)
      );
      const artistsDocuments = await Promise.all(
        artistsSnapshot.docs.map(artistDoc => artistDocumentsToDelete(tourId, artistDoc.id))
      );
      await deleteInBatches([...artistsDocuments.flat(), doc(this.db, TOURS_COLLECTION, tourId)]);
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
