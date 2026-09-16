import { collection } from 'firebase/firestore';
import FirebaseService from './firebase.service';
import {
  ChecklistItem,
  ConsumableItem,
  createCategoryListService,
  InventoryItem,
  ListItem,
} from './categoryList.service';
import { ARTIST_LIST_SUBCOLLECTIONS, ArtistListKey, TOUR_ARTISTS_SUBCOLLECTION, TOURS_COLLECTION } from './tours.service';

// Nelle liste degli artisti gli elementi stanno sempre nel campo 'items'
export const ARTIST_LIST_ITEMS_FIELD = 'items';

/**
 * Liste di un artista: una sottocollection per lista, un documento per categoria.
 * Nessun userId: possono accedervi tutti i membri del tour (vedi firestore.rules).
 */
const artistListService = <TItem extends ListItem>(listKey: ArtistListKey) => ({
  forArtist: (tourId: string, artistId: string) =>
    createCategoryListService<TItem>(
      {
        collectionRef: collection(
          FirebaseService.database,
          TOURS_COLLECTION, tourId,
          TOUR_ARTISTS_SUBCOLLECTION, artistId,
          ARTIST_LIST_SUBCOLLECTIONS[listKey]
        ),
      },
      ARTIST_LIST_ITEMS_FIELD
    ),
});

export const artistSpareService = artistListService<InventoryItem>('spare');
export const artistToDoService = artistListService<ChecklistItem>('toDo');
export const artistConsumablesService = artistListService<ConsumableItem>('consumables');
export const artistCheckBeforeShowService = artistListService<ChecklistItem>('checkBeforeShow');
