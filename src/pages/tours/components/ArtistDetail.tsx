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
import { useFirebase } from '../../../context/firebase.context';
import { User, onAuthStateChanged } from 'firebase/auth';
import tourArtistsService, { TourArtist } from '../../../services/tourArtists.service';

interface ArtistDetailProps {
  tourId: string;
  artistId: string;
  onBack: () => void;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({ tourId, artistId, onBack }) => {
  const [artist, setArtist] = useState<TourArtist | null>(null);
  const [loading, setLoading] = useState(true);
  const firebase = useFirebase();

  useEffect(() => {
    if (firebase && firebase.auth) {
      const unsubscribe = onAuthStateChanged(firebase.auth, (user: User | null) => {
        if (user) {
          loadArtistData();
        } else {
          setArtist(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [firebase, tourId, artistId]);

  const loadArtistData = async () => {
    try {
      const artistsData = await tourArtistsService.getTourArtists(tourId);
      const currentArtist = artistsData.find(a => a.id === artistId);
      setArtist(currentArtist || null);
    } catch (error) {
      console.error('Error loading artist data:', error);
    }
  };

  if (loading) {
    return <div className="loading">Caricamento...</div>;
  }

  if (!artist) {
    return <div className="error">Artista non trovato</div>;
  }

  const handleSectionClick = (section: string) => {
    console.log(`Opening ${section} for artist ${artist.name}`);
    // TODO: Implement navigation to specific sections
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
            onClick={() => handleSectionClick('setup-a')}
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
            onClick={() => handleSectionClick('setup-b')}
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
            onClick={() => handleSectionClick('spare')}
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
            onClick={() => handleSectionClick('todo')}
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
            onClick={() => handleSectionClick('consumabili')}
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
            onClick={() => handleSectionClick('check-before')}
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
