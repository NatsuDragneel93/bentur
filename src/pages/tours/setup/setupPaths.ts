import { SETUP_KEYS, SetupKey } from '../../../services/tours.service';
import { artistPath } from '../artist-lists/artistListPaths';

export type { SetupKey };

// Setup dell'artista: /tours/:tourId/artists/:artistId/setup/:setupKey
export const artistSetupPath = (tourId: string, artistId: string, setupKey: SetupKey): string =>
  `${artistPath(tourId, artistId)}/setup/${setupKey}`;

export const isSetupKey = (value: string | undefined): value is SetupKey =>
  SETUP_KEYS.includes(value as SetupKey);
