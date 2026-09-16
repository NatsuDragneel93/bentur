import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../hooks/useToast';
import tourArtistsService, { TourArtist } from '../../services/tourArtists.service';

/**
 * Carica un artista del tour. artist null a caricamento finito = non trovato
 * (il percorso tours/{tourId}/artists garantisce che l'artista appartenga al tour).
 */
export const useTourArtist = (tourId: string | undefined, artistId: string | undefined) => {
  const { showError } = useToast();
  const { t } = useTranslation();
  const [artist, setArtist] = useState<TourArtist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tourId || !artistId) return;

    const loadArtist = async () => {
      try {
        setArtist(await tourArtistsService.getTourArtistById(tourId, artistId));
      } catch (error) {
        console.error('Error loading artist data:', error);
        showError(t('artistDetail.loadError'));
      }
    };

    setLoading(true);
    loadArtist().finally(() => setLoading(false));
  }, [tourId, artistId, showError, t]);

  return { artist, loading };
};
