import { doc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
import FirebaseService from './firebase.service';
import {
  ARTIST_SETUPS_SUBCOLLECTION,
  SETUP_DOC_IDS,
  SetupKey,
  TOUR_ARTISTS_SUBCOLLECTION,
  TOURS_COLLECTION,
} from './tours.service';
import { MAX_STAGE_ELEMENTS, normalizeElements, StageElement } from '../utils/stagePlot';

export interface StageSetup {
  elements: StageElement[];
  // null = setup mai salvato
  updatedAt: Timestamp | null;
  updatedBy: { uid: string; name: string } | null;
}

export type SaveSetupResult =
  | { status: 'saved'; setup: StageSetup }
  // Qualcun altro ha salvato dopo che il setup è stato caricato: niente è stato scritto
  | { status: 'conflict'; remote: StageSetup };

export interface SaveSetupOptions {
  user: { uid: string; name: string };
  // updatedAt del setup caricato nell'editor, per riconoscere salvataggi altrui nel frattempo
  baseUpdatedAt: Timestamp | null;
  // Sovrascrive anche in caso di conflitto (scelta esplicita dell'utente)
  force?: boolean;
}

const EMPTY_SETUP: StageSetup = { elements: [], updatedAt: null, updatedBy: null };

const toSetup = (data: Record<string, unknown> | undefined): StageSetup => {
  if (!data) return EMPTY_SETUP;
  return {
    elements: normalizeElements(data.elements),
    updatedAt: (data.updatedAt as Timestamp | undefined) ?? null,
    updatedBy: typeof data.updatedBy === 'string'
      ? { uid: data.updatedBy, name: typeof data.updatedByName === 'string' ? data.updatedByName : '' }
      : null,
  };
};

const sameTimestamp = (a: Timestamp | null, b: Timestamp | null): boolean =>
  (a?.toMillis() ?? null) === (b?.toMillis() ?? null);

/**
 * Setup A/B di un artista: un documento per setup, con tutte le forme in un array.
 * Nessun userId: lo leggono e modificano tutti i membri del tour (vedi firestore.rules).
 */
class ArtistSetupsService {
  private setupDoc(tourId: string, artistId: string, setupKey: SetupKey) {
    return doc(
      FirebaseService.database,
      TOURS_COLLECTION, tourId,
      TOUR_ARTISTS_SUBCOLLECTION, artistId,
      ARTIST_SETUPS_SUBCOLLECTION, SETUP_DOC_IDS[setupKey]
    );
  }

  // Setup mai salvato = setup vuoto
  async getSetup(tourId: string, artistId: string, setupKey: SetupKey): Promise<StageSetup> {
    const snapshot = await getDoc(this.setupDoc(tourId, artistId, setupKey));
    return snapshot.exists() ? toSetup(snapshot.data()) : EMPTY_SETUP;
  }

  async saveSetup(
    tourId: string,
    artistId: string,
    setupKey: SetupKey,
    elements: StageElement[],
    { user, baseUpdatedAt, force = false }: SaveSetupOptions
  ): Promise<SaveSetupResult> {
    if (elements.length > MAX_STAGE_ELEMENTS) {
      throw new Error(`Troppe forme: massimo ${MAX_STAGE_ELEMENTS}`);
    }

    const db = FirebaseService.database;
    const setupRef = this.setupDoc(tourId, artistId, setupKey);

    // Transazione: il controllo del conflitto e la scrittura avvengono sugli stessi dati
    return runTransaction<SaveSetupResult>(db, async (transaction) => {
      const snapshot = await transaction.get(setupRef);
      const remote = snapshot.exists() ? toSetup(snapshot.data()) : EMPTY_SETUP;

      if (!force && !sameTimestamp(remote.updatedAt, baseUpdatedAt)) {
        return { status: 'conflict', remote };
      }

      const updatedAt = Timestamp.now();
      transaction.set(setupRef, {
        elements,
        updatedAt,
        updatedBy: user.uid,
        updatedByName: user.name,
      });
      return { status: 'saved', setup: { elements, updatedAt, updatedBy: user } };
    });
  }
}

const artistSetupsService = new ArtistSetupsService();
export default artistSetupsService;
