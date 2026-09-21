import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { faLayerGroup, faWrench } from '@fortawesome/free-solid-svg-icons';
import TourOverview, { ArtistListsContext } from '../../../components/tour-overview/TourOverview';
import ArtistListBlock from '../../../components/tour-overview/ArtistListBlock';
import { consumableItemType, inventoryItemType } from '../../../components/category-list/itemTypes';
import { artistConsumablesService, artistSpareService } from '../../../services/artistLists.service';
import type { ConsumableItem } from '../../../services/categoryList.service';
import { consumableStats, inventoryStats, ListStats } from '../../../utils/tourOverview';

// Spare e consumabili degli artisti di tutti i tour, in due blocchi distinti per artista
const MyInventoryTour: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const spareLabels = {
    pageTitle: t('artistLists.spare.title'),
    addItem: t('artistLists.spare.addItem'),
    editItem: t('artistLists.spare.editItem'),
    deleteItemConfirm: t('artistLists.spare.deleteItemConfirm'),
    emptyCategory: t('artistLists.spare.emptyCategory'),
  };

  const consumableLabels = {
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

  // Del tour interessa solo quanto c'è da ricomprare
  const tourBadge = ({ restock }: ListStats) =>
    restock > 0 ? t('consumableItem.restockBadge', { count: restock }) : null;

  const renderLists = ({ tourId, artistId, onStats }: ArtistListsContext) => (
    <>
      <ArtistListBlock
        tourId={tourId}
        artistId={artistId}
        listKey="spare"
        createService={artistSpareService.forArtist}
        itemType={inventoryItemType}
        labels={spareLabels}
        statsOf={inventoryStats}
        onStats={onStats}
        heading={{ title: t('inventoryTour.spare'), icon: faWrench }}
      />
      <ArtistListBlock
        tourId={tourId}
        artistId={artistId}
        listKey="consumables"
        createService={artistConsumablesService.forArtist}
        itemType={consumableItemType}
        labels={consumableLabels}
        categoryBadge={restockBadge}
        statsOf={consumableStats}
        onStats={onStats}
        heading={{ title: t('inventoryTour.consumables'), icon: faLayerGroup }}
      />
    </>
  );

  return (
    <TourOverview
      title={t('inventoryTour.title')}
      subtitle={t('inventoryTour.subtitle')}
      back={{ label: t('nav.inventory'), onClick: () => navigate('/my-inventory') }}
      tourBadge={tourBadge}
      renderLists={renderLists}
    />
  );
};

export default MyInventoryTour;
