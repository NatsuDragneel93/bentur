import React, { useState, useEffect } from 'react';
import './ToDoPersonal.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { useFirebase } from '../../../context/firebase.context';
import { User, onAuthStateChanged } from 'firebase/auth';
import todoPersonalService, { Todo, Category } from '../../../services/todoPersonal.service';

const ToDoPersonal: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebase = useFirebase();
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoCompleted, setNewTodoCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<{ categoryId: string, todoId: string } | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
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
      const userCategories = await todoPersonalService.getUserCategories(userId);
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
  const handleToggle = async (categoryId: string, todoId: string) => {
    if (!user || !categoryId) return;
    
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;
      
      const todo = category.todos.find(t => t.id === todoId);
      if (!todo) return;
      
      await todoPersonalService.updateTodo(categoryId, todoId, {
        completed: !todo.completed
      });
      
      // Aggiorna lo stato locale
      setCategories(prevCategories =>
        prevCategories.map(cat =>
          cat.id === categoryId
            ? {
                ...cat,
                todos: cat.todos.map(t =>
                  t.id === todoId ? { ...t, completed: !t.completed } : t
                )
              }
            : cat
        )
      );
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  // Gestione add/edit todo
  const handleAddOrEditTodo = async () => {
    if (newTodoText.trim() === '' || expandedCategoryId === null || !user) return;
    
    try {
      if (editingTodoId !== null) {
        // Edit
        await todoPersonalService.updateTodo(expandedCategoryId, editingTodoId, {
          text: newTodoText.trim(),
          completed: newTodoCompleted
        });
        
        // Aggiorna lo stato locale
        setCategories(prevCategories =>
          prevCategories.map(category =>
            category.id === expandedCategoryId
              ? {
                  ...category,
                  todos: category.todos.map(todo =>
                    todo.id === editingTodoId
                      ? { ...todo, text: newTodoText.trim(), completed: newTodoCompleted }
                      : todo
                  )
                }
              : category
          )
        );
      } else {
        // Add
        await todoPersonalService.addTodo(expandedCategoryId, newTodoText.trim());
        
        // Ricarica le categorie dopo l'aggiunta
        await loadCategories(user.uid);
      }
      
      setNewTodoText('');
      setNewTodoCompleted(false);
      setIsModalOpen(false);
      setEditingTodoId(null);
    } catch (error) {
      console.error('Error adding/editing todo:', error);
    }
  };

  // Gestione edit click
  const handleEditClick = (todo: Todo) => {
    setNewTodoText(todo.text);
    setNewTodoCompleted(todo.completed);
    setEditingTodoId(todo.id);
    setIsModalOpen(true);
  };

  // Gestione delete
  const handleDeleteTodo = async () => {
    if (!todoToDelete || !user) return;
    
    try {
      await todoPersonalService.deleteTodo(todoToDelete.categoryId, todoToDelete.todoId);
      
      // Aggiorna lo stato locale
      setCategories(prevCategories =>
        prevCategories.map(category =>
          category.id === todoToDelete.categoryId
            ? {
                ...category,
                todos: category.todos.filter(todo => todo.id !== todoToDelete.todoId)
              }
            : category
        )
      );
      
      setIsDeleteModalOpen(false);
      setTodoToDelete(null);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Drag & drop solo per la categoria espansa
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || expandedCategoryId === null || !user) return;
    
    const category = categories.find(c => c.id === expandedCategoryId);
    if (!category) return;
    
    const todos = Array.from(category.todos);
    const [removed] = todos.splice(result.source.index, 1);
    todos.splice(result.destination!.index, 0, removed);
    
    // Aggiorna gli ordini
    const reorderedTodos = todos.map((todo, index) => ({
      ...todo,
      order: index
    }));
    
    try {
      await todoPersonalService.updateTodoOrder(expandedCategoryId, reorderedTodos);
      
      // Aggiorna lo stato locale
      setCategories(prevCategories =>
        prevCategories.map(cat =>
          cat.id === expandedCategoryId
            ? { ...cat, todos: reorderedTodos }
            : cat
        )
      );
    } catch (error) {
      console.error('Error updating todos order:', error);
    }
  };

  if (loading) {
    return (
      <div className="to-do-page-container">
        <div className="to-do-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Caricamento...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="to-do-page-container">
        <div className="to-do-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Effettua il login per vedere i tuoi To Do
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="to-do-page-container">
      <div className="to-do-container">
        <h1>To Do - Personal</h1>        
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
                    className="todo-edit-button"
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
                    className="todo-delete-button"
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
                    <Droppable droppableId={`todos-${category.id}`}>
                      {(provided) => (
                        <ul
                          className="todo-list"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {category.todos.map((todo, index) => (
                            <Draggable
                              key={todo.id}
                              draggableId={todo.id.toString()}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <li
                                  className="todo-item"
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    background: snapshot.isDragging ? '#333' : '#222222',
                                  }}
                                >
                                  <div className="todo-main">
                                    <input
                                      type="checkbox"
                                      checked={todo.completed}
                                      onChange={() => handleToggle(category.id!, todo.id)}
                                      style={{ marginRight: '10px' }}
                                    />
                                    <span className={todo.completed ? 'completed' : ''}>
                                      {todo.text}
                                    </span>
                                  </div>
                                  <div className="todo-actions">
                                    <button
                                      className="todo-edit-button"
                                      type="button"
                                      onClick={() => handleEditClick(todo)}
                                      style={{ marginRight: '10px' }}
                                    >
                                      <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button
                                      className="todo-delete-button"
                                      type="button"
                                      onClick={() => {
                                        setTodoToDelete({ categoryId: category.id!, todoId: todo.id });
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
                    className="add-todo-floating-button"
                    onClick={() => {
                      setIsModalOpen(true);
                      setNewTodoText('');
                      setNewTodoCompleted(false);
                      setEditingTodoId(null);
                    }}
                    style={{ position: 'static', marginTop: '16px' }}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Aggiungi To Do
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
                  await todoPersonalService.addCategory(user.uid, newCategoryTitle.trim());
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

      {/* Modale aggiunta/modifica todo */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingTodoId !== null ? 'Modifica To Do' : 'Aggiungi To Do'}</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddOrEditTodo();
              }}
            >
              <label>
                Testo:
                <input
                  type="text"
                  value={newTodoText}
                  onChange={e => setNewTodoText(e.target.value)}
                  autoFocus
                />
              </label>
              <label className='checkbox-row'>
                Già completato
                <input
                  type="checkbox"
                  checked={newTodoCompleted}
                  onChange={e => setNewTodoCompleted(e.target.checked)}
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="save-button">
                  {editingTodoId !== null ? 'Salva Modifiche' : 'Aggiungi'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewTodoText('');
                    setNewTodoCompleted(false);
                    setEditingTodoId(null);
                  }}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale conferma eliminazione todo */}
      {isDeleteModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Sei sicuro di voler cancellare il to do?</h3>
            <div className="delete-actions">
              <button
                type="button"
                className="confirm-button"
                onClick={handleDeleteTodo}
              >
                Sì
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTodoToDelete(null);
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
                    await todoPersonalService.deleteCategory(categoryToDelete);
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
                  await todoPersonalService.updateCategory(categoryToEdit.id, editCategoryTitle);
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

export default ToDoPersonal;
