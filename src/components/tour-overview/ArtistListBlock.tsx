import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import CategoryList from '../category-list/CategoryList';
import type { CategoryListLabels, ItemType } from '../category-list/types';
import type { CategoryListService, ItemCategory } from '../../services/categoryList.service';
import type { ListItem } from '../../utils/categoryItems';
import { emptyStats, ListStats } from '../../utils/tourOverview';
import './TourOverview.scss';

interface ArtistListBlockProps<TItem extends ListItem, TForm> {
  tourId: string;
  artistId: string;
  // Chiave della lista dentro l'artista, es. 'spare': distingue i conteggi
  listKey: string;
  /**
   * Costruttore del servizio, es. artistSpareService.forArtist.
   * Deve essere un riferimento stabile: il servizio si crea una volta per artista.
   */
  createService: (tourId: string, artistId: string) => CategoryListService<TItem>;
  itemType: ItemType<TItem, TForm>;
  labels: CategoryListLabels;
  categoryBadge?: (items: TItem[]) => string | null;
  // Conteggi della lista, aggregati dal tour per il tag accanto al nome
  statsOf: (categories: ItemCategory<TItem>[]) => ListStats;
  onStats: (listKey: string, stats: ListStats) => void;
  // Intestazione del blocco, quando un artista ne ha più di uno (Spare / Consumabili)
  heading?: { title: string; icon: IconDefinition };
}

// Una lista modificabile di un artista dentro le pagine Tour: stessa lista della pagina dedicata
function ArtistListBlock<TItem extends ListItem, TForm>({
  tourId,
  artistId,
  listKey,
  createService,
  itemType,
  labels,
  categoryBadge,
  statsOf,
  onStats,
  heading,
}: ArtistListBlockProps<TItem, TForm>) {
  const service = useMemo(() => createService(tourId, artistId), [createService, tourId, artistId]);

  return (
    <section className="tov-list-block">
      {heading && (
        <h4 className="tov-list-heading">
          <FontAwesomeIcon icon={heading.icon} className="tov-list-heading__icon" aria-hidden="true" />
          {heading.title}
        </h4>
      )}
      <CategoryList
        service={service}
        itemType={itemType}
        labels={labels}
        categoryBadge={categoryBadge}
        showAddCategory
        onCategoriesChange={({ categories, loading }) =>
          onStats(listKey, loading ? { ...emptyStats, loading: true } : statsOf(categories))
        }
      />
    </section>
  );
}

export default ArtistListBlock;
