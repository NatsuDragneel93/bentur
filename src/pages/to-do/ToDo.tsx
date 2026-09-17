import React from 'react';
import { useTranslation } from 'react-i18next';
import ListHub from '../../components/list-hub/ListHub';

const ToDo: React.FC = () => {
  const { t } = useTranslation();
  return <ListHub title={t('nav.toDo')} basePath="/to-do" />;
};

export default ToDo;
