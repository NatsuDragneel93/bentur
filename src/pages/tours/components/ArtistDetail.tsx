import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './ArtistDetail.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCog,
  faTools,
  faClipboardList,
  faBoxes,
  faCheckCircle,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import tourArtistsService, { TourArtist } from '../../../services/tourArtists.service';
import { useToast } from '../../../hooks/useToast';
import LoadingState from '../../../components/ui/LoadingState';
import type { ArtistListKey } from '../../../services/tours.service';
import { artistListPath } from '../artist-lists/artistListPaths';

type SectionKey = 'setupA' | 'setupB' | ArtistListKey;

// className mantiene i colori delle card definiti in ArtistDetail.scss.
// listKey: la card apre la lista corrispondente; senza, la sezione non è ancora implementata
const SECTIONS: { key: SectionKey; className: string; icon: IconDefinition; listKey?: ArtistListKey }[] = [
  { key: 'setupA', className: 'setup-a', icon: faCog },
  { key: 'setupB', className: 'setup-b', icon: faCog },
  { key: 'spare', className: 'spare', icon: faTools, listKey: 'spare' },
  { key: 'toDo', className: 'todo', icon: faClipboardList, listKey: 'toDo' },
  { key: 'consumables', className: 'consumabili', icon: faBoxes, listKey: 'consumables' },
  { key: 'checkBeforeShow', className: 'check-before', icon: faCheckCircle, listKey: 'checkBeforeShow' },
];

interface ArtistDetailProps {
  tourId: string;
  artistId: string;
  onBack: () => void;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({ tourId, artistId, onBack }) => {
  const [artist, setArtist] = useState<TourArtist | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadArtistData = async () => {
      try {
        // Il percorso tours/{tourId}/artists garantisce che l'artista appartenga al tour
        setArtist(await tourArtistsService.getTourArtistById(tourId, artistId));
      } catch (error) {
        console.error('Error loading artist data:', error);
        showError(t('artistDetail.loadError'));
      }
    };

    setLoading(true);
    loadArtistData().finally(() => setLoading(false));
  }, [tourId, artistId, showError, t]);

  const openSection = (listKey?: ArtistListKey) => {
    if (listKey) {
      navigate(artistListPath(tourId, artistId, listKey));
    } else {
      // TODO: Setup A/B non ancora implementati
      showToast(t('artistDetail.sectionComingSoon'));
    }
  };

  if (loading) {
    return (
      <div className="artist-detail-container">
        <LoadingState />
      </div>
    );
  }

  if (!artist) {
    return <div className="error">{t('artistDetail.notFound')}</div>;
  }

  return (
    <div className="artist-detail-container">
      <div className="artist-detail-content">
        <div className="artist-detail-header">
          <button className="back-button" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
            {t('artistDetail.back')}
          </button>

          <h1>{artist.name}</h1>
          <p className="artist-role-display">{artist.role}</p>
        </div>

        <div className="artist-sections-grid">
          {SECTIONS.map(section => (
            <div
              key={section.key}
              className={`artist-section-card ${section.className}`}
              role="button"
              tabIndex={0}
              onClick={() => openSection(section.listKey)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openSection(section.listKey);
                }
              }}
            >
              <div className="section-icon">
                <FontAwesomeIcon icon={section.icon} />
              </div>
              <div className="section-info">
                <h3>{t(`artistDetail.sections.${section.key}.title`)}</h3>
                <p>{t(`artistDetail.sections.${section.key}.description`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArtistDetail;
