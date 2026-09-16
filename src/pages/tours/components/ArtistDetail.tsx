import React from 'react';
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
import LoadingState from '../../../components/ui/LoadingState';
import type { ArtistListKey } from '../../../services/tours.service';
import { artistListPath } from '../artist-lists/artistListPaths';
import { artistSetupPath, SetupKey } from '../setup/setupPaths';
import { useTourArtist } from '../useTourArtist';

type SectionKey = 'setupA' | 'setupB' | ArtistListKey;

const setupSection = (setupKey: SetupKey) => (tourId: string, artistId: string) => artistSetupPath(tourId, artistId, setupKey);
const listSection = (listKey: ArtistListKey) => (tourId: string, artistId: string) => artistListPath(tourId, artistId, listKey);

// className mantiene i colori delle card definiti in ArtistDetail.scss; path = pagina aperta dalla card
const SECTIONS: { key: SectionKey; className: string; icon: IconDefinition; path: (tourId: string, artistId: string) => string }[] = [
  { key: 'setupA', className: 'setup-a', icon: faCog, path: setupSection('a') },
  { key: 'setupB', className: 'setup-b', icon: faCog, path: setupSection('b') },
  { key: 'spare', className: 'spare', icon: faTools, path: listSection('spare') },
  { key: 'toDo', className: 'todo', icon: faClipboardList, path: listSection('toDo') },
  { key: 'consumables', className: 'consumabili', icon: faBoxes, path: listSection('consumables') },
  { key: 'checkBeforeShow', className: 'check-before', icon: faCheckCircle, path: listSection('checkBeforeShow') },
];

interface ArtistDetailProps {
  tourId: string;
  artistId: string;
  onBack: () => void;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({ tourId, artistId, onBack }) => {
  const { artist, loading } = useTourArtist(tourId, artistId);
  const { t } = useTranslation();
  const navigate = useNavigate();

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
              onClick={() => navigate(section.path(tourId, artistId))}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(section.path(tourId, artistId));
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
