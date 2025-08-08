import React from 'react';
import './ToDo.scss';
import { useNavigate } from 'react-router-dom';

const ToDo: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="todo-page-container">
      <div className="todo-cards-container">
        <div
          className="todo-card"
          onClick={() => navigate('/to-do/personal')}
          style={{ cursor: 'pointer' }}
        >
          <span>Personal</span>
        </div>
        <div
          className="todo-card"
          onClick={() => navigate('/to-do/tour')}
          style={{ cursor: 'pointer' }}
        >
          <span>Tour</span>
        </div>
      </div>
    </div>
  );
};

export default ToDo;