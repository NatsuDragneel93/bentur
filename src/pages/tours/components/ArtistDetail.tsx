import React, { useState, useEffect } from 'react';
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

interface ArtistDetailProps {
  tourId: string;
  artistId: string;
  onBack: () => void;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({ tourId, artistId, onBack }) => {
  const [artist, setArtist] = useState<TourArtist | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showToast } = useToast();

  useEffect(() => {
    const loadArtistData = async () => {
      try {
        const currentArtist = await tourArtistsService.getTourArtistById(artistId);
        // L'artista deve appartenere al tour indicato nell'URL
        setArtist(currentArtist?.tourId === tourId ? currentArtist : null);
      } catch (error) {
        console.error('Error loading artist data:', error);
        showError("Errore nel caricamento dell'artista");
      }
    };

    setLoading(true);
    loadArtistData().finally(() => setLoading(false));
  }, [tourId, artistId, showError]);

  if (loading) {
    return (
      <div className="artist-detail-container">
        <LoadingState />
      </div>
    );
  }

  if (!artist) {
    return <div className="error">Artista non trovato</div>;
  }

  // TODO: navigazione alle singole sezioni, non ancora implementate
  const handleSectionClick = () => {
    showToast('Sezione in arrivo');
  };

  return (
    <div className="artist-detail-container">
      <div className="artist-detail-content">
        {/* Header */}
        <div className="artist-detail-header">
          <button className="back-button" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Torna al Tour
          </button>
          
          <h1>{artist.name}</h1>
          <p className="artist-role-display">{artist.role}</p>
        </div>

        {/* Sections Grid */}
        <div className="artist-sections-grid">
          <div 
            className="artist-section-card setup-a" 
            onClick={() => handleSectionClick()}
          >
            <div className="section-icon">
              <FontAwesomeIcon icon={faCog} />
            </div>
            <div className="section-info">
              <h3>Setup A</h3>
              <p>Schema grafico principale</p>
            </div>
          </div>

          <div 
            className="artist-section-card setup-b" 
            onClick={() => handleSectionClick()}
          >
            <div className="section-icon">
              <FontAwesomeIcon icon={faCog} />
            </div>
            <div className="section-info">
              <h3>Setup B</h3>
              <p>Schema grafico alternativo</p>
            </div>
          </div>

          <div 
            className="artist-section-card spare" 
            onClick={() => handleSectionClick()}
          >
            <div className="section-icon">
              <FontAwesomeIcon icon={faTools} />
            </div>
            <div className="section-info">
              <h3>Spare</h3>
              <p>Pezzi di ricambio</p>
            </div>
          </div>

          <div 
            className="artist-section-card todo" 
            onClick={() => handleSectionClick()}
          >
            <div className="section-icon">
              <FontAwesomeIcon icon={faClipboardList} />
            </div>
            <div className="section-info">
              <h3>To Do</h3>
              <p>Lista delle cose da fare</p>
            </div>
          </div>

          <div 
            className="artist-section-card consumabili" 
            onClick={() => handleSectionClick()}
          >
            <div className="section-icon">
              <FontAwesomeIcon icon={faBoxes} />
            </div>
            <div className="section-info">
              <h3>Consumabili</h3>
              <p>Materiali consumabili</p>
            </div>
          </div>

          <div 
            className="artist-section-card check-before" 
            onClick={() => handleSectionClick()}
          >
            <div className="section-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="section-info">
              <h3>To Check Before Showtime</h3>
              <p>Controlli pre-spettacolo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetail;
