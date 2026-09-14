import React from 'react';
import './MyInventoryTour.scss';
import { useTranslation } from 'react-i18next';

const MyInventoryTour: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="my-inventory-tour-page">
      <h2>{t('inventoryTour.title')}</h2>
    </div>
  );
};

export default MyInventoryTour;
