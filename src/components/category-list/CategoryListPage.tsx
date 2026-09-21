import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { faPlus, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { MOBILE_MEDIA_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import { ListItem } from '../../utils/categoryItems';
import Button from '../ui/Button';
import SearchInput from '../ui/SearchInput';
import { BackLink, Page, PageTitle, TopBar } from '../ui/PageLayout';
import { CategoryListView } from './CategoryList';
import { CategoryListOptions, useCategoryList } from './useCategoryList';
import './CategoryListPage.scss';

type CategoryListPageProps<TItem extends ListItem, TForm> = CategoryListOptions<TItem, TForm> & {
  // Pulsante "indietro", con il nome della pagina di provenienza
  back: BackLink;
  // Contesto sopra il titolo, es. "Davide Muti · Batteria"
  kicker?: string;
};

// Pagina "categorie a fisarmonica con elementi riordinabili":
// usata da To Do, To Buy, Inventario e liste degli artisti, cambiando solo servizio, tipo di elemento e testi.
function CategoryListPage<TItem extends ListItem, TForm>({
  back,
  kicker,
  ...options
}: CategoryListPageProps<TItem, TForm>) {
  const { t } = useTranslation();
  const mobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const [searchTerm, setSearchTerm] = useState('');
  const list = useCategoryList(options);
  const { labels, resetAction } = list.options;

  const resetAllButton = resetAction && (
    <Button
      icon={faRotateLeft}
      block={mobile}
      className="bt-btn-md cl-reset-all"
      onClick={() => list.askReset(null)}
      disabled={!list.canResetAll}
    >
      {resetAction.allLabel}
    </Button>
  );

  return (
    <Page className="cl-page">
      <TopBar back={back} />

      <PageTitle
        title={labels.pageTitle}
        kicker={kicker}
        actions={!mobile && resetAllButton}
        primaryAction={
          <Button variant="primary" icon={faPlus} className="bt-btn-md" onClick={() => list.openCategoryModal(null)}>
            {t('lists.addCategory')}
          </Button>
        }
      />

      <SearchInput
        className="cl-search"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder={t('lists.searchCategory')}
      />
      {mobile && resetAllButton}

      <CategoryListView list={list} filter={searchTerm} />
    </Page>
  );
}

export default CategoryListPage;
