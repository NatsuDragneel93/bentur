import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  faArrowUpRightFromSquare,
  faPen,
  faPlus,
  faTrashCan,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import toursService, { Tour } from '../../../services/tours.service';
import tourArtistsService, { TourArtist } from '../../../services/tourArtists.service';
import { useToast } from '../../../hooks/useToast';
import { useRequiredUser } from '../../../hooks/useAuth';
import FormModal from '../../../components/ui/FormModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingState from '../../../components/ui/LoadingState';
import Button from '../../../components/ui/Button';
import IconButton from '../../../components/ui/IconButton';
import Field from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { RowCard } from '../../../components/ui/Card';
import { Page, PageTitle, TopBar } from '../../../components/ui/PageLayout';
import { FormErrors, hasErrors, requiredFieldErrors, withoutError } from '../../../utils/formErrors';
import { artistPath } from '../artist-lists/artistListPaths';
import './TourDetail.scss';

interface TourDetailProps {
  tourId: string;
  onBack: () => void;
}

interface ArtistForm {
  name: string;
  role: string;
}

const emptyForm: ArtistForm = { name: '', role: '' };

// Iniziali per l'avatar dell'artista, es. "Davide Muti" -> "DM"
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');

const TourDetail: React.FC<TourDetailProps> = ({ tourId, onBack }) => {
  const { showError, showToast } = useToast();
  const { t } = useTranslation();
  const user = useRequiredUser();
  const [tour, setTour] = useState<Tour | null>(null);
  const [artists, setArtists] = useState<TourArtist[]>([]);
  const [loading, setLoading] = useState(true);

  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [artistToEdit, setArtistToEdit] = useState<TourArtist | null>(null);
  const [form, setForm] = useState<ArtistForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors<ArtistForm>>({});
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
    setForm(emptyForm);
    setErrors({});
    setIsArtistModalOpen(true);
  };

  const openEditArtistModal = (artist: TourArtist) => {
    setArtistToEdit(artist);
    setForm({ name: artist.name, role: artist.role });
    setErrors({});
    setIsArtistModalOpen(true);
  };

  const closeArtistModal = () => {
    setIsArtistModalOpen(false);
    setArtistToEdit(null);
  };

  const updateField = (field: keyof ArtistForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => withoutError(current, field));
  };

  const handleSaveArtist = async () => {
    const validation = requiredFieldErrors(form, {
      name: 'tourDetail.artistNameRequired',
      role: 'tourDetail.roleRequired',
    });
    if (hasErrors(validation)) {
      setErrors(validation);
      return;
    }

    try {
      const details = { name: form.name.trim(), role: form.role.trim() };
      if (artistToEdit) {
        await tourArtistsService.updateTourArtist(tourId, artistToEdit.id, details);
      } else {
        await tourArtistsService.addTourArtist(tourId, details);
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

  const back = { label: t('nav.tours'), onClick: onBack };

  if (loading) {
    return (
      <Page>
        <TopBar back={back} />
        <LoadingState />
      </Page>
    );
  }

  if (!tour) {
    return (
      <Page>
        <TopBar back={back} />
        <p className="bt-empty">{t('tourDetail.notFound')}</p>
      </Page>
    );
  }

  // Solo il proprietario modifica gli artisti; i membri (condivisione futura) li vedono soltanto
  const isOwner = tour.ownerId === user.uid;

  return (
    <Page className="tour-detail">
      <TopBar back={back} />

      <div className="bt-kicker">{t('tourDetail.kicker')}</div>
      <h1 className="bt-page-title tour-detail__title">{tour.name}</h1>

      <div className="tour-detail__documents">
        {tour.stagePlot && (
          <Button icon={faArrowUpRightFromSquare} className="tour-detail__document" onClick={() => openExternalLink(tour.stagePlot!)}>
            {t('tourDetail.stagePlot')}
          </Button>
        )}
        {tour.channelList && (
          <Button icon={faArrowUpRightFromSquare} className="tour-detail__document" onClick={() => openExternalLink(tour.channelList!)}>
            {t('tourDetail.channelList')}
          </Button>
        )}
        <Button icon={faUserPlus} className="tour-detail__document" onClick={() => showToast(t('tourDetail.shareComingSoon'))}>
          {t('tourDetail.shareCrew')}
        </Button>
      </div>

      <PageTitle
        className="tour-detail__artists-header"
        title={t('tourDetail.artists')}
        level={2}
        primaryAction={isOwner && (
          <Button variant="primary" icon={faPlus} className="bt-btn-md" onClick={openAddArtistModal}>
            {t('tourDetail.addArtist')}
          </Button>
        )}
      />

      <ul className="bt-stack bt-stack--tight">
        {artists.map(artist => (
          <li key={artist.id}>
            <RowCard
              compact
              to={artistPath(tourId, artist.id)}
              title={artist.name}
              meta={artist.role}
              leading={<span className="bt-initials" aria-hidden="true">{initials(artist.name)}</span>}
              trailing={isOwner && (
                <>
                  <IconButton
                    icon={faPen}
                    label={t('tourDetail.editArtistLabel', { name: artist.name })}
                    onClick={() => openEditArtistModal(artist)}
                  />
                  <IconButton
                    icon={faTrashCan}
                    danger
                    label={t('tourDetail.deleteArtistLabel', { name: artist.name })}
                    onClick={() => setArtistToDelete(artist.id)}
                  />
                </>
              )}
            />
          </li>
        ))}
      </ul>

      <FormModal
        open={isArtistModalOpen}
        title={t(artistToEdit ? 'tourDetail.editArtistTitle' : 'tourDetail.addArtistTitle')}
        submitLabel={t(artistToEdit ? 'common.saveChanges' : 'common.add')}
        onSubmit={handleSaveArtist}
        onClose={closeArtistModal}
      >
        <Field label={t('tourDetail.artistNameField')} error={errors.name && t(errors.name)}>
          <Input
            value={form.name}
            onChange={e => updateField('name', e.target.value)}
            placeholder={t('tourDetail.artistNamePlaceholder')}
            autoFocus
          />
        </Field>
        <Field label={t('tourDetail.roleField')} error={errors.role && t(errors.role)}>
          <Input
            value={form.role}
            onChange={e => updateField('role', e.target.value)}
            placeholder={t('tourDetail.rolePlaceholder')}
          />
        </Field>
      </FormModal>

      <ConfirmDialog
        open={artistToDelete !== null}
        message={t('tourDetail.deleteArtistConfirm')}
        onConfirm={handleDeleteArtist}
        onCancel={() => setArtistToDelete(null)}
      />
    </Page>
  );
};

export default TourDetail;
