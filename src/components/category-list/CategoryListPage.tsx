import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCaretDown,
  faCaretRight,
  faGripVertical,
  faPen,
  faPlus,
  faRotateLeft,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../../hooks/useToast';
import { MOBILE_MEDIA_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import type { CategoryListService, ItemCategory } from '../../services/categoryList.service';
import {
  categoryProgress,
  ListItem,
  moveItemById,
  NewItem,
  updateAllItems,
  updateItemById,
} from '../../utils/categoryItems';
import { FormErrors, hasErrors, withoutError } from '../../utils/formErrors';
import FormModal from '../ui/FormModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import LoadingState from '../ui/LoadingState';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Field from '../ui/Field';
import { Input } from '../ui/Input';
import SearchInput from '../ui/SearchInput';
import Tag from '../ui/Tag';
import { BackLink, Page, PageTitle, TopBar } from '../ui/PageLayout';
import type { CategoryListLabels, ItemType, ResetAction } from './types';
import './CategoryListPage.scss';

interface CategoryListPageProps<TItem extends ListItem, TForm> {
  service: CategoryListService<TItem>;
  itemType: ItemType<TItem, TForm>;
  labels: CategoryListLabels;
  // Pulsante "indietro", con il nome della pagina di provenienza
  back: BackLink;
  // Contesto sopra il titolo, es. "Davide Muti · Batteria"
  kicker?: string;
  // Pulsanti per azzerare gli elementi (es. togliere le spunte)
  resetAction?: ResetAction<TItem>;
  // Indicazione accanto al titolo della categoria, visibile anche a categoria chiusa (es. "2 da ricomprare")
  categoryBadge?: (items: TItem[]) => string | null;
}

interface ItemRef {
  categoryId: string;
  itemId: string;
}

// Pagina generica "categorie a fisarmonica con elementi riordinabili":
// usata da To Do, To Buy, Inventario e liste degli artisti, cambiando solo servizio, tipo di elemento e testi.
function CategoryListPage<TItem extends ListItem, TForm>({
  service,
  itemType,
  labels,
  back,
  kicker,
  resetAction,
  categoryBadge,
}: CategoryListPageProps<TItem, TForm>) {
  const { showError } = useToast();
  const { t } = useTranslation();
  const mobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const [categories, setCategories] = useState<ItemCategory<TItem>[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Modale categoria: null = chiusa, category null = nuova categoria
  const [categoryModal, setCategoryModal] = useState<{ category: ItemCategory<TItem> | null } | null>(null);
  const [categoryTitle, setCategoryTitle] = useState('');
  const [categoryTitleError, setCategoryTitleError] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ItemCategory<TItem> | null>(null);

  // Modale elemento: null = chiusa, item null = nuovo elemento
  const [itemModal, setItemModal] = useState<{ categoryId: string; item: TItem | null } | null>(null);
  const [itemForm, setItemForm] = useState<TForm>(itemType.emptyForm);
  const [itemErrors, setItemErrors] = useState<FormErrors<TForm>>({});
  const [itemToDelete, setItemToDelete] = useState<ItemRef | null>(null);

  // Conferma azzeramento: null = chiusa, categoryId null = tutte le categorie
  const [resetTarget, setResetTarget] = useState<{ categoryId: string | null } | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await service.getCategories());
    } catch (error) {
      console.error('Errore nel caricamento delle categorie:', error);
      showError(t('lists.loadError'));
    }
  }, [service, showError, t]);

  useEffect(() => {
    loadCategories().finally(() => setLoading(false));
  }, [loadCategories]);

  const replaceItems = (categoryId: string, change: (items: TItem[]) => TItem[]) => {
    setCategories(current => current.map(category =>
      category.id === categoryId ? { ...category, items: change(category.items) } : category
    ));
  };

  /**
   * Esegue una modifica agli elementi. Con `optimistic` la UI si aggiorna subito
   * (spunte, drag & drop); in ogni caso alla fine vale la lista restituita dal server.
   * In caso di errore ricarica i dati per annullare la modifica ottimistica.
   */
  const changeItems = async (
    categoryId: string,
    request: () => Promise<TItem[]>,
    errorMessage: string,
    optimistic?: (items: TItem[]) => TItem[]
  ): Promise<boolean> => {
    if (optimistic) {
      replaceItems(categoryId, items => {
        try {
          return optimistic(items);
        } catch {
          return items;
        }
      });
    }

    try {
      const items = await request();
      replaceItems(categoryId, () => items);
      return true;
    } catch (error) {
      console.error(errorMessage, error);
      showError(errorMessage);
      if (optimistic) await loadCategories();
      return false;
    }
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedIds(current => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // --- Categorie ---

  const openCategoryModal = (category: ItemCategory<TItem> | null) => {
    setCategoryTitle(category?.title ?? '');
    setCategoryTitleError(false);
    setCategoryModal({ category });
  };

  const handleSaveCategory = async () => {
    if (!categoryModal) return;

    const title = categoryTitle.trim();
    if (!title) {
      setCategoryTitleError(true);
      return;
    }

    try {
      const { category } = categoryModal;
      if (category) {
        await service.renameCategory(category.id, title);
        setCategories(current => current.map(c => (c.id === category.id ? { ...c, title } : c)));
      } else {
        const created = await service.addCategory(title);
        setCategories(current => [...current, created]);
        setExpandedIds(current => new Set(current).add(created.id));
      }
      setCategoryModal(null);
    } catch (error) {
      console.error('Errore nel salvare la categoria:', error);
      showError(t('lists.saveCategoryError'));
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await service.deleteCategory(categoryToDelete.id);
      setCategories(current => current.filter(c => c.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Errore nell\'eliminazione della categoria:', error);
      showError(t('lists.deleteCategoryError'));
    }
  };

  // --- Elementi ---

  const openItemModal = (categoryId: string, item: TItem | null) => {
    setItemForm(item ? itemType.toForm(item) : itemType.emptyForm);
    setItemErrors({});
    setItemModal({ categoryId, item });
  };

  // Modificando un campo sparisce il suo errore
  const changeItemForm = (form: TForm) => {
    setItemErrors(current => (Object.keys(current) as (keyof TForm)[]).reduce(
      (errors, field) => (form[field] !== itemForm[field] ? withoutError(errors, field) : errors),
      current
    ));
    setItemForm(form);
  };

  const handleSaveItem = async () => {
    if (!itemModal) return;

    const validation = itemType.validate(itemForm);
    if (hasErrors(validation)) {
      setItemErrors(validation);
      return;
    }

    const { categoryId, item } = itemModal;
    const data = itemType.toData(itemForm);
    const saved = await changeItems(
      categoryId,
      () => (item ? service.updateItem(categoryId, item.id, data) : service.addItem(categoryId, data)),
      t('lists.saveItemError')
    );
    if (saved) setItemModal(null);
  };

  const handleQuickUpdate = (categoryId: string, itemId: string, updates: Partial<NewItem<TItem>>) => {
    changeItems(
      categoryId,
      () => service.updateItem(categoryId, itemId, updates),
      t('lists.updateItemError'),
      items => updateItemById(items, itemId, updates)
    );
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    const { categoryId, itemId } = itemToDelete;
    const deleted = await changeItems(
      categoryId,
      () => service.deleteItem(categoryId, itemId),
      t('lists.deleteItemError')
    );
    if (deleted) setItemToDelete(null);
  };

  const handleDragEnd = ({ source, destination, draggableId }: DropResult) => {
    // Il riordino è possibile solo all'interno della stessa categoria
    if (!destination || destination.droppableId !== source.droppableId || destination.index === source.index) {
      return;
    }

    const categoryId = source.droppableId;
    const itemId = draggableId.slice(categoryId.length + 1);
    changeItems(
      categoryId,
      () => service.moveItem(categoryId, itemId, destination.index),
      t('lists.reorderError'),
      items => moveItemById(items, itemId, destination.index)
    );
  };

  const needsReset = (category: ItemCategory<TItem>) =>
    resetAction !== undefined && category.items.some(resetAction.needsReset);

  const handleReset = async () => {
    if (!resetAction || !resetTarget) return;

    const targets = categories.filter(category =>
      needsReset(category) && (resetTarget.categoryId === null || category.id === resetTarget.categoryId)
    );
    setResetTarget(null);

    await Promise.all(targets.map(category =>
      changeItems(
        category.id,
        () => service.updateAllItems(category.id, resetAction.updates),
        t('lists.resetError'),
        items => updateAllItems(items, resetAction.updates)
      )
    ));
  };

  // Etichetta di avanzamento delle categorie con spunte, es. "1 di 3 fatti"
  const progressTag = (items: TItem[]) => {
    if (!itemType.isCompleted) return null;
    const progress = categoryProgress(items, itemType.isCompleted);
    switch (progress.status) {
      case 'empty':
        return null;
      case 'open':
        return <Tag tone="outline">{t('lists.progressOpen', { count: progress.count })}</Tag>;
      case 'partial':
        return (
          <Tag tone="outline">
            {t(mobile ? 'lists.progressShort' : 'lists.progressDone', { done: progress.done, total: progress.total })}
          </Tag>
        );
      case 'done':
        return <Tag tone="neutral">{t('lists.progressAllDone')}</Tag>;
    }
  };

  const filteredCategories = categories.filter(category =>
    category.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const resetAllButton = resetAction && (
    <Button
      icon={faRotateLeft}
      block={mobile}
      className="bt-btn-md cl-reset-all"
      onClick={() => setResetTarget({ categoryId: null })}
      disabled={!categories.some(needsReset)}
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
          <Button variant="primary" icon={faPlus} className="bt-btn-md" onClick={() => openCategoryModal(null)}>
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

      {loading ? (
        <LoadingState />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <ul className="cl-categories">
            {filteredCategories.map(category => {
              const isOpen = expandedIds.has(category.id);
              const badge = categoryBadge?.(category.items);

              return (
                <li key={category.id} className="card elev-sm cl-category">
                  <div className="cl-category-header">
                    <button
                      type="button"
                      className="cl-category-toggle"
                      onClick={() => toggleExpanded(category.id)}
                      aria-expanded={isOpen}
                    >
                      <FontAwesomeIcon
                        icon={isOpen ? faCaretDown : faCaretRight}
                        className={`cl-caret ${isOpen ? 'cl-caret--open' : ''}`}
                        aria-hidden="true"
                      />
                      <span className="cl-category-title">{category.title}</span>
                    </button>
                    <div className="cl-category-tags">
                      {progressTag(category.items)}
                      {badge && <Tag tone="outline">{badge}</Tag>}
                    </div>
                    <div className="cl-category-actions">
                      {resetAction && (
                        <IconButton
                          icon={faRotateLeft}
                          onClick={() => setResetTarget({ categoryId: category.id })}
                          disabled={!needsReset(category)}
                          label={resetAction.categoryLabel(category.title)}
                        />
                      )}
                      <IconButton
                        icon={faPen}
                        onClick={() => openCategoryModal(category)}
                        label={t('lists.editCategoryLabel', { title: category.title })}
                      />
                      <IconButton
                        icon={faTrashCan}
                        danger
                        onClick={() => setCategoryToDelete(category)}
                        label={t('lists.deleteCategoryLabel', { title: category.title })}
                      />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="cl-category-content">
                      {category.items.length === 0 && <p className="bt-empty cl-empty">{labels.emptyCategory}</p>}

                      <Droppable droppableId={category.id}>
                        {droppable => (
                          <ul className="cl-items" ref={droppable.innerRef} {...droppable.droppableProps}>
                            {category.items.map((item, index) => (
                              <Draggable key={item.id} draggableId={`${category.id}:${item.id}`} index={index}>
                                {(draggable, snapshot) => (
                                  <li
                                    ref={draggable.innerRef}
                                    {...draggable.draggableProps}
                                    {...draggable.dragHandleProps}
                                    className={`cl-item ${snapshot.isDragging ? 'cl-item--dragging' : ''}`}
                                  >
                                    <FontAwesomeIcon icon={faGripVertical} className="cl-grip" aria-hidden="true" />
                                    <div className="cl-item-main">
                                      {itemType.renderContent(item, {
                                        update: updates => handleQuickUpdate(category.id, item.id, updates),
                                      })}
                                    </div>
                                    <div className="cl-item-actions">
                                      <IconButton
                                        icon={faPen}
                                        variant="ghost"
                                        onClick={() => openItemModal(category.id, item)}
                                        label={labels.editItem}
                                      />
                                      <IconButton
                                        icon={faTrashCan}
                                        variant="ghost"
                                        danger
                                        onClick={() => setItemToDelete({ categoryId: category.id, itemId: item.id })}
                                        label={t('common.delete')}
                                      />
                                    </div>
                                  </li>
                                )}
                              </Draggable>
                            ))}
                            {droppable.placeholder}
                          </ul>
                        )}
                      </Droppable>

                      <Button variant="ghost" icon={faPlus} className="cl-add-item" onClick={() => openItemModal(category.id, null)}>
                        {labels.addItem}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </DragDropContext>
      )}

      <FormModal
        open={categoryModal !== null}
        title={t(categoryModal?.category ? 'lists.editCategoryTitle' : 'lists.addCategoryTitle')}
        submitLabel={t(categoryModal?.category ? 'common.save' : 'common.add')}
        onSubmit={handleSaveCategory}
        onClose={() => setCategoryModal(null)}
      >
        <Field label={t('lists.categoryName')} error={categoryTitleError ? t('lists.categoryNameRequired') : null}>
          <Input
            value={categoryTitle}
            onChange={e => {
              setCategoryTitle(e.target.value);
              setCategoryTitleError(false);
            }}
            autoFocus
          />
        </Field>
      </FormModal>

      <FormModal
        open={itemModal !== null}
        title={itemModal?.item ? labels.editItem : labels.addItem}
        submitLabel={t(itemModal?.item ? 'common.saveChanges' : 'common.add')}
        onSubmit={handleSaveItem}
        onClose={() => setItemModal(null)}
      >
        {itemType.renderFields(itemForm, changeItemForm, itemErrors)}
      </FormModal>

      <ConfirmDialog
        open={categoryToDelete !== null}
        message={t('lists.deleteCategoryConfirm')}
        onConfirm={handleDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />

      <ConfirmDialog
        open={itemToDelete !== null}
        message={labels.deleteItemConfirm}
        onConfirm={handleDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />

      {resetAction && (
        <ConfirmDialog
          open={resetTarget !== null}
          message={resetTarget?.categoryId ? resetAction.categoryConfirm : resetAction.allConfirm}
          onConfirm={handleReset}
          onCancel={() => setResetTarget(null)}
        />
      )}
    </Page>
  );
}

export default CategoryListPage;
