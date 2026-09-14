import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ArtistDetail.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCog,
  faTools,
  faClipboardList,
  faBoxes,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import tourArtistsService, { TourArtist } from '../../../services/tourArtists.service';
import { useToast } from '../../../hooks/useToast';
import LoadingState from '../../../components/ui/LoadingState';

// className mantiene i colori delle card definiti in ArtistDetail.scss
const SECTIONS = [
  { key: 'setupA', className: 'setup-a', icon: faCog },
  { key: 'setupB', className: 'setup-b', icon: faCog },
  { key: 'spare', className: 'spare', icon: faTools },
  { key: 'toDo', className: 'todo', icon: faClipboardList },
  { key: 'consumables', className: 'consumabili', icon: faBoxes },
  { key: 'checkBeforeShow', className: 'check-before', icon: faCheckCircle },
] as const;

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

  useEffect(() => {
    const loadArtistData = async () => {
      try {
        const currentArtist = await tourArtistsService.getTourArtistById(artistId);
        // L'artista deve appartenere al tour indicato nell'URL
        setArtist(currentArtist?.tourId === tourId ? currentArtist : null);
      } catch (error) {
        console.error('Error loading artist data:', error);
        showError(t('artistDetail.loadError'));
      }
    };

    setLoading(true);
    loadArtistData().finally(() => setLoading(false));
  }, [tourId, artistId, showError, t]);

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
              // TODO: navigazione alle singole sezioni, non ancora implementate
              onClick={() => showToast(t('artistDetail.sectionComingSoon'))}
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
