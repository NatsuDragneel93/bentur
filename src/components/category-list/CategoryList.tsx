import { useTranslation } from 'react-i18next';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretRight, faGripVertical, faPen, faPlus, faRotateLeft, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { MOBILE_MEDIA_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import { categoryProgress, ListItem } from '../../utils/categoryItems';
import FormModal from '../ui/FormModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import LoadingState from '../ui/LoadingState';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Field from '../ui/Field';
import { Input } from '../ui/Input';
import Tag from '../ui/Tag';
import { CategoryListApi, CategoryListOptions, useCategoryList } from './useCategoryList';
import './CategoryListPage.scss';

interface CategoryListViewProps<TItem extends ListItem, TForm> {
  list: CategoryListApi<TItem, TForm>;
  // Mostra solo le categorie il cui titolo contiene questo testo
  filter?: string;
  // Pulsante "Aggiungi categoria" in fondo alla lista (nella pagina intera sta invece accanto al titolo)
  showAddCategory?: boolean;
  className?: string;
}

/**
 * Categorie a fisarmonica con elementi riordinabili, modali e conferme.
 * Lo stato sta in useCategoryList, così la pagina intera può usarne i comandi
 * (es. il pulsante "azzera tutte le spunte" accanto al titolo).
 */
export function CategoryListView<TItem extends ListItem, TForm>({
  list,
  filter = '',
  showAddCategory = false,
  className,
}: CategoryListViewProps<TItem, TForm>) {
  const { t } = useTranslation();
  const mobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const { itemType, labels, resetAction, categoryBadge } = list.options;

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

  const filteredCategories = list.categories.filter(category =>
    category.title.toLowerCase().includes(filter.trim().toLowerCase())
  );

  const addCategoryButton = showAddCategory && (
    <Button variant="ghost" icon={faPlus} className="cl-add-category" onClick={() => list.openCategoryModal(null)}>
      {t('lists.addCategory')}
    </Button>
  );

  return (
    <div className={['cl-list', className].filter(Boolean).join(' ')}>
      {list.loading ? (
        <LoadingState />
      ) : (
        <>
          <DragDropContext onDragEnd={list.handleDragEnd}>
            <ul className="cl-categories">
              {filteredCategories.map(category => {
                const isOpen = list.isExpanded(category.id);
                const badge = categoryBadge?.(category.items);

                return (
                  <li key={category.id} className="card elev-sm cl-category">
                    <div className="cl-category-header">
                      <button
                        type="button"
                        className="cl-category-toggle"
                        onClick={() => list.toggleExpanded(category.id)}
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
                            onClick={() => list.askReset(category.id)}
                            disabled={!list.needsReset(category)}
                            label={resetAction.categoryLabel(category.title)}
                          />
                        )}
                        <IconButton
                          icon={faPen}
                          onClick={() => list.openCategoryModal(category)}
                          label={t('lists.editCategoryLabel', { title: category.title })}
                        />
                        <IconButton
                          icon={faTrashCan}
                          danger
                          onClick={() => list.askDeleteCategory(category)}
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
                                          update: updates => list.quickUpdate(category.id, item.id, updates),
                                        })}
                                      </div>
                                      <div className="cl-item-actions">
                                        <IconButton
                                          icon={faPen}
                                          variant="ghost"
                                          onClick={() => list.openItemModal(category.id, item)}
                                          label={labels.editItem}
                                        />
                                        <IconButton
                                          icon={faTrashCan}
                                          variant="ghost"
                                          danger
                                          onClick={() => list.askDeleteItem({ categoryId: category.id, itemId: item.id })}
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

                        <Button
                          variant="ghost"
                          icon={faPlus}
                          className="cl-add-item"
                          onClick={() => list.openItemModal(category.id, null)}
                        >
                          {labels.addItem}
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </DragDropContext>
          {addCategoryButton}
        </>
      )}

      <FormModal
        open={list.categoryModal !== null}
        title={t(list.categoryModal?.category ? 'lists.editCategoryTitle' : 'lists.addCategoryTitle')}
        submitLabel={t(list.categoryModal?.category ? 'common.save' : 'common.add')}
        onSubmit={list.saveCategory}
        onClose={list.closeCategoryModal}
      >
        <Field label={t('lists.categoryName')} error={list.categoryTitleError ? t('lists.categoryNameRequired') : null}>
          <Input value={list.categoryTitle} onChange={e => list.changeCategoryTitle(e.target.value)} autoFocus />
        </Field>
      </FormModal>

      <FormModal
        open={list.itemModal !== null}
        title={list.itemModal?.item ? labels.editItem : labels.addItem}
        submitLabel={t(list.itemModal?.item ? 'common.saveChanges' : 'common.add')}
        onSubmit={list.saveItem}
        onClose={list.closeItemModal}
      >
        {itemType.renderFields(list.itemForm, list.changeItemForm, list.itemErrors)}
      </FormModal>

      <ConfirmDialog
        open={list.categoryToDelete !== null}
        message={t('lists.deleteCategoryConfirm')}
        onConfirm={list.deleteCategory}
        onCancel={() => list.askDeleteCategory(null)}
      />

      <ConfirmDialog
        open={list.itemToDelete !== null}
        message={labels.deleteItemConfirm}
        onConfirm={list.deleteItem}
        onCancel={() => list.askDeleteItem(null)}
      />

      {resetAction && (
        <ConfirmDialog
          open={list.resetTarget !== null}
          message={list.resetTarget?.categoryId ? resetAction.categoryConfirm : resetAction.allConfirm}
          onConfirm={list.applyReset}
          onCancel={list.cancelReset}
        />
      )}
    </div>
  );
}

type CategoryListProps<TItem extends ListItem, TForm> = CategoryListOptions<TItem, TForm> &
  Omit<CategoryListViewProps<TItem, TForm>, 'list'>;

// Lista completa (stato + vista), da usare dove non serve comandarla dall'esterno
function CategoryList<TItem extends ListItem, TForm>({
  filter,
  showAddCategory,
  className,
  ...options
}: CategoryListProps<TItem, TForm>) {
  const list = useCategoryList(options);
  return <CategoryListView list={list} filter={filter} showAddCategory={showAddCategory} className={className} />;
}

export default CategoryList;
