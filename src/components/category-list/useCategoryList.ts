import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DropResult } from '@hello-pangea/dnd';
import { useToast } from '../../hooks/useToast';
import type { CategoryListService, ItemCategory } from '../../services/categoryList.service';
import { ListItem, moveItemById, NewItem, updateAllItems, updateItemById } from '../../utils/categoryItems';
import { FormErrors, hasErrors, withoutError } from '../../utils/formErrors';
import type { CategoryListLabels, ItemType, ResetAction } from './types';

export interface CategoryListOptions<TItem extends ListItem, TForm> {
  service: CategoryListService<TItem>;
  itemType: ItemType<TItem, TForm>;
  labels: CategoryListLabels;
  // Pulsanti per azzerare gli elementi (es. togliere le spunte)
  resetAction?: ResetAction<TItem>;
  // Indicazione accanto al titolo della categoria, visibile anche a categoria chiusa (es. "2 da ricomprare")
  categoryBadge?: (items: TItem[]) => string | null;
  // Avvisa chi usa la lista dei dati correnti (es. i contatori dei tour in Tour Overview)
  onCategoriesChange?: (state: { categories: ItemCategory<TItem>[]; loading: boolean }) => void;
}

export interface ItemRef {
  categoryId: string;
  itemId: string;
}

// Stato e operazioni di una lista di categorie: la vista (CategoryList) ci si limita sopra
export interface CategoryListApi<TItem extends ListItem, TForm> {
  options: CategoryListOptions<TItem, TForm>;
  categories: ItemCategory<TItem>[];
  loading: boolean;
  isExpanded: (categoryId: string) => boolean;
  toggleExpanded: (categoryId: string) => void;

  // Modale categoria: null = chiusa, category null = nuova categoria
  categoryModal: { category: ItemCategory<TItem> | null } | null;
  categoryTitle: string;
  categoryTitleError: boolean;
  openCategoryModal: (category: ItemCategory<TItem> | null) => void;
  closeCategoryModal: () => void;
  changeCategoryTitle: (title: string) => void;
  saveCategory: () => Promise<void>;

  categoryToDelete: ItemCategory<TItem> | null;
  askDeleteCategory: (category: ItemCategory<TItem> | null) => void;
  deleteCategory: () => Promise<void>;

  // Modale elemento: null = chiusa, item null = nuovo elemento
  itemModal: { categoryId: string; item: TItem | null } | null;
  itemForm: TForm;
  itemErrors: FormErrors<TForm>;
  openItemModal: (categoryId: string, item: TItem | null) => void;
  closeItemModal: () => void;
  changeItemForm: (form: TForm) => void;
  saveItem: () => Promise<void>;

  itemToDelete: ItemRef | null;
  askDeleteItem: (item: ItemRef | null) => void;
  deleteItem: () => Promise<void>;

  quickUpdate: (categoryId: string, itemId: string, updates: Partial<NewItem<TItem>>) => void;
  handleDragEnd: (result: DropResult) => void;

  // Azzeramento spunte: null = nessuna conferma aperta, categoryId null = tutte le categorie
  needsReset: (category: ItemCategory<TItem>) => boolean;
  canResetAll: boolean;
  resetTarget: { categoryId: string | null } | null;
  askReset: (categoryId: string | null) => void;
  cancelReset: () => void;
  applyReset: () => Promise<void>;
}

/**
 * Motore di una lista "categorie con elementi": caricamento, CRUD di categorie ed elementi,
 * riordino e aggiornamenti ottimistici. Usato dalla pagina intera (CategoryListPage)
 * e dalle liste annidate delle pagine Tour.
 */
export function useCategoryList<TItem extends ListItem, TForm>(
  options: CategoryListOptions<TItem, TForm>
): CategoryListApi<TItem, TForm> {
  const { service, itemType, labels, resetAction, categoryBadge, onCategoriesChange } = options;
  const { showError } = useToast();
  const { t } = useTranslation();

  const [categories, setCategories] = useState<ItemCategory<TItem>[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [categoryModal, setCategoryModal] = useState<{ category: ItemCategory<TItem> | null } | null>(null);
  const [categoryTitle, setCategoryTitle] = useState('');
  const [categoryTitleError, setCategoryTitleError] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ItemCategory<TItem> | null>(null);

  const [itemModal, setItemModal] = useState<{ categoryId: string; item: TItem | null } | null>(null);
  const [itemForm, setItemForm] = useState<TForm>(itemType.emptyForm);
  const [itemErrors, setItemErrors] = useState<FormErrors<TForm>>({});
  const [itemToDelete, setItemToDelete] = useState<ItemRef | null>(null);

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

  // Il callback può cambiare a ogni render di chi usa la lista: lo teniamo in un ref
  // per avvisare solo quando cambiano davvero i dati
  const notifyRef = useRef(onCategoriesChange);
  useEffect(() => {
    notifyRef.current = onCategoriesChange;
  });
  useEffect(() => {
    notifyRef.current?.({ categories, loading });
  }, [categories, loading]);

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

  const changeCategoryTitle = (title: string) => {
    setCategoryTitle(title);
    setCategoryTitleError(false);
  };

  const saveCategory = async () => {
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

  const deleteCategory = async () => {
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

  const saveItem = async () => {
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

  const quickUpdate = (categoryId: string, itemId: string, updates: Partial<NewItem<TItem>>) => {
    changeItems(
      categoryId,
      () => service.updateItem(categoryId, itemId, updates),
      t('lists.updateItemError'),
      items => updateItemById(items, itemId, updates)
    );
  };

  const deleteItem = async () => {
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

  // --- Azzeramento spunte ---

  const needsReset = (category: ItemCategory<TItem>) =>
    resetAction !== undefined && category.items.some(resetAction.needsReset);

  const applyReset = async () => {
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

  return {
    options: { service, itemType, labels, resetAction, categoryBadge, onCategoriesChange },
    categories,
    loading,
    isExpanded: (categoryId: string) => expandedIds.has(categoryId),
    toggleExpanded,

    categoryModal,
    categoryTitle,
    categoryTitleError,
    openCategoryModal,
    closeCategoryModal: () => setCategoryModal(null),
    changeCategoryTitle,
    saveCategory,

    categoryToDelete,
    askDeleteCategory: setCategoryToDelete,
    deleteCategory,

    itemModal,
    itemForm,
    itemErrors,
    openItemModal,
    closeItemModal: () => setItemModal(null),
    changeItemForm,
    saveItem,

    itemToDelete,
    askDeleteItem: setItemToDelete,
    deleteItem,

    quickUpdate,
    handleDragEnd,

    needsReset,
    canResetAll: categories.some(needsReset),
    resetTarget,
    askReset: (categoryId: string | null) => setResetTarget({ categoryId }),
    cancelReset: () => setResetTarget(null),
    applyReset,
  };
}
