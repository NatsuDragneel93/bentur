import React, { useState, useEffect, useCallback } from 'react';
import './TourDetail.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faArrowLeft, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import toursService, { Tour } from '../../../services/tours.service';
import tourArtistsService, { TourArtist } from '../../../services/tourArtists.service';
import { useToast } from '../../../hooks/useToast';
import FormModal from '../../../components/ui/FormModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingState from '../../../components/ui/LoadingState';
import FloatingAddButton from '../../../components/ui/FloatingAddButton';

interface TourDetailProps {
  tourId: string;
  onBack: () => void;
  onArtistClick?: (artistId: string) => void;
}

const TourDetail: React.FC<TourDetailProps> = ({ tourId, onBack, onArtistClick }) => {
  const { showError, showToast } = useToast();
  const [tour, setTour] = useState<Tour | null>(null);
  const [artists, setArtists] = useState<TourArtist[]>([]);
  const [loading, setLoading] = useState(true);

  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [artistToEdit, setArtistToEdit] = useState<TourArtist | null>(null);
  const [artistName, setArtistName] = useState('');
  const [artistRole, setArtistRole] = useState('');
  const [artistToDelete, setArtistToDelete] = useState<string | null>(null);

  const loadTourData = useCallback(async () => {
    try {
      const [tourData, artistsData] = await Promise.all([
        toursService.getTourById(tourId),
        tourArtistsService.getTourArtists(tourId)
      ]);

      setTour(tourData);
      setArtists(artistsData);
    } catch (error) {
      console.error('Error loading tour data:', error);
      showError('Errore nel caricamento del tour');
    }
  }, [tourId, showError]);

  useEffect(() => {
    setLoading(true);
    loadTourData().finally(() => setLoading(false));
  }, [loadTourData]);

  const openAddArtistModal = () => {
    setArtistToEdit(null);
    setArtistName('');
    setArtistRole('');
    setIsArtistModalOpen(true);
  };

  const openEditArtistModal = (artist: TourArtist) => {
    setArtistToEdit(artist);
    setArtistName(artist.name);
    setArtistRole(artist.role);
    setIsArtistModalOpen(true);
  };

  const closeArtistModal = () => {
    setIsArtistModalOpen(false);
    setArtistToEdit(null);
  };

  const handleSaveArtist = async () => {
    if (artistName.trim() === '' || artistRole.trim() === '') {
      showError('Nome e ruolo sono obbligatori');
      return;
    }

    try {
      if (artistToEdit) {
        await tourArtistsService.updateTourArtist(artistToEdit.id, {
          name: artistName.trim(),
          role: artistRole.trim()
        });
      } else {
        await tourArtistsService.addTourArtist(tourId, artistName.trim(), artistRole.trim());
      }

      await loadTourData();
      closeArtistModal();
    } catch (error) {
      console.error('Error adding/editing artist:', error);
      showError('Errore nel salvare l\'artista');
    }
  };

  const handleDeleteArtist = async () => {
    if (!artistToDelete) return;

    try {
      await tourArtistsService.deleteTourArtist(artistToDelete);
      await loadTourData();
      setArtistToDelete(null);
    } catch (error) {
      console.error('Error deleting artist:', error);
      showError('Errore nell\'eliminazione dell\'artista');
    }
  };

  const openExternalLink = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="tour-detail-container">
        <LoadingState />
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
        <div className="tour-detail-header">
          <button className="back-button" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Torna ai Tours
          </button>
          <h1>{tour.name}</h1>
        </div>

        <div className="tour-documents">
          <div className="document-buttons">
            {tour.stagePlot && (
              <button className="document-button" onClick={() => openExternalLink(tour.stagePlot!)}>
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                Stage Plot
              </button>
            )}
            {tour.channelList && (
              <button className="document-button" onClick={() => openExternalLink(tour.channelList!)}>
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                Channel List
              </button>
            )}
            <button
              className="document-button share-button"
              onClick={() => showToast('Condivisione con la crew in arrivo')}
            >
              Share/Invite Crew
            </button>
          </div>
        </div>

        <div className="artists-section">
          <h2>Artists</h2>
          <ul className="artists-list">
            {artists.map(artist => (
              <li key={artist.id} className="artist-item">
                <div className="artist-content">
                  <div
                    className="artist-info clickable"
                    onClick={() => onArtistClick?.(artist.id)}
                  >
                    <span className="artist-name">{artist.name}</span>
                    <span className="artist-role">{artist.role}</span>
                  </div>
                  <div className="artist-actions">
                    <button
                      className="artist-edit-button"
                      type="button"
                      onClick={() => openEditArtistModal(artist)}
                      title="Modifica artista"
                      aria-label={`Modifica ${artist.name}`}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="artist-delete-button"
                      type="button"
                      onClick={() => setArtistToDelete(artist.id)}
                      title="Elimina artista"
                      aria-label={`Elimina ${artist.name}`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <FloatingAddButton label="Aggiungi artista" onClick={openAddArtistModal} />
      </div>

      <FormModal
        open={isArtistModalOpen}
        title={artistToEdit ? 'Modifica Artista' : 'Aggiungi Artista'}
        submitLabel={artistToEdit ? 'Salva Modifiche' : 'Aggiungi'}
        onSubmit={handleSaveArtist}
        onClose={closeArtistModal}
      >
        <label>
          Nome Artista:
          <input
            type="text"
            value={artistName}
            onChange={e => setArtistName(e.target.value)}
            autoFocus
          />
        </label>
        <label>
          Ruolo:
          <input
            type="text"
            value={artistRole}
            onChange={e => setArtistRole(e.target.value)}
            placeholder="Batterista, Chitarrista, Cantante..."
          />
        </label>
      </FormModal>

      <ConfirmDialog
        open={artistToDelete !== null}
        message="Sei sicuro di voler eliminare questo artista?"
        onConfirm={handleDeleteArtist}
        onCancel={() => setArtistToDelete(null)}
      />
    </div>
  );
};

export default TourDetail;
