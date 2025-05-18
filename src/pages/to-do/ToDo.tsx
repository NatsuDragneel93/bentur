import React, { useState } from 'react';
import './ToDo.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface Category {
  id: number;
  title: string;
  todos: Todo[];
}

const personalTodos: Todo[] = [
  { id: 1, text: 'Fare la spesa', completed: false },
  { id: 2, text: 'Andare in vacanza', completed: false },
  { id: 3, text: 'Risparmiare soldi', completed: false },
  { id: 4, text: 'Vendere la macchina', completed: false },
  { id: 5, text: 'Andare a visitare la nonna', completed: false },
];

const tananaiTodos: Todo[] = [
  { id: 1, text: 'Portare chitarra', completed: false },
  { id: 2, text: 'Comprare nuovo microfono', completed: false },
  { id: 3, text: 'Riparare auricolare', completed: false },
];

const ligabueTodos: Todo[] = [
  { id: 1, text: 'Mettere i piatti della batteria nella valigia', completed: false },
  { id: 2, text: 'Verificare che il mixer funzioni', completed: false },
  { id: 3, text: 'Check luci che non funzionavano', completed: false },
];

const initialCategories: Category[] = [
  { id: 1, title: 'Tananai', todos: tananaiTodos },
  { id: 2, title: 'Ligabue', todos: ligabueTodos },
  { id: 3, title: 'Personale', todos: personalTodos },
];

const ToDo: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoCompleted, setNewTodoCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<{ categoryId: number, todoId: number } | null>(null);
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
  const handleToggle = (categoryId: number, todoId: number) => {
    setCategories(categories =>
      categories.map(category =>
        category.id === categoryId
          ? {
            ...category,
            todos: category.todos.map(todo =>
              todo.id === todoId
                ? { ...todo, completed: !todo.completed }
                : todo
            ),
          }
          : category
      )
    );
  };

  // Gestione add/edit todo
  const handleAddOrEditTodo = () => {
    if (newTodoText.trim() === '' || expandedCategoryId === null) return;
    setCategories(categories =>
      categories.map(category => {
        if (category.id !== expandedCategoryId) return category;
        if (editingTodoId !== null) {
          // Edit
          return {
            ...category,
            todos: category.todos.map(todo =>
              todo.id === editingTodoId
                ? { ...todo, text: newTodoText.trim(), completed: newTodoCompleted }
                : todo
            ),
          };
        } else {
          // Add
          return {
            ...category,
            todos: [
              ...category.todos,
              { id: Date.now(), text: newTodoText.trim(), completed: newTodoCompleted },
            ],
          };
        }
      })
    );
    setNewTodoText('');
    setNewTodoCompleted(false);
    setIsModalOpen(false);
    setEditingTodoId(null);
  };

  // Gestione edit click
  const handleEditClick = (todo: Todo) => {
    setNewTodoText(todo.text);
    setNewTodoCompleted(todo.completed);
    setEditingTodoId(todo.id);
    setIsModalOpen(true);
  };

  // Gestione delete
  const handleDeleteTodo = () => {
    if (!todoToDelete) return;
    setCategories(categories =>
      categories.map(category =>
        category.id === todoToDelete.categoryId
          ? {
            ...category,
            todos: category.todos.filter(todo => todo.id !== todoToDelete.todoId),
          }
          : category
      )
    );
    setIsDeleteModalOpen(false);
    setTodoToDelete(null);
  };

  // Drag & drop solo per la categoria espansa
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || expandedCategoryId === null) return;
    setCategories(categories =>
      categories.map(category => {
        if (category.id !== expandedCategoryId) return category;
        const todos = Array.from(category.todos);
        const [removed] = todos.splice(result.source.index, 1);
        todos.splice(result.destination!.index, 0, removed);
        return { ...category, todos };
      })
    );
  };

  return (
    <div className="to-do-page-container">
      <div className="to-do-container">
        <h1>To Do</h1>
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
                  {/* {category.title} */}
                  <span className="category-title">{category.title}</span>
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
                                      onChange={() => handleToggle(category.id, todo.id)}
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
                                        setTodoToDelete({ categoryId: category.id, todoId: todo.id });
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
                    todos: [],
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

export default ToDo;