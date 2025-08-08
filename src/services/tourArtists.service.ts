import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import FirebaseService from './firebase.service';

export interface TourArtist {
  id: string;
  tourId: string;
  name: string;
  role: string; // batterista, chitarrista, cantante, etc.
  createdAt: Date;
  updatedAt: Date;
}

class TourArtistsService {
  private collectionName = 'tour_artists';
  private db = FirebaseService.database!;

  // Ottieni tutti gli artisti di un tour specifico
  async getTourArtists(tourId: string): Promise<TourArtist[]> {
    try {
      const artistsRef = collection(this.db, this.collectionName);
      const q = query(
        artistsRef, 
        where('tourId', '==', tourId)
      );
      const querySnapshot = await getDocs(q);
      
      const artists = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TourArtist[];

      // Ordina per nome lato client per evitare la necessità di indici composti
      return artists.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting tour artists:', error);
      throw error;
    }
  }

  // Aggiungi un nuovo artista a un tour
  async addTourArtist(tourId: string, name: string, role: string): Promise<string> {
    try {
      const now = new Date();
      const artistData = {
        tourId,
        name,
        role,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(this.db, this.collectionName), artistData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding tour artist:', error);
      throw error;
    }
  }

  // Aggiorna un artista esistente
  async updateTourArtist(artistId: string, updates: Partial<Omit<TourArtist, 'id' | 'tourId' | 'createdAt'>>): Promise<void> {
    try {
      const artistRef = doc(this.db, this.collectionName, artistId);
      await updateDoc(artistRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating tour artist:', error);
      throw error;
    }
  }

  // Elimina un artista
  async deleteTourArtist(artistId: string): Promise<void> {
    try {
      const artistRef = doc(this.db, this.collectionName, artistId);
      await deleteDoc(artistRef);
    } catch (error) {
      console.error('Error deleting tour artist:', error);
      throw error;
    }
  }

  // Elimina tutti gli artisti di un tour (quando si elimina un tour)
  async deleteTourArtists(tourId: string): Promise<void> {
    try {
      const artists = await this.getTourArtists(tourId);
      const deletePromises = artists.map(artist => this.deleteTourArtist(artist.id));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting tour artists:', error);
      throw error;
    }
  }

  // Ottieni un singolo artista per ID
  async getTourArtistById(artistId: string): Promise<TourArtist | null> {
    try {
      const artistsRef = collection(this.db, this.collectionName);
      const querySnapshot = await getDocs(artistsRef);
      const artist = querySnapshot.docs.find(doc => doc.id === artistId);
      
      if (!artist) return null;
      
      return {
        id: artist.id,
        ...artist.data(),
        createdAt: artist.data().createdAt?.toDate() || new Date(),
        updatedAt: artist.data().updatedAt?.toDate() || new Date(),
      } as TourArtist;
    } catch (error) {
      console.error('Error getting tour artist by ID:', error);
      throw error;
    }
  }
}

const tourArtistsService = new TourArtistsService();
export default tourArtistsService;
