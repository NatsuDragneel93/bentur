import React from 'react';
import './ToDoTour.scss';
// import { useFirebase } from '../../../context/firebase.context';
// import { User, onAuthStateChanged } from 'firebase/auth';
// import todoTourService, { Todo, Category } from '../../../services/todoTour.service';

const ToDoTour: React.FC = () => {
  return (
    <div className="todo-tour-page">
      <div className="todo-tour-container">
        <h1>To Do - Tour</h1>
        <div className="todo-tour-content">
          <p>Sezione To Do per i tour in sviluppo...</p>
          <p style={{ fontSize: '1rem', marginTop: '1rem', opacity: 0.7 }}>
            Quando sarà implementato utilizzerà il servizio todoTourService con collezione 'user_todos_tour'
          </p>
        </div>
      </div>
    </div>
  );
};

export default ToDoTour;
