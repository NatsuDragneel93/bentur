import React from 'react';
import './ToDo.scss';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ToDo: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="todo-page-container">
      <div className="todo-cards-container">
        <div
          className="todo-card"
          onClick={() => navigate('/to-do/personal')}
          style={{ cursor: 'pointer' }}
        >
          <span>{t('hub.personal')}</span>
        </div>
        <div
          className="todo-card"
          onClick={() => navigate('/to-do/tour')}
          style={{ cursor: 'pointer' }}
        >
          <span>{t('hub.tour')}</span>
        </div>
      </div>
    </div>
  );
};

export default ToDo;
