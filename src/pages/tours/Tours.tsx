import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './Tours.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';
import toursService, { Tour } from '../../services/tours.service';
import { useToast } from '../../hooks/useToast';
import { useRequiredUser } from '../../hooks/useAuth';
import TourDetail from './components/TourDetail';
import ArtistDetail from './components/ArtistDetail';
import FormModal from '../../components/ui/FormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingState from '../../components/ui/LoadingState';
import FloatingAddButton from '../../components/ui/FloatingAddButton';

const Tours: React.FC = () => {
  const { showError } = useToast();
  const { t } = useTranslation();
  const user = useRequiredUser();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const { tourId, artistId } = useParams();
  const navigate = useNavigate();

  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [tourToEdit, setTourToEdit] = useState<Tour | null>(null);
  const [tourName, setTourName] = useState('');
  const [tourStagePlot, setTourStagePlot] = useState('');
  const [tourChannelList, setTourChannelList] = useState('');
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);

  const loadTours = useCallback(async () => {
    try {
      setTours(await toursService.getUserTours(user.uid));
    } catch (error) {
      console.error('Error loading tours:', error);
      showError(t('tours.loadError'));
    }
  }, [user.uid, showError, t]);

  useEffect(() => {
    loadTours().finally(() => setLoading(false));
  }, [loadTours]);

  const openAddModal = () => {
    setTourToEdit(null);
    setTourName('');
    setTourStagePlot('');
    setTourChannelList('');
    setIsTourModalOpen(true);
  };

  const openEditModal = (tour: Tour) => {
    setTourToEdit(tour);
    setTourName(tour.name);
    setTourStagePlot(tour.stagePlot || '');
    setTourChannelList(tour.channelList || '');
    setIsTourModalOpen(true);
  };

  const closeModal = () => {
    setIsTourModalOpen(false);
    setTourToEdit(null);
  };

  const handleSaveTour = async () => {
    if (tourName.trim() === '') {
      showError(t('tours.nameRequired'));
      return;
    }

    try {
      const details = {
        name: tourName.trim(),
        stagePlot: tourStagePlot.trim(),
        channelList: tourChannelList.trim()
      };

      if (tourToEdit) {
        await toursService.updateTour(tourToEdit.id, details);
      } else {
        await toursService.addTour(user.uid, details);
      }

      await loadTours();
      closeModal();
    } catch (error) {
      console.error('Error adding/editing tour:', error);
      showError(t('tours.saveError'));
    }
  };

  const handleDeleteTour = async () => {
    if (!tourToDelete) return;

    try {
      await toursService.deleteTour(tourToDelete);
      await loadTours();
      setTourToDelete(null);
    } catch (error) {
      console.error('Error deleting tour:', error);
      showError(t('tours.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className="tours-page-container">
        <LoadingState />
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
        <h1>{t('tours.title')}</h1>

        <ul className="tours-list">
          {tours.map(tour => (
            <li key={tour.id} className="tour-item">
              <div
                className="tour-content"
                onClick={() => navigate(`/tours/${tour.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <span className="tour-name">{tour.name}</span>
                {tour.ownerId === user.uid && (
                  <div className="tour-actions">
                    <button
                      className="tour-edit-button"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Previene il click sul tour-content
                        openEditModal(tour);
                      }}
                      title={t('tours.editTitle')}
                      aria-label={t('tours.editLabel', { name: tour.name })}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="tour-delete-button"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Previene il click sul tour-content
                        setTourToDelete(tour.id);
                      }}
                      title={t('common.delete')}
                      aria-label={t('tours.deleteLabel', { name: tour.name })}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        <FloatingAddButton label={t('tours.add')} onClick={openAddModal} />
      </div>

      <FormModal
        open={isTourModalOpen}
        title={t(tourToEdit ? 'tours.editTitle' : 'tours.addTitle')}
        submitLabel={t(tourToEdit ? 'common.saveChanges' : 'common.add')}
        onSubmit={handleSaveTour}
        onClose={closeModal}
      >
        <label>
          {t('tours.nameField')}
          <input
            type="text"
            value={tourName}
            onChange={e => setTourName(e.target.value)}
            autoFocus
          />
        </label>
        <label>
          {t('tours.stagePlotField')}
          <input
            type="url"
            value={tourStagePlot}
            onChange={e => setTourStagePlot(e.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </label>
        <label>
          {t('tours.channelListField')}
          <input
            type="url"
            value={tourChannelList}
            onChange={e => setTourChannelList(e.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </label>
      </FormModal>

      <ConfirmDialog
        open={tourToDelete !== null}
        message={t('tours.deleteConfirm')}
        onConfirm={handleDeleteTour}
        onCancel={() => setTourToDelete(null)}
      />
    </div>
  );
};

export default Tours;
