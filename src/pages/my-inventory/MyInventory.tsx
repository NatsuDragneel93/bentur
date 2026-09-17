import React from 'react';
import { useTranslation } from 'react-i18next';
import ListHub from '../../components/list-hub/ListHub';

const MyInventory: React.FC = () => {
  const { t } = useTranslation();
  return <ListHub title={t('nav.inventory')} basePath="/my-inventory" />;
};

export default MyInventory;
