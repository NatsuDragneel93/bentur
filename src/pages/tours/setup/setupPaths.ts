import { artistPath } from '../artist-lists/artistListPaths';

// Setup dell'artista: /tours/:tourId/artists/:artistId/setup/:setupKey
export const SETUP_KEYS = ['a', 'b'] as const;
export type SetupKey = (typeof SETUP_KEYS)[number];

export const artistSetupPath = (tourId: string, artistId: string, setupKey: SetupKey): string =>
  `${artistPath(tourId, artistId)}/setup/${setupKey}`;

export const isSetupKey = (value: string | undefined): value is SetupKey =>
  SETUP_KEYS.includes(value as SetupKey);
