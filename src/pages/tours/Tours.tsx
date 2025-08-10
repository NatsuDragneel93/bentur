import React, { useState, useEffect } from 'react';
import './Tours.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useFirebase } from '../../context/firebase.context';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useParams, useNavigate } from 'react-router-dom';
import toursService, { Tour } from '../../services/tours.service';
import TourDetail from './components/TourDetail';
import ArtistDetail from './components/ArtistDetail';

const Tours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebase = useFirebase();
  const { tourId, artistId } = useParams();
  const navigate = useNavigate();

  // Modal states
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [tourToEdit, setTourToEdit] = useState<Tour | null>(null);
  const [newTourName, setNewTourName] = useState('');
  const [newTourStagePlot, setNewTourStagePlot] = useState('');
  const [newTourChannelList, setNewTourChannelList] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (firebase && firebase.auth) {
      const unsubscribe = onAuthStateChanged(firebase.auth, (user: User | null) => {
        setUser(user);
        if (user) {
          loadTours();
        } else {
          setTours([]);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [firebase]);

  const loadTours = async () => {
    try {
      const allTours = await toursService.getAllTours();
      setTours(allTours);
    } catch (error) {
      console.error('Error loading tours:', error);
    }
  };

  const handleAddOrEditTour = async () => {
    if (newTourName.trim() === '' || !user) return;
    
    try {
      if (tourToEdit) {
        // Edit tour
        await toursService.updateTour(tourToEdit.id, {
          name: newTourName.trim(),
          stagePlot: newTourStagePlot.trim(),
          channelList: newTourChannelList.trim()
        });
      } else {
        // Add new tour
        await toursService.addTour(
          newTourName.trim(),
          newTourStagePlot.trim() || undefined,
          newTourChannelList.trim() || undefined
        );
      }
      
      await loadTours();
      setIsTourModalOpen(false);
      resetModalState();
    } catch (error) {
      console.error('Error adding/editing tour:', error);
    }
  };

  const handleEditClick = (tour: Tour) => {
    setTourToEdit(tour);
    setNewTourName(tour.name);
    setNewTourStagePlot(tour.stagePlot || '');
    setNewTourChannelList(tour.channelList || '');
    setIsTourModalOpen(true);
  };

  const handleDeleteTour = async () => {
    if (!tourToDelete || !user) return;
    
    try {
      await toursService.deleteTour(tourToDelete);
      await loadTours();
      setIsDeleteModalOpen(false);
      setTourToDelete(null);
    } catch (error) {
      console.error('Error deleting tour:', error);
    }
  };

  const resetModalState = () => {
    setTourToEdit(null);
    setNewTourName('');
    setNewTourStagePlot('');
    setNewTourChannelList('');
  };

  if (loading) {
    return (
      <div className="tours-page-container">
        <div className="tours-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Caricamento...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="tours-page-container">
        <div className="tours-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Effettua il login per vedere i tours
          </div>
        </div>
      </div>
    );
  }

  // Se è selezionato un artista, mostra il dettaglio dell'artista
  if (tourId && artistId) {
    return (
      <ArtistDetail
        tourId={tourId}
        artistId={artistId}
        onBack={() => navigate(`/tours/${tourId}`)}
      />
    );
  }

  // Se è selezionato un tour, mostra il dettaglio
  if (tourId) {
    return (
      <TourDetail
        tourId={tourId}
        onBack={() => navigate('/tours')}
        onArtistClick={(artistId) => navigate(`/tours/${tourId}/artists/${artistId}`)}
      />
    );
  }

  return (
    <div className="tours-page-container">
      <div className="tours-container">
        <h1>Tours</h1>
        
        <ul className="tours-list">
          {tours.map(tour => (
            <li key={tour.id} className="tour-item">
              <div 
                className="tour-content"
                onClick={() => navigate(`/tours/${tour.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <span className="tour-name">{tour.name}</span>
                <div className="tour-actions">
                  <button
                    className="tour-edit-button"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Previene il click sul tour-content
                      handleEditClick(tour);
                    }}
                    title="Modifica tour"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="tour-delete-button"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Previene il click sul tour-content
                      setTourToDelete(tour.id);
                      setIsDeleteModalOpen(true);
                    }}
                    title="Elimina tour"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Floating button per aggiungere tour */}
        <button
          className="add-tour-floating-button"
          onClick={() => {
            resetModalState();
            setIsTourModalOpen(true);
          }}
          aria-label="Aggiungi tour"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      {/* Modal aggiunta/modifica tour */}
      {isTourModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{tourToEdit ? 'Modifica Tour' : 'Aggiungi Tour'}</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddOrEditTour();
              }}
            >
              <label>
                Nome Tour:
                <input
                  type="text"
                  value={newTourName}
                  onChange={e => setNewTourName(e.target.value)}
                  autoFocus
                  required
                />
              </label>
              <label>
                Stage Plot (URL):
                <input
                  type="url"
                  value={newTourStagePlot}
                  onChange={e => setNewTourStagePlot(e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </label>
              <label>
                Channel List (URL):
                <input
                  type="url"
                  value={newTourChannelList}
                  onChange={e => setNewTourChannelList(e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="save-button">
                  {tourToEdit ? 'Salva Modifiche' : 'Aggiungi'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setIsTourModalOpen(false);
                    resetModalState();
                  }}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal conferma eliminazione tour */}
      {isDeleteModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Sei sicuro di voler eliminare questo tour?</h3>
            <div className="delete-actions">
              <button
                type="button"
                className="confirm-button"
                onClick={handleDeleteTour}
              >
                Sì
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTourToDelete(null);
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

export default Tours;