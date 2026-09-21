import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCaretDown, faCaretRight, faRoute } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../../hooks/useToast';
import { useRequiredUser } from '../../hooks/useAuth';
import toursService, { Tour } from '../../services/tours.service';
import tourArtistsService, { TourArtist } from '../../services/tourArtists.service';
import { ListStats, matchesSearch, sumStats } from '../../utils/tourOverview';
import LoadingState from '../ui/LoadingState';
import SearchInput from '../ui/SearchInput';
import Tag from '../ui/Tag';
import { BackLink, Page, PageTitle, TopBar } from '../ui/PageLayout';
import './TourOverview.scss';

// Contesto passato alle pagine per costruire le liste di un artista
export interface ArtistListsContext {
  tourId: string;
  artistId: string;
  // Conteggi di una lista dell'artista: il tour li somma per il tag
  onStats: (listKey: string, stats: ListStats) => void;
}

interface TourOverviewProps {
  title: string;
  subtitle?: string;
  back: BackLink;
  // Tag accanto al nome del tour, calcolato sui conteggi di tutte le liste (null = nessun tag)
  tourBadge: (stats: ListStats) => React.ReactNode;
  // Liste modificabili mostrate sotto ogni artista
  renderLists: (context: ArtistListsContext) => React.ReactNode;
}

// Artisti di un tour, caricati alla prima apertura
interface TourArtistsState {
  loading: boolean;
  artists: TourArtist[];
}

/**
 * Elenco dei tour a fisarmonica: aprendo un tour si vedono i suoi artisti,
 * ognuno con le proprie liste modificabili (To Do - Tour, Inventario - Tour).
 * I dati di un tour si caricano alla prima apertura e restano in memoria finché si resta nella pagina.
 */
const TourOverview: React.FC<TourOverviewProps> = ({ title, subtitle, back, tourBadge, renderLists }) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const user = useRequiredUser();

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Numero di artisti per tour, solo informativo (come nella pagina Tour)
  const [artistCounts, setArtistCounts] = useState<Record<string, number>>({});
  // Tour aperti; quelli già aperti restano montati anche da chiusi, per non rileggerli
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());
  const [artistsByTour, setArtistsByTour] = useState<Record<string, TourArtistsState>>({});
  // Conteggi delle liste: tourId -> "artistId:listKey" -> conteggi
  const [statsByTour, setStatsByTour] = useState<Record<string, Record<string, ListStats>>>({});

  useEffect(() => {
    toursService.getUserTours(user.uid)
      .then(setTours)
      .catch(error => {
        console.error('Errore nel caricamento dei tour:', error);
        showError(t('tours.loadError'));
      })
      .finally(() => setLoading(false));
  }, [user.uid, showError, t]);

  // Numero di artisti di ogni tour: se un conteggio fallisce la riga resta senza numero
  useEffect(() => {
    if (tours.length === 0) return;
    let cancelled = false;

    Promise.all(tours.map(tour =>
      tourArtistsService.countTourArtists(tour.id).then(count => [tour.id, count] as const, () => null)
    )).then(counts => {
      if (!cancelled) setArtistCounts(Object.fromEntries(counts.filter(entry => entry !== null)));
    });
    return () => {
      cancelled = true;
    };
  }, [tours]);

  const loadArtists = useCallback(async (tourId: string) => {
    setArtistsByTour(current => ({ ...current, [tourId]: { loading: true, artists: [] } }));
    try {
      const artists = await tourArtistsService.getTourArtists(tourId);
      setArtistsByTour(current => ({ ...current, [tourId]: { loading: false, artists } }));
    } catch (error) {
      console.error('Errore nel caricamento degli artisti:', error);
      showError(t('tourLists.artistsError'));
      setArtistsByTour(current => ({ ...current, [tourId]: { loading: false, artists: [] } }));
    }
  }, [showError, t]);

  const toggleTour = (tourId: string) => {
    setExpandedIds(current => {
      const next = new Set(current);
      if (next.has(tourId)) {
        next.delete(tourId);
      } else {
        next.add(tourId);
      }
      return next;
    });

    if (!openedIds.has(tourId)) {
      setOpenedIds(current => new Set(current).add(tourId));
      loadArtists(tourId);
    }
  };

  const handleStats = (tourId: string, artistId: string, listKey: string, stats: ListStats) => {
    setStatsByTour(current => ({
      ...current,
      [tourId]: { ...current[tourId], [`${artistId}:${listKey}`]: stats },
    }));
  };

  // Tag del tour: solo quando tutte le liste aperte hanno finito di caricare
  const badgeOf = (tourId: string) => {
    const stats = Object.values(statsByTour[tourId] ?? {});
    if (stats.length === 0) return null;
    const total = sumStats(stats);
    return total.loading ? null : tourBadge(total);
  };

  // Artisti da mostrare: se il nome del tour corrisponde alla ricerca si vedono tutti
  const artistsToShow = (tour: Tour): TourArtist[] => {
    const artists = artistsByTour[tour.id]?.artists ?? [];
    if (matchesSearch(searchTerm, tour.name)) return artists;
    return artists.filter(artist => matchesSearch(searchTerm, artist.name, artist.role));
  };

  const visibleTours = tours.filter(tour =>
    matchesSearch(searchTerm, tour.name) || artistsToShow(tour).length > 0
  );

  const renderArtists = (tour: Tour) => {
    const state = artistsByTour[tour.id];
    if (!state || state.loading) return <LoadingState />;

    const artists = artistsToShow(tour);
    if (artists.length === 0) {
      return <p className="bt-empty">{t('tourLists.noArtists')}</p>;
    }

    return artists.map(artist => (
      <article key={artist.id} className="tov-artist">
        <span className="tov-artist-rule" aria-hidden="true" />
        <header className="tov-artist-header">
          <div className="tov-artist-identity">
            <h3 className="tov-artist-name">{artist.name}</h3>
            <span className="tov-artist-role">{artist.role}</span>
          </div>
          <Link
            className="tov-artist-open"
            to={`/tours/${tour.id}/artists/${artist.id}`}
            aria-label={t('tourLists.openArtistLabel', { name: artist.name })}
          >
            {t('tourLists.openArtist')}
            <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
          </Link>
        </header>

        {renderLists({
          tourId: tour.id,
          artistId: artist.id,
          onStats: (listKey, stats) => handleStats(tour.id, artist.id, listKey, stats),
        })}
      </article>
    ));
  };

  return (
    <Page className="tov-page">
      <TopBar back={back} />
      <PageTitle title={title} subtitle={subtitle} />

      <SearchInput
        className="tov-search"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder={t('tourLists.search')}
      />

      {loading ? (
        <LoadingState />
      ) : tours.length === 0 ? (
        <p className="bt-empty">
          {t('tourLists.noTours')} <Link to="/tours">{t('tourLists.goToTours')}</Link>
        </p>
      ) : (
        <ul className="tov-tours">
          {visibleTours.map(tour => {
            const isOpen = expandedIds.has(tour.id);
            const badge = badgeOf(tour.id);
            const count = artistCounts[tour.id];

            return (
              <li key={tour.id} className="card elev-sm tov-tour">
                <div className="tov-tour-header">
                  <button
                    type="button"
                    className="tov-tour-toggle"
                    onClick={() => toggleTour(tour.id)}
                    aria-expanded={isOpen}
                  >
                    <FontAwesomeIcon
                      icon={isOpen ? faCaretDown : faCaretRight}
                      className={`cl-caret ${isOpen ? 'cl-caret--open' : ''}`}
                      aria-hidden="true"
                    />
                    <FontAwesomeIcon icon={faRoute} className="tov-tour-icon" aria-hidden="true" />
                    <span className="tov-tour-name">{tour.name}</span>
                  </button>
                  <div className="tov-tour-tags">
                    {count !== undefined && <span className="tov-tour-meta">{t('tours.artistCount', { count })}</span>}
                    {badge && <Tag tone="outline">{badge}</Tag>}
                  </div>
                </div>

                {openedIds.has(tour.id) && (
                  <div className="tov-tour-content" hidden={!isOpen}>
                    {renderArtists(tour)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
};

export default TourOverview;
