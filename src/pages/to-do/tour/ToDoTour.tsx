import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TourOverview, { ArtistListsContext } from '../../../components/tour-overview/TourOverview';
import ArtistListBlock from '../../../components/tour-overview/ArtistListBlock';
import { checklistItemType } from '../../../components/category-list/itemTypes';
import { artistToDoService } from '../../../services/artistLists.service';
import { progressOf } from '../../../utils/categoryItems';
import { checklistStats, ListStats } from '../../../utils/tourOverview';

// To Do degli artisti di tutti i tour: un tour alla volta, un blocco per artista
const ToDoTour: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const itemType = useMemo(() => checklistItemType(t('artistLists.toDo.completedLabel')), [t]);

  const labels = {
    pageTitle: t('artistLists.toDo.title'),
    addItem: t('artistLists.toDo.addItem'),
    editItem: t('artistLists.toDo.editItem'),
    deleteItemConfirm: t('artistLists.toDo.deleteItemConfirm'),
    emptyCategory: t('artistLists.toDo.emptyCategory'),
  };

  // Avanzamento di tutti i to do del tour, es. "2 di 7 fatti"
  const tourBadge = ({ total, done }: ListStats) => {
    const progress = progressOf(done, total);
    switch (progress.status) {
      case 'empty':
        return null;
      case 'open':
        return t('lists.progressOpen', { count: progress.count });
      case 'partial':
        return t('lists.progressDone', { done: progress.done, total: progress.total });
      case 'done':
        return t('lists.progressAllDone');
    }
  };

  const renderLists = ({ tourId, artistId, onStats }: ArtistListsContext) => (
    <ArtistListBlock
      tourId={tourId}
      artistId={artistId}
      listKey="toDo"
      createService={artistToDoService.forArtist}
      itemType={itemType}
      labels={labels}
      statsOf={checklistStats}
      onStats={onStats}
    />
  );

  return (
    <TourOverview
      title={t('toDoTour.title')}
      subtitle={t('toDoTour.subtitle')}
      back={{ label: t('nav.toDo'), onClick: () => navigate('/to-do') }}
      tourBadge={tourBadge}
      renderLists={renderLists}
    />
  );
};

export default ToDoTour;
