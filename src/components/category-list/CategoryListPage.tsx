import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronDown, faEdit, faPlus, faRotateLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import './CategoryListPage.scss';
import { useToast } from '../../hooks/useToast';
import type { CategoryListService, ItemCategory } from '../../services/categoryList.service';
import { ListItem, moveItemById, NewItem, updateAllItems, updateItemById } from '../../utils/categoryItems';
import FormModal from '../ui/FormModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import LoadingState from '../ui/LoadingState';
import FloatingAddButton from '../ui/FloatingAddButton';
import type { CategoryListLabels, ItemType, ResetAction } from './types';

interface CategoryListPageProps<TItem extends ListItem, TForm> {
  service: CategoryListService<TItem>;
  itemType: ItemType<TItem, TForm>;
  labels: CategoryListLabels;
  // Riga sotto il titolo, es. il nome dell'artista
  subtitle?: string;
  // Pulsante "indietro" sopra il titolo
  back?: { label: string; onClick: () => void };
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
  subtitle,
  back,
  resetAction,
  categoryBadge,
}: CategoryListPageProps<TItem, TForm>) {
  const { showError } = useToast();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ItemCategory<TItem>[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Modale categoria: null = chiusa, category null = nuova categoria
  const [categoryModal, setCategoryModal] = useState<{ category: ItemCategory<TItem> | null } | null>(null);
  const [categoryTitle, setCategoryTitle] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<ItemCategory<TItem> | null>(null);

  // Modale elemento: null = chiusa, item null = nuovo elemento
  const [itemModal, setItemModal] = useState<{ categoryId: string; item: TItem | null } | null>(null);
  const [itemForm, setItemForm] = useState<TForm>(itemType.emptyForm);
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
    setCategoryModal({ category });
  };

  const handleSaveCategory = async () => {
    if (!categoryModal) return;

    const title = categoryTitle.trim();
    if (!title) {
      showError(t('lists.categoryNameRequired'));
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
    setItemModal({ categoryId, item });
  };

  const handleSaveItem = async () => {
    if (!itemModal) return;

    const validationError = itemType.validate(itemForm);
    if (validationError) {
      showError(t(validationError));
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

  const filteredCategories = categories.filter(category =>
    category.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  if (loading) {
    return (
      <div className="cl-page">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="cl-page">
      <div className="cl-container">
        {back && (
          <button type="button" className="cl-back" onClick={back.onClick}>
            <FontAwesomeIcon icon={faArrowLeft} /> {back.label}
          </button>
        )}
        <h1 className="cl-title">{labels.pageTitle}</h1>
        {subtitle && <p className="cl-subtitle">{subtitle}</p>}
        <div className="cl-search">
          <input
            type="text"
            placeholder={t('lists.searchCategory')}
            aria-label={t('lists.searchCategory')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {resetAction && (
          <button
            type="button"
            className="cl-reset-all"
            onClick={() => setResetTarget({ categoryId: null })}
            disabled={!categories.some(needsReset)}
          >
            <FontAwesomeIcon icon={faRotateLeft} /> {resetAction.allLabel}
          </button>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <ul className="cl-categories">
            {filteredCategories.map(category => {
              const isOpen = expandedIds.has(category.id);
              const badge = categoryBadge?.(category.items);

              return (
                <li key={category.id}>
                  <div className="cl-category-header">
                    <button
                      type="button"
                      className="cl-category-toggle"
                      onClick={() => toggleExpanded(category.id)}
                      aria-expanded={isOpen}
                    >
                      <span>{category.title}</span>
                      {badge && <span className="cl-category-badge">{badge}</span>}
                      <FontAwesomeIcon icon={faChevronDown} className={`cl-chevron ${isOpen ? 'cl-chevron--open' : ''}`} />
                    </button>
                    <div className="cl-category-actions">
                      {resetAction && (
                        <button
                          type="button"
                          className="cl-icon-button"
                          onClick={() => setResetTarget({ categoryId: category.id })}
                          disabled={!needsReset(category)}
                          title={resetAction.categoryLabel(category.title)}
                          aria-label={resetAction.categoryLabel(category.title)}
                        >
                          <FontAwesomeIcon icon={faRotateLeft} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="cl-icon-button"
                        onClick={() => openCategoryModal(category)}
                        title={t('lists.editCategoryTitle')}
                        aria-label={t('lists.editCategoryLabel', { title: category.title })}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        type="button"
                        className="cl-icon-button cl-icon-button--danger"
                        onClick={() => setCategoryToDelete(category)}
                        title={t('common.delete')}
                        aria-label={t('lists.deleteCategoryLabel', { title: category.title })}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="cl-category-content">
                      {category.items.length === 0 && <span className="cl-empty">{labels.emptyCategory}</span>}

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
                                    <div className="cl-item-main">
                                      {itemType.renderContent(item, {
                                        update: updates => handleQuickUpdate(category.id, item.id, updates),
                                      })}
                                    </div>
                                    <div className="cl-item-actions">
                                      <button
                                        type="button"
                                        className="cl-icon-button"
                                        onClick={() => openItemModal(category.id, item)}
                                        title={labels.editItem}
                                        aria-label={labels.editItem}
                                      >
                                        <FontAwesomeIcon icon={faEdit} />
                                      </button>
                                      <button
                                        type="button"
                                        className="cl-icon-button cl-icon-button--danger"
                                        onClick={() => setItemToDelete({ categoryId: category.id, itemId: item.id })}
                                        title={t('common.delete')}
                                        aria-label={t('common.delete')}
                                      >
                                        <FontAwesomeIcon icon={faTrash} />
                                      </button>
                                    </div>
                                  </li>
                                )}
                              </Draggable>
                            ))}
                            {droppable.placeholder}
                          </ul>
                        )}
                      </Droppable>

                      <button type="button" className="cl-add-item" onClick={() => openItemModal(category.id, null)}>
                        <FontAwesomeIcon icon={faPlus} /> {labels.addItem}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </DragDropContext>

        <FloatingAddButton label={t('lists.addCategory')} onClick={() => openCategoryModal(null)} />
      </div>

      <FormModal
        open={categoryModal !== null}
        title={t(categoryModal?.category ? 'lists.editCategoryTitle' : 'lists.addCategoryTitle')}
        submitLabel={t(categoryModal?.category ? 'common.save' : 'common.add')}
        onSubmit={handleSaveCategory}
        onClose={() => setCategoryModal(null)}
      >
        <label>
          {t('lists.categoryName')}
          <input type="text" value={categoryTitle} onChange={e => setCategoryTitle(e.target.value)} autoFocus />
        </label>
      </FormModal>

      <FormModal
        open={itemModal !== null}
        title={itemModal?.item ? labels.editItem : labels.addItem}
        submitLabel={t(itemModal?.item ? 'common.saveChanges' : 'common.add')}
        onSubmit={handleSaveItem}
        onClose={() => setItemModal(null)}
      >
        {itemType.renderFields(itemForm, setItemForm)}
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
    </div>
  );
}

export default CategoryListPage;
