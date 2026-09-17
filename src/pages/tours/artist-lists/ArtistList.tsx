import React, { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CategoryListPage from '../../../components/category-list/CategoryListPage';
import { checklistItemType, consumableItemType, inventoryItemType } from '../../../components/category-list/itemTypes';
import LoadingState from '../../../components/ui/LoadingState';
import { BackLink, Page, TopBar } from '../../../components/ui/PageLayout';
import {
  artistCheckBeforeShowService,
  artistConsumablesService,
  artistSpareService,
  artistToDoService,
} from '../../../services/artistLists.service';
import type { ConsumableItem } from '../../../services/categoryList.service';
import type { ArtistListKey } from '../../../services/tours.service';
import { artistListKeyFromPath, artistPath } from './artistListPaths';
import { useTourArtist } from '../useTourArtist';

interface ListProps {
  tourId: string;
  artistId: string;
  // Artista e ruolo, mostrati sopra il titolo
  kicker: string;
  back: BackLink;
}

const SpareList: React.FC<ListProps> = ({ tourId, artistId, ...header }) => {
  const { t } = useTranslation();
  const service = useMemo(() => artistSpareService.forArtist(tourId, artistId), [tourId, artistId]);

  const labels = {
    pageTitle: t('artistLists.spare.title'),
    addItem: t('artistLists.spare.addItem'),
    editItem: t('artistLists.spare.editItem'),
    deleteItemConfirm: t('artistLists.spare.deleteItemConfirm'),
    emptyCategory: t('artistLists.spare.emptyCategory'),
  };

  return <CategoryListPage service={service} itemType={inventoryItemType} labels={labels} {...header} />;
};

const ToDoList: React.FC<ListProps> = ({ tourId, artistId, ...header }) => {
  const { t } = useTranslation();
  const service = useMemo(() => artistToDoService.forArtist(tourId, artistId), [tourId, artistId]);
  const itemType = useMemo(() => checklistItemType(t('artistLists.toDo.completedLabel')), [t]);

  const labels = {
    pageTitle: t('artistLists.toDo.title'),
    addItem: t('artistLists.toDo.addItem'),
    editItem: t('artistLists.toDo.editItem'),
    deleteItemConfirm: t('artistLists.toDo.deleteItemConfirm'),
    emptyCategory: t('artistLists.toDo.emptyCategory'),
  };

  return <CategoryListPage service={service} itemType={itemType} labels={labels} {...header} />;
};

const ConsumablesList: React.FC<ListProps> = ({ tourId, artistId, ...header }) => {
  const { t } = useTranslation();
  const service = useMemo(() => artistConsumablesService.forArtist(tourId, artistId), [tourId, artistId]);

  const labels = {
    pageTitle: t('artistLists.consumables.title'),
    addItem: t('artistLists.consumables.addItem'),
    editItem: t('artistLists.consumables.editItem'),
    deleteItemConfirm: t('artistLists.consumables.deleteItemConfirm'),
    emptyCategory: t('artistLists.consumables.emptyCategory'),
  };

  // Numero di consumabili da ricomprare, visibile anche a categoria chiusa
  const restockBadge = (items: ConsumableItem[]) => {
    const count = items.filter(item => item.toRestock).length;
    return count > 0 ? t('consumableItem.restockBadge', { count }) : null;
  };

  return (
    <CategoryListPage
      service={service}
      itemType={consumableItemType}
      labels={labels}
      categoryBadge={restockBadge}
      {...header}
    />
  );
};

const CheckBeforeShowList: React.FC<ListProps> = ({ tourId, artistId, ...header }) => {
  const { t } = useTranslation();
  const service = useMemo(() => artistCheckBeforeShowService.forArtist(tourId, artistId), [tourId, artistId]);
  const itemType = useMemo(() => checklistItemType(t('artistLists.checkBeforeShow.completedLabel')), [t]);

  const labels = {
    pageTitle: t('artistLists.checkBeforeShow.title'),
    addItem: t('artistLists.checkBeforeShow.addItem'),
    editItem: t('artistLists.checkBeforeShow.editItem'),
    deleteItemConfirm: t('artistLists.checkBeforeShow.deleteItemConfirm'),
    emptyCategory: t('artistLists.checkBeforeShow.emptyCategory'),
  };

  // Le spunte vanno tolte prima di ogni show
  const resetAction = {
    updates: { completed: false },
    needsReset: (item: { completed: boolean }) => item.completed,
    allLabel: t('artistLists.checkBeforeShow.resetAll'),
    categoryLabel: (title: string) => t('artistLists.checkBeforeShow.resetCategory', { title }),
    allConfirm: t('artistLists.checkBeforeShow.resetAllConfirm'),
    categoryConfirm: t('artistLists.checkBeforeShow.resetCategoryConfirm'),
  };

  return <CategoryListPage service={service} itemType={itemType} labels={labels} resetAction={resetAction} {...header} />;
};

const LISTS: Record<ArtistListKey, React.FC<ListProps>> = {
  spare: SpareList,
  toDo: ToDoList,
  consumables: ConsumablesList,
  checkBeforeShow: CheckBeforeShowList,
};

// Pagina di una lista dell'artista: /tours/:tourId/artists/:artistId/lists/:listPath
const ArtistList: React.FC = () => {
  const { tourId, artistId, listPath } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { artist, loading } = useTourArtist(tourId, artistId);

  const listKey = artistListKeyFromPath(listPath);

  if (!tourId || !artistId) {
    return <Navigate to="/tours" replace />;
  }

  if (!listKey) {
    return <Navigate to={artistPath(tourId, artistId)} replace />;
  }

  if (loading || !artist) {
    return (
      <Page>
        <TopBar back={{ label: t('nav.tours'), onClick: () => navigate(`/tours/${tourId}`) }} />
        {loading ? <LoadingState /> : <p className="bt-empty">{t('artistDetail.notFound')}</p>}
      </Page>
    );
  }

  const List = LISTS[listKey];

  return (
    <List
      tourId={tourId}
      artistId={artistId}
      kicker={`${artist.name} · ${artist.role}`}
      back={{ label: artist.name, onClick: () => navigate(artistPath(tourId, artistId)) }}
    />
  );
};

export default ArtistList;
