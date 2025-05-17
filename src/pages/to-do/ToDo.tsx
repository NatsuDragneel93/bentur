import React, { useState } from 'react';
import './ToDo.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const initialTodos: Todo[] = [
  { id: 1, text: 'Fare la spesa', completed: false },
  { id: 2, text: 'Andare in vacanza', completed: false },
  { id: 3, text: 'Risparmiare soldi', completed: false },
  { id: 4, text: 'Vendere la macchina', completed: false },
  { id: 5, text: 'Andare a visitare la nonna', completed: false },
];

const ToDo: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoCompleted, setNewTodoCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<number | null>(null);

  const handleToggle = (id: number) => {
    setTodos(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleAddOrEditTodo = () => {
    if (newTodoText.trim() === '') return;
    if (editingTodoId !== null) {
      setTodos(todos =>
        todos.map(todo =>
          todo.id === editingTodoId
            ? { ...todo, text: newTodoText.trim(), completed: newTodoCompleted }
            : todo
        )
      );
    } else {
      setTodos([
        ...todos,
        { id: Date.now(), text: newTodoText.trim(), completed: newTodoCompleted }
      ]);
    }
    setNewTodoText('');
    setNewTodoCompleted(false);
    setIsModalOpen(false);
    setEditingTodoId(null);
  };

  const handleEditClick = (todo: Todo) => {
    setNewTodoText(todo.text);
    setNewTodoCompleted(todo.completed);
    setEditingTodoId(todo.id);
    setIsModalOpen(true);
  };

  const handleDeleteTodo = (id: number) => {
    setTodos(todos => todos.filter(todo => todo.id !== id));
    setIsDeleteModalOpen(false);
    setTodoToDelete(null);
  };

  const filteredTodos = todos.filter(todo =>
    todo.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="to-do-page-container">
      <div className="to-do-container">
        <h1>To Do</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cerca to do..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <ul className="todo-list">
          {filteredTodos.map(todo => (
            <li key={todo.id} className="todo-item">
              <div className="todo-main">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id)}
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
                    setTodoToDelete(todo.id);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          className="add-todo-floating-button"
          onClick={() => {
            setIsModalOpen(true);
            setNewTodoText('');
            setNewTodoCompleted(false);
            setEditingTodoId(null);
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

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

      {isDeleteModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Sei sicuro di voler cancellare il to do?</h3>
            <div className="delete-actions">
              <button
                type="button"
                className="confirm-button"
                onClick={() => todoToDelete !== null && handleDeleteTodo(todoToDelete)}
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
    </div>
  );
};

export default ToDo;