import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
import FirebaseService from './firebase.service';
import { deleteInBatches } from './batchDelete';
import { artistDocumentsToDelete, TOUR_ARTISTS_SUBCOLLECTION, TOURS_COLLECTION } from './tours.service';

export interface TourArtist {
  id: string;
  tourId: string;
  name: string;
  role: string; // batterista, chitarrista, cantante, etc.
  createdAt: Date;
  updatedAt: Date;
}

export type ArtistDetails = Pick<TourArtist, 'name' | 'role'>;

const toArtist = (tourId: string, id: string, data: Record<string, unknown>): TourArtist => ({
  ...(data as ArtistDetails),
  id,
  tourId,
  createdAt: (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(),
  updatedAt: (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(),
});

// Artisti di un tour: sottocollection tours/{tourId}/artists
class TourArtistsService {
  private db = FirebaseService.database;

  private artistsCollection(tourId: string) {
    return collection(this.db, TOURS_COLLECTION, tourId, TOUR_ARTISTS_SUBCOLLECTION);
  }

  private artistDoc(tourId: string, artistId: string) {
    return doc(this.db, TOURS_COLLECTION, tourId, TOUR_ARTISTS_SUBCOLLECTION, artistId);
  }

  // Artisti del tour ordinati per nome
  async getTourArtists(tourId: string): Promise<TourArtist[]> {
    try {
      const snapshot = await getDocs(this.artistsCollection(tourId));
      return snapshot.docs
        .map(artistDoc => toArtist(tourId, artistDoc.id, artistDoc.data()))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting tour artists:', error);
      throw error;
    }
  }

  async addTourArtist(tourId: string, details: ArtistDetails): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(this.artistsCollection(tourId), {
        name: details.name,
        role: details.role,
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding tour artist:', error);
      throw error;
    }
  }

  async updateTourArtist(tourId: string, artistId: string, details: ArtistDetails): Promise<void> {
    try {
      await updateDoc(this.artistDoc(tourId, artistId), {
        name: details.name,
        role: details.role,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating tour artist:', error);
      throw error;
    }
  }

  // Elimina l'artista insieme alle sue liste (Spare, To Do, Consumabili, To Check Before Showtime) e ai Setup
  async deleteTourArtist(tourId: string, artistId: string): Promise<void> {
    try {
      await deleteInBatches(await artistDocumentsToDelete(tourId, artistId));
    } catch (error) {
      console.error('Error deleting tour artist:', error);
      throw error;
    }
  }

  async getTourArtistById(tourId: string, artistId: string): Promise<TourArtist | null> {
    try {
      const artistDoc = await getDoc(this.artistDoc(tourId, artistId));
      return artistDoc.exists() ? toArtist(tourId, artistDoc.id, artistDoc.data()) : null;
    } catch (error) {
      console.error('Error getting tour artist by ID:', error);
      throw error;
    }
  }
}

const tourArtistsService = new TourArtistsService();
export default tourArtistsService;
