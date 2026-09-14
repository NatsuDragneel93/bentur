import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './TourDetail.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faArrowLeft, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import toursService, { Tour } from '../../../services/tours.service';
import tourArtistsService, { TourArtist } from '../../../services/tourArtists.service';
import { useToast } from '../../../hooks/useToast';
import { useRequiredUser } from '../../../hooks/useAuth';
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
  const { t } = useTranslation();
  const user = useRequiredUser();
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
      // Prima il tour: se non esiste o non è accessibile, gli artisti non vanno letti
      const tourData = await toursService.getTourById(tourId);
      setTour(tourData);
      setArtists(tourData ? await tourArtistsService.getTourArtists(tourId) : []);
    } catch (error) {
      console.error('Error loading tour data:', error);
      showError(t('tourDetail.loadError'));
    }
  }, [tourId, showError, t]);

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
      showError(t('tourDetail.artistRequired'));
      return;
    }

    try {
      if (artistToEdit) {
        await tourArtistsService.updateTourArtist(tourId, artistToEdit.id, {
          name: artistName.trim(),
          role: artistRole.trim()
        });
      } else {
        await tourArtistsService.addTourArtist(tourId, { name: artistName.trim(), role: artistRole.trim() });
      }

      await loadTourData();
      closeArtistModal();
    } catch (error) {
      console.error('Error adding/editing artist:', error);
      showError(t('tourDetail.saveArtistError'));
    }
  };

  const handleDeleteArtist = async () => {
    if (!artistToDelete) return;

    try {
      await tourArtistsService.deleteTourArtist(tourId, artistToDelete);
      await loadTourData();
      setArtistToDelete(null);
    } catch (error) {
      console.error('Error deleting artist:', error);
      showError(t('tourDetail.deleteArtistError'));
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
          {t('tourDetail.notFound')}
        </div>
      </div>
    );
  }

  // Solo il proprietario modifica gli artisti; i membri (condivisione futura) li vedono soltanto
  const isOwner = tour.ownerId === user.uid;

  return (
    <div className="tour-detail-container">
      <div className="tour-detail-content">
        <div className="tour-detail-header">
          <button className="back-button" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
            {t('tourDetail.back')}
          </button>
          <h1>{tour.name}</h1>
        </div>

        <div className="tour-documents">
          <div className="document-buttons">
            {tour.stagePlot && (
              <button className="document-button" onClick={() => openExternalLink(tour.stagePlot!)}>
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                {t('tourDetail.stagePlot')}
              </button>
            )}
            {tour.channelList && (
              <button className="document-button" onClick={() => openExternalLink(tour.channelList!)}>
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                {t('tourDetail.channelList')}
              </button>
            )}
            <button
              className="document-button share-button"
              onClick={() => showToast(t('tourDetail.shareComingSoon'))}
            >
              {t('tourDetail.shareCrew')}
            </button>
          </div>
        </div>

        <div className="artists-section">
          <h2>{t('tourDetail.artists')}</h2>
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
                  {isOwner && (
                    <div className="artist-actions">
                      <button
                        className="artist-edit-button"
                        type="button"
                        onClick={() => openEditArtistModal(artist)}
                        title={t('tourDetail.editArtistTitle')}
                        aria-label={t('tourDetail.editArtistLabel', { name: artist.name })}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="artist-delete-button"
                        type="button"
                        onClick={() => setArtistToDelete(artist.id)}
                        title={t('common.delete')}
                        aria-label={t('tourDetail.deleteArtistLabel', { name: artist.name })}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {isOwner && <FloatingAddButton label={t('tourDetail.addArtist')} onClick={openAddArtistModal} />}
      </div>

      <FormModal
        open={isArtistModalOpen}
        title={t(artistToEdit ? 'tourDetail.editArtistTitle' : 'tourDetail.addArtistTitle')}
        submitLabel={t(artistToEdit ? 'common.saveChanges' : 'common.add')}
        onSubmit={handleSaveArtist}
        onClose={closeArtistModal}
      >
        <label>
          {t('tourDetail.artistNameField')}
          <input
            type="text"
            value={artistName}
            onChange={e => setArtistName(e.target.value)}
            autoFocus
          />
        </label>
        <label>
          {t('tourDetail.roleField')}
          <input
            type="text"
            value={artistRole}
            onChange={e => setArtistRole(e.target.value)}
            placeholder={t('tourDetail.rolePlaceholder')}
          />
        </label>
      </FormModal>

      <ConfirmDialog
        open={artistToDelete !== null}
        message={t('tourDetail.deleteArtistConfirm')}
        onConfirm={handleDeleteArtist}
        onCancel={() => setArtistToDelete(null)}
      />
    </div>
  );
};

export default TourDetail;
