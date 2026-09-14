import React from 'react';
import './ToDoTour.scss';
import { useTranslation } from 'react-i18next';

const ToDoTour: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="todo-tour-page">
      <div className="todo-tour-container">
        <h1>{t('toDoTour.title')}</h1>
        <div className="todo-tour-content">
          <p>{t('toDoTour.inProgress')}</p>
        </div>
      </div>
    </div>
  );
};

export default ToDoTour;
