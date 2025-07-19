import React, { useState, useEffect } from 'react';
import './ToBuy.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { useFirebase } from '../../context/firebase.context';
import { User, onAuthStateChanged } from 'firebase/auth';
import toBuyService, { type ToBuy, type ToBuyCategory } from '../../services/tobuy.service';

const ToBuy: React.FC = () => {
  const [categories, setCategories] = useState<ToBuyCategory[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebase = useFirebase();
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTobuyText, setNewTobuyText] = useState('');
  const [newTobuyCompleted, setNewTobuyCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTobuyId, setEditingTobuyId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tobuyToDelete, setTobuyToDelete] = useState<{ categoryId: string, tobuyId: string } | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ToBuyCategory | null>(null);
  const [editCategoryTitle, setEditCategoryTitle] = useState('');

  useEffect(() => {
    if (firebase && firebase.auth) {
      const unsubscribe = onAuthStateChanged(firebase.auth, (user: User | null) => {
        setUser(user);
        if (user) {
          loadCategories(user.uid);
        } else {
          setCategories([]);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [firebase]);

  const loadCategories = async (userId: string) => {
    try {
      const userCategories = await toBuyService.getUserCategories(userId);
      setCategories(userCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

    // Filtra le categorie in base al searchTerm
    const filteredCategories = categories.filter(category =>
      category.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    // Gestione accordion
    const handleAccordionClick = (categoryId: string) => {
      setExpandedCategoryId(prev => (prev === categoryId ? null : categoryId));
    };
  
    // Gestione toggle completato
    const handleToggle = async (categoryId: string, tobuyId: string) => {
      if (!user || !categoryId) return;
      
      try {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;
        
        const tobuy = category.tobuys.find(t => t.id === tobuyId);
        if (!tobuy) return;
        
        await toBuyService.updateToBuy(categoryId, tobuyId, {
          completed: !tobuy.completed
        });
        
        // Aggiorna lo stato locale
        setCategories(prevCategories =>
          prevCategories.map(cat =>
            cat.id === categoryId
              ? {
                  ...cat,
                  tobuys: cat.tobuys.map(t =>
                    t.id === tobuyId ? { ...t, completed: !t.completed } : t
                  )
                }
              : cat
          )
        );
      } catch (error) {
        console.error('Error updating tobuy:', error);
      }
    };
  
    // Gestione add/edit toBuy
    const handleAddOrEditTobuy = async () => {
      if (newTobuyText.trim() === '' || expandedCategoryId === null || !user) return;
      
      try {
        if (editingTobuyId !== null) {
          // Edit
          await toBuyService.updateToBuy(expandedCategoryId, editingTobuyId, {
            text: newTobuyText.trim(),
            completed: newTobuyCompleted
          });
          
          // Aggiorna lo stato locale
          setCategories(prevCategories =>
            prevCategories.map(category =>
              category.id === expandedCategoryId
                ? {
                    ...category,
                    tobuys: category.tobuys.map(tobuy =>
                      tobuy.id === editingTobuyId
                        ? { ...tobuy, text: newTobuyText.trim(), completed: newTobuyCompleted }
                        : tobuy
                    )
                  }
                : category
            )
          );
        } else {
          // Add
          await toBuyService.addToBuy(expandedCategoryId, newTobuyText.trim(), newTobuyCompleted);
          
          // Ricarica le categorie dopo l'aggiunta
          await loadCategories(user.uid);
        }
        
        setNewTobuyText('');
        setNewTobuyCompleted(false);
        setIsModalOpen(false);
        setEditingTobuyId(null);
      } catch (error) {
        console.error('Error adding/editing tobuy:', error);
      }
    };
  
    // Gestione edit click
    const handleEditClick = (tobuy: ToBuy) => {
      setNewTobuyText(tobuy.text);
      setNewTobuyCompleted(tobuy.completed);
      setEditingTobuyId(tobuy.id);
      setIsModalOpen(true);
    };
  
    // Gestione delete
    const handleDeleteTobuy = async () => {
      if (!tobuyToDelete || !user) return;
      
      try {
        await toBuyService.deleteToBuy(tobuyToDelete.categoryId, tobuyToDelete.tobuyId);
        
        // Aggiorna lo stato locale
        setCategories(prevCategories =>
          prevCategories.map(category =>
            category.id === tobuyToDelete.categoryId
              ? {
                  ...category,
                  tobuys: category.tobuys.filter(tobuy => tobuy.id !== tobuyToDelete.tobuyId)
                }
              : category
          )
        );
        
        setIsDeleteModalOpen(false);
        setTobuyToDelete(null);
      } catch (error) {
        console.error('Error deleting tobuy:', error);
      }
    };
  
    // Drag & drop solo per la categoria espansa
    const handleDragEnd = async (result: DropResult) => {
      if (!result.destination || expandedCategoryId === null || !user) return;
      
      const category = categories.find(c => c.id === expandedCategoryId);
      if (!category) return;
      
      const tobuys = Array.from(category.tobuys);
      const [removed] = tobuys.splice(result.source.index, 1);
      tobuys.splice(result.destination!.index, 0, removed);
      
      // Aggiorna gli ordini
      const reorderedToBuys = tobuys.map((tobuy, index) => ({
        ...tobuy,
        order: index
      }));
      
      try {
        await toBuyService.updateToBuysOrder(expandedCategoryId, reorderedToBuys);
        
        // Aggiorna lo stato locale
        setCategories(prevCategories =>
          prevCategories.map(cat =>
            cat.id === expandedCategoryId
              ? { ...cat, tobuys: reorderedToBuys }
              : cat
          )
        );
      } catch (error) {
        console.error('Error updating tobuys order:', error);
      }
    };

  if (loading) {
    return (
      <div className="to-buy-page-container">
        <div className="to-buy-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Caricamento...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="to-buy-page-container">
        <div className="to-buy-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Effettua il login per vedere i tuoi To Buy
          </div>
        </div>
      </div>
    );
  }

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
          {filteredCategories.map(category => {
            if (!category.id) return null; // Skip categories without ID
            
            return (
            <li key={category.id} className="category-item">
              <div className="category-header">
                <button
                  className="category-accordion"
                  onClick={() => handleAccordionClick(category.id!)}
                >
                  <span className="category-title">{category.title}</span>
                </button>
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
                      setCategoryToDelete(category.id!);
                      setIsDeleteCategoryModalOpen(true);
                    }}
                    title="Elimina categoria"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
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
                                      onChange={() => handleToggle(category.id!, tobuy.id)}
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
                                        setTobuyToDelete({ categoryId: category.id!, tobuyId: tobuy.id });
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
            );
          })}
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
              onSubmit={async (e) => {
                e.preventDefault();
                if (newCategoryTitle.trim() === '' || !user) return;
                
                try {
                  await toBuyService.addCategory(user.uid, newCategoryTitle.trim());
                  await loadCategories(user.uid);
                  setIsCategoryModalOpen(false);
                  setNewCategoryTitle('');
                } catch (error) {
                  console.error('Error adding category:', error);
                }
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
                onClick={async () => {
                  if (!categoryToDelete || !user) return;
                  
                  try {
                    await toBuyService.deleteCategory(categoryToDelete);
                    await loadCategories(user.uid);
                    setIsDeleteCategoryModalOpen(false);
                    setCategoryToDelete(null);
                    setExpandedCategoryId(null);
                  } catch (error) {
                    console.error('Error deleting category:', error);
                  }
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
              onSubmit={async (e) => {
                e.preventDefault();
                if (!categoryToEdit?.id || !user) return;
                
                try {
                  await toBuyService.updateCategory(categoryToEdit.id, editCategoryTitle);
                  await loadCategories(user.uid);
                  setIsEditCategoryModalOpen(false);
                  setCategoryToEdit(null);
                } catch (error) {
                  console.error('Error updating category:', error);
                }
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