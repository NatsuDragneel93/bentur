import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faPlus, faRoute, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';
import toursService, { Tour } from '../../services/tours.service';
import tourArtistsService from '../../services/tourArtists.service';
import { useToast } from '../../hooks/useToast';
import { useRequiredUser } from '../../hooks/useAuth';
import TourDetail from './components/TourDetail';
import ArtistDetail from './components/ArtistDetail';
import FormModal from '../../components/ui/FormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingState from '../../components/ui/LoadingState';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import Field from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import Tag from '../../components/ui/Tag';
import { RowCard } from '../../components/ui/Card';
import { Page, PageTitle, TopBar } from '../../components/ui/PageLayout';
import { FormErrors, hasErrors, requiredFieldErrors, withoutError } from '../../utils/formErrors';

interface TourForm {
  name: string;
  stagePlot: string;
  channelList: string;
}

const emptyForm: TourForm = { name: '', stagePlot: '', channelList: '' };

const Tours: React.FC = () => {
  const { showError } = useToast();
  const { t } = useTranslation();
  const user = useRequiredUser();
  const [tours, setTours] = useState<Tour[]>([]);
  // Numero di artisti per tour, caricato dopo i tour (solo informativo)
  const [artistCounts, setArtistCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { tourId, artistId } = useParams();
  const navigate = useNavigate();

  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [tourToEdit, setTourToEdit] = useState<Tour | null>(null);
  const [form, setForm] = useState<TourForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors<TourForm>>({});
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

  // Numero di artisti di ogni tour, solo quando l'elenco è visibile.
  // Se un conteggio fallisce la card resta senza numero di artisti.
  useEffect(() => {
    if (tourId || tours.length === 0) return;
    let cancelled = false;

    Promise.all(tours.map(tour =>
      tourArtistsService.countTourArtists(tour.id).then(count => [tour.id, count] as const, () => null)
    )).then(counts => {
      if (!cancelled) setArtistCounts(Object.fromEntries(counts.filter(entry => entry !== null)));
    });
    return () => {
      cancelled = true;
    };
  }, [tours, tourId]);

  const openAddModal = () => {
    setTourToEdit(null);
    setForm(emptyForm);
    setErrors({});
    setIsTourModalOpen(true);
  };

  const openEditModal = (tour: Tour) => {
    setTourToEdit(tour);
    setForm({ name: tour.name, stagePlot: tour.stagePlot || '', channelList: tour.channelList || '' });
    setErrors({});
    setIsTourModalOpen(true);
  };

  const closeModal = () => {
    setIsTourModalOpen(false);
    setTourToEdit(null);
  };

  const updateField = (field: keyof TourForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => withoutError(current, field));
  };

  const handleSaveTour = async () => {
    const validation = requiredFieldErrors(form, { name: 'tours.nameRequired' });
    if (hasErrors(validation)) {
      setErrors(validation);
      return;
    }

    try {
      const details = {
        name: form.name.trim(),
        stagePlot: form.stagePlot.trim(),
        channelList: form.channelList.trim()
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

  // Se è selezionato un artista, mostra il dettaglio dell'artista
  if (tourId && artistId) {
    return <ArtistDetail tourId={tourId} artistId={artistId} onBack={() => navigate(`/tours/${tourId}`)} />;
  }

  // Se è selezionato un tour, mostra il dettaglio
  if (tourId) {
    return <TourDetail tourId={tourId} onBack={() => navigate('/tours')} />;
  }

  // Cosa contiene il tour, es. "4 artisti · Stage Plot · Channel List"
  const tourMeta = (tour: Tour) => {
    const parts = [
      artistCounts[tour.id] !== undefined ? t('tours.artistCount', { count: artistCounts[tour.id] }) : null,
      tour.stagePlot ? t('tourDetail.stagePlot') : null,
      tour.channelList ? t('tourDetail.channelList') : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  return (
    <Page>
      <TopBar back={{ label: t('nav.home'), onClick: () => navigate('/home') }} />

      <PageTitle
        title={t('tours.title')}
        subtitle={loading ? undefined : t('tours.subtitle', { count: tours.length })}
        primaryAction={
          <Button variant="primary" icon={faPlus} className="bt-btn-lg" onClick={openAddModal}>
            {t('tours.add')}
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : (
        <ul className="bt-stack">
          {tours.map(tour => {
            const isOwner = tour.ownerId === user.uid;
            return (
              <li key={tour.id}>
                <RowCard
                  to={`/tours/${tour.id}`}
                  title={tour.name}
                  meta={tourMeta(tour)}
                  leading={<FontAwesomeIcon icon={faRoute} />}
                  trailing={
                    <>
                      <Tag tone={isOwner ? 'neutral' : 'outline'}>{t(isOwner ? 'tours.owner' : 'tours.crew')}</Tag>
                      {isOwner && (
                        <>
                          <IconButton
                            icon={faPen}
                            label={t('tours.editLabel', { name: tour.name })}
                            onClick={() => openEditModal(tour)}
                          />
                          <IconButton
                            icon={faTrashCan}
                            danger
                            label={t('tours.deleteLabel', { name: tour.name })}
                            onClick={() => setTourToDelete(tour.id)}
                          />
                        </>
                      )}
                    </>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <FormModal
        open={isTourModalOpen}
        title={t(tourToEdit ? 'tours.editTitle' : 'tours.addTitle')}
        submitLabel={t(tourToEdit ? 'common.saveChanges' : 'common.add')}
        onSubmit={handleSaveTour}
        onClose={closeModal}
      >
        <Field label={t('tours.nameField')} error={errors.name && t(errors.name)}>
          <Input
            value={form.name}
            onChange={e => updateField('name', e.target.value)}
            placeholder={t('tours.namePlaceholder')}
            autoFocus
          />
        </Field>
        <Field label={t('tours.stagePlotField')}>
          <Input
            type="url"
            value={form.stagePlot}
            onChange={e => updateField('stagePlot', e.target.value)}
            placeholder={t('tours.urlPlaceholder')}
          />
        </Field>
        <Field label={t('tours.channelListField')}>
          <Input
            type="url"
            value={form.channelList}
            onChange={e => updateField('channelList', e.target.value)}
            placeholder={t('tours.urlPlaceholder')}
          />
        </Field>
      </FormModal>

      <ConfirmDialog
        open={tourToDelete !== null}
        message={t('tours.deleteConfirm')}
        onConfirm={handleDeleteTour}
        onCancel={() => setTourToDelete(null)}
      />
    </Page>
  );
};

export default Tours;
