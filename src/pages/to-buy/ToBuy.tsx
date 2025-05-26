import React, { useState } from 'react';
import './ToBuy.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

interface Tobuy {
  id: number;
  text: string;
  completed: boolean;
}

interface Category {
  id: number;
  title: string;
  tobuys: Tobuy[];
}

const personalTobuy: Tobuy[] = [
  { id: 1, text: 'Fare la spesa', completed: false },
  { id: 2, text: 'Andare in vacanza', completed: false },
  { id: 3, text: 'Risparmiare soldi', completed: false },
  { id: 4, text: 'Vendere la macchina', completed: false },
  { id: 5, text: 'Andare a visitare la nonna', completed: false },
];

const tananaiTobuy: Tobuy[] = [
  { id: 1, text: 'Portare chitarra', completed: false },
  { id: 2, text: 'Comprare nuovo microfono', completed: false },
  { id: 3, text: 'Riparare auricolare', completed: false },
];

const ligabueTobuy: Tobuy[] = [
  { id: 1, text: 'Mettere i piatti della batteria nella valigia', completed: false },
  { id: 2, text: 'Verificare che il mixer funzioni', completed: false },
  { id: 3, text: 'Check luci che non funzionavano', completed: false },
];

const initialCategories: Category[] = [
  { id: 1, title: 'Tananai', tobuys: tananaiTobuy },
  { id: 2, title: 'Ligabue', tobuys: ligabueTobuy },
  { id: 3, title: 'Personale', tobuys: personalTobuy },
];

const ToBuy: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTobuyText, setNewTobuyText] = useState('');
  const [newTobuyCompleted, setNewTobuyCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTobuyId, setEditingTobuyId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tobuyToDelete, setTobuyToDelete] = useState<{ categoryId: number, tobuyId: number } | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [editCategoryTitle, setEditCategoryTitle] = useState('');

    // Filtra le categorie in base al searchTerm
    const filteredCategories = categories.filter(category =>
      category.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    // Gestione accordion
    const handleAccordionClick = (categoryId: number) => {
      setExpandedCategoryId(prev => (prev === categoryId ? null : categoryId));
    };
  
    // Gestione toggle completato
    const handleToggle = (categoryId: number, tobuyId: number) => {
      setCategories(categories =>
        categories.map(category =>
          category.id === categoryId
            ? {
              ...category,
              tobuys: category.tobuys.map(tobuy =>
                tobuy.id === tobuyId
                  ? { ...tobuy, completed: !tobuy.completed }
                  : tobuy
              ),
            }
            : category
        )
      );
    };
  
    // Gestione add/edit toBuy
    const handleAddOrEditTobuy = () => {
      if (newTobuyText.trim() === '' || expandedCategoryId === null) return;
      setCategories(categories =>
        categories.map(category => {
          if (category.id !== expandedCategoryId) return category;
          if (editingTobuyId !== null) {
            // Edit
            return {
              ...category,
              tobuys: category.tobuys.map(tobuy =>
                tobuy.id === editingTobuyId
                  ? { ...tobuy, text: newTobuyText.trim(), completed: newTobuyCompleted }
                  : tobuy
              ),
            };
          } else {
            // Add
            return {
              ...category,
              tobuys: [
                ...category.tobuys,
                { id: Date.now(), text: newTobuyText.trim(), completed: newTobuyCompleted },
              ],
            };
          }
        })
      );
      setNewTobuyText('');
      setNewTobuyCompleted(false);
      setIsModalOpen(false);
      setEditingTobuyId(null);
    };
  
    // Gestione edit click
    const handleEditClick = (tobuy: Tobuy) => {
      setNewTobuyText(tobuy.text);
      setNewTobuyCompleted(tobuy.completed);
      setEditingTobuyId(tobuy.id);
      setIsModalOpen(true);
    };
  
    // Gestione delete
    const handleDeleteTobuy = () => {
      if (!tobuyToDelete) return;
      setCategories(categories =>
        categories.map(category =>
          category.id === tobuyToDelete.categoryId
            ? {
              ...category,
              tobuys: category.tobuys.filter(tobuy => tobuy.id !== tobuyToDelete.tobuyId),
            }
            : category
        )
      );
      setIsDeleteModalOpen(false);
      setTobuyToDelete(null);
    };
  
    // Drag & drop solo per la categoria espansa
    const handleDragEnd = (result: DropResult) => {
      if (!result.destination || expandedCategoryId === null) return;
      setCategories(categories =>
        categories.map(category => {
          if (category.id !== expandedCategoryId) return category;
          const tobuys = Array.from(category.tobuys);
          const [removed] = tobuys.splice(result.source.index, 1);
          tobuys.splice(result.destination!.index, 0, removed);
          return { ...category, tobuys };
        })
      );
    };

  return (
    <div className="to-buy-page-container">
      <div className="to-buy-container">
        <h1>To Buy</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cerca categoria..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <ul className="category-list">
          {filteredCategories.map(category => (
            <li key={category.id} className="category-item">
              <div>
                <button
                  className="category-accordion"
                  onClick={() => handleAccordionClick(category.id)}
                  style={{ flex: 1, textAlign: 'left' }}
                >
                  <span className="category-title">{category.title}</span>
                  <div className='category-actions'>
                    <button
                      className="tobuy-edit-button"
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setCategoryToEdit(category);
                        setEditCategoryTitle(category.title);
                        setIsEditCategoryModalOpen(true);
                      }}
                      title="Modifica categoria"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="tobuy-delete-button"
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setCategoryToDelete(category.id);
                        setIsDeleteCategoryModalOpen(true);
                      }}
                      title="Elimina categoria"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </button>
              </div>

              {expandedCategoryId === category.id && (
                <div className="category-content">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId={`tobuys-${category.id}`}>
                      {(provided) => (
                        <ul
                          className="tobuy-list"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {category.tobuys.map((tobuy, index) => (
                            <Draggable
                              key={tobuy.id}
                              draggableId={tobuy.id.toString()}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <li
                                  className="tobuy-item"
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    background: snapshot.isDragging ? '#333' : '#222222',
                                  }}
                                >
                                  <div className="tobuy-main">
                                    <input
                                      type="checkbox"
                                      checked={tobuy.completed}
                                      onChange={() => handleToggle(category.id, tobuy.id)}
                                      style={{ marginRight: '10px' }}
                                    />
                                    <span className={tobuy.completed ? 'completed' : ''}>
                                      {tobuy.text}
                                    </span>
                                  </div>
                                  <div className="tobuy-actions">
                                    <button
                                      className="tobuy-edit-button"
                                      type="button"
                                      onClick={() => handleEditClick(tobuy)}
                                      style={{ marginRight: '10px' }}
                                    >
                                      <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button
                                      className="tobuy-delete-button"
                                      type="button"
                                      onClick={() => {
                                        setTobuyToDelete({ categoryId: category.id, tobuyId: tobuy.id });
                                        setIsDeleteModalOpen(true);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </div>
                                </li>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </ul>
                      )}
                    </Droppable>
                  </DragDropContext>
                  <button
                    className="add-tobuy-floating-button"
                    onClick={() => {
                      setIsModalOpen(true);
                      setNewTobuyText('');
                      setNewTobuyCompleted(false);
                      setEditingTobuyId(null);
                    }}
                    style={{ position: 'static', marginTop: '16px' }}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Aggiungi To Buy
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {/* Floating button SEMPRE visibile per aggiungere categoria */}
        <button
          className="add-category-floating-button"
          onClick={() => {
            setIsCategoryModalOpen(true);
            setNewCategoryTitle('');
          }}

          aria-label="Aggiungi categoria"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      {/* Modale aggiunta categoria */}
      {isCategoryModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Aggiungi Categoria</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (newCategoryTitle.trim() === '') return;
                setCategories([
                  ...categories,
                  {
                    id: Date.now(),
                    title: newCategoryTitle.trim(),
                    tobuys: [],
                  },
                ]);
                setIsCategoryModalOpen(false);
                setNewCategoryTitle('');
              }}
            >
              <label>
                Nome categoria:
                <input
                  type="text"
                  value={newCategoryTitle}
                  onChange={e => setNewCategoryTitle(e.target.value)}
                  autoFocus
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="save-button">
                  Aggiungi
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale aggiunta/modifica tobuy */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingTobuyId !== null ? 'Modifica To Buy' : 'Aggiungi To Buy'}</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddOrEditTobuy();
              }}
            >
              <label>
                Testo:
                <input
                  type="text"
                  value={newTobuyText}
                  onChange={e => setNewTobuyText(e.target.value)}
                  autoFocus
                />
              </label>
              <label className='checkbox-row'>
                Già comprato
                <input
                  type="checkbox"
                  checked={newTobuyCompleted}
                  onChange={e => setNewTobuyCompleted(e.target.checked)}
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="save-button">
                  {editingTobuyId !== null ? 'Salva Modifiche' : 'Aggiungi'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewTobuyText('');
                    setNewTobuyCompleted(false);
                    setEditingTobuyId(null);
                  }}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale conferma eliminazione tobuy */}
      {isDeleteModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Sei sicuro di voler cancellare il to buy?</h3>
            <div className="delete-actions">
              <button
                type="button"
                className="confirm-button"
                onClick={handleDeleteTobuy}
              >
                Sì
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTobuyToDelete(null);
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteCategoryModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Sei sicuro di voler cancellare la categoria?</h3>
            <div className="delete-actions">
              <button
                type="button"
                className="confirm-button"
                onClick={() => {
                  setCategories(categories => categories.filter(cat => cat.id !== categoryToDelete));
                  setIsDeleteCategoryModalOpen(false);
                  setCategoryToDelete(null);
                  setExpandedCategoryId(null);
                }}
              >
                Sì
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsDeleteCategoryModalOpen(false);
                  setCategoryToDelete(null);
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditCategoryModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Modifica Categoria</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                setCategories(categories =>
                  categories.map(cat =>
                    cat.id === categoryToEdit?.id
                      ? { ...cat, title: editCategoryTitle }
                      : cat
                  )
                );
                setIsEditCategoryModalOpen(false);
                setCategoryToEdit(null);
              }}
            >
              <label>
                Nome categoria:
                <input
                  type="text"
                  value={editCategoryTitle}
                  onChange={e => setEditCategoryTitle(e.target.value)}
                  autoFocus
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="save-button">
                  Salva
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setIsEditCategoryModalOpen(false)}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};

export default ToBuy;