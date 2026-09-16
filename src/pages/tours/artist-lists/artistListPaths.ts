import type { ArtistListKey } from '../../../services/tours.service';

// Segmento dell'URL di ogni lista: /tours/:tourId/artists/:artistId/lists/:listPath
const LIST_PATHS: Record<ArtistListKey, string> = {
  spare: 'spare',
  toDo: 'to-do',
  consumables: 'consumables',
  checkBeforeShow: 'check-before-show',
};

export const artistPath = (tourId: string, artistId: string): string => `/tours/${tourId}/artists/${artistId}`;

export const artistListPath = (tourId: string, artistId: string, listKey: ArtistListKey): string =>
  `${artistPath(tourId, artistId)}/lists/${LIST_PATHS[listKey]}`;

// Lista corrispondente al segmento dell'URL, oppure null se non esiste
export const artistListKeyFromPath = (listPath: string | undefined): ArtistListKey | null =>
  (Object.keys(LIST_PATHS) as ArtistListKey[]).find(key => LIST_PATHS[key] === listPath) ?? null;
