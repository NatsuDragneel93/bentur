import React from 'react';
import './MyInventory.scss';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MyInventory: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="my-inventory-page-container">
      <div className="inventory-cards-container">
        <div
          className="inventory-card"
          onClick={() => navigate('/my-inventory/personal')}
          style={{ cursor: 'pointer' }}
        >
          <span>{t('hub.personal')}</span>
        </div>
        <div
          className="inventory-card"
          onClick={() => navigate('/my-inventory/tour')}
          style={{ cursor: 'pointer' }}
        >
          <span>{t('hub.tour')}</span>
        </div>
      </div>
    </div>
  );
};

export default MyInventory;
