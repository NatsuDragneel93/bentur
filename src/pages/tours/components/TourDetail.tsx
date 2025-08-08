import React, { useState, useEffect } from 'react';
import './TourDetail.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faArrowLeft, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useFirebase } from '../../../context/firebase.context';
import { User, onAuthStateChanged } from 'firebase/auth';
import toursService, { Tour } from '../../../services/tours.service';
import tourArtistsService, { TourArtist } from '../../../services/tourArtists.service';

interface TourDetailProps {
  tourId: string;
  onBack: () => void;
}

const TourDetail: React.FC<TourDetailProps> = ({ tourId, onBack }) => {
  const [tour, setTour] = useState<Tour | null>(null);
  const [artists, setArtists] = useState<TourArtist[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebase = useFirebase();

  // Modal states for artists
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [artistToEdit, setArtistToEdit] = useState<TourArtist | null>(null);
  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistRole, setNewArtistRole] = useState('');
  const [isDeleteArtistModalOpen, setIsDeleteArtistModalOpen] = useState(false);
  const [artistToDelete, setArtistToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (firebase && firebase.auth) {
      const unsubscribe = onAuthStateChanged(firebase.auth, (user: User | null) => {
        setUser(user);
        if (user) {
          loadTourData();
        } else {
          setTour(null);
          setArtists([]);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [firebase, tourId]);

  const loadTourData = async () => {
    try {
      const [tourData, artistsData] = await Promise.all([
        toursService.getTourById(tourId),
        tourArtistsService.getTourArtists(tourId)
      ]);
      
      setTour(tourData);
      setArtists(artistsData);
    } catch (error) {
      console.error('Error loading tour data:', error);
    }
  };

  const handleAddOrEditArtist = async () => {
    if (newArtistName.trim() === '' || newArtistRole.trim() === '' || !user) return;
    
    try {
      if (artistToEdit) {
        // Edit artist
        await tourArtistsService.updateTourArtist(artistToEdit.id, {
          name: newArtistName.trim(),
          role: newArtistRole.trim()
        });
      } else {
        // Add new artist
        await tourArtistsService.addTourArtist(
          tourId,
          newArtistName.trim(),
          newArtistRole.trim()
        );
      }
      
      await loadTourData();
      setIsArtistModalOpen(false);
      resetArtistModalState();
    } catch (error) {
      console.error('Error adding/editing artist:', error);
    }
  };

  const handleEditArtistClick = (artist: TourArtist) => {
    setArtistToEdit(artist);
    setNewArtistName(artist.name);
    setNewArtistRole(artist.role);
    setIsArtistModalOpen(true);
  };

  const handleDeleteArtist = async () => {
    if (!artistToDelete || !user) return;
    
    try {
      await tourArtistsService.deleteTourArtist(artistToDelete);
      await loadTourData();
      setIsDeleteArtistModalOpen(false);
      setArtistToDelete(null);
    } catch (error) {
      console.error('Error deleting artist:', error);
    }
  };

  const resetArtistModalState = () => {
    setArtistToEdit(null);
    setNewArtistName('');
    setNewArtistRole('');
  };

  const openExternalLink = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="tour-detail-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Caricamento...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="tour-detail-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Effettua il login per vedere i dettagli del tour
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="tour-detail-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Tour non trovato
        </div>
      </div>
    );
  }

  return (
    <div className="tour-detail-container">
      <div className="tour-detail-content">
        {/* Header con nome tour e pulsante back */}
        <div className="tour-detail-header">
          <button className="back-button" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Torna ai Tours
          </button>
          <h1>{tour.name}</h1>
        </div>

        {/* Sezione documenti del tour */}
        <div className="tour-documents">
          <div className="document-buttons">
            {tour.stagePlot && (
              <button
                className="document-button"
                onClick={() => openExternalLink(tour.stagePlot!)}
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                Stage Plot
              </button>
            )}
            {tour.channelList && (
              <button
                className="document-button"
                onClick={() => openExternalLink(tour.channelList!)}
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                Channel List
              </button>
            )}
            <button className="document-button share-button">
              Share/Invite Crew
            </button>
          </div>
        </div>

        {/* Sezione artisti */}
        <div className="artists-section">
          <h2>Artists</h2>
          <ul className="artists-list">
            {artists.map(artist => (
              <li key={artist.id} className="artist-item">
                <div className="artist-content">
                  <div className="artist-info">
                    <span className="artist-name">{artist.name}</span>
                    <span className="artist-role">{artist.role}</span>
                  </div>
                  <div className="artist-actions">
                    <button
                      className="artist-edit-button"
                      type="button"
                      onClick={() => handleEditArtistClick(artist)}
                      title="Modifica artista"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="artist-delete-button"
                      type="button"
                      onClick={() => {
                        setArtistToDelete(artist.id);
                        setIsDeleteArtistModalOpen(true);
                      }}
                      title="Elimina artista"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Floating button per aggiungere artista */}
        <button
          className="add-artist-floating-button"
          onClick={() => {
            resetArtistModalState();
            setIsArtistModalOpen(true);
          }}
          aria-label="Aggiungi artista"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      {/* Modal aggiunta/modifica artista */}
      {isArtistModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{artistToEdit ? 'Modifica Artista' : 'Aggiungi Artista'}</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddOrEditArtist();
              }}
            >
              <label>
                Nome Artista:
                <input
                  type="text"
                  value={newArtistName}
                  onChange={e => setNewArtistName(e.target.value)}
                  autoFocus
                  required
                />
              </label>
              <label>
                Ruolo:
                <input
                  type="text"
                  value={newArtistRole}
                  onChange={e => setNewArtistRole(e.target.value)}
                  placeholder="Batterista, Chitarrista, Cantante..."
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="save-button">
                  {artistToEdit ? 'Salva Modifiche' : 'Aggiungi'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setIsArtistModalOpen(false);
                    resetArtistModalState();
                  }}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal conferma eliminazione artista */}
      {isDeleteArtistModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Sei sicuro di voler eliminare questo artista?</h3>
            <div className="delete-actions">
              <button
                type="button"
                className="confirm-button"
                onClick={handleDeleteArtist}
              >
                Sì
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsDeleteArtistModalOpen(false);
                  setArtistToDelete(null);
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourDetail;
