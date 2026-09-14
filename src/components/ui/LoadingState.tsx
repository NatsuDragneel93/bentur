import React from 'react';
import { useTranslation } from 'react-i18next';
import './ui.scss';

const LoadingState: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useTranslation();
  return <div className="bt-loading" role="status">{message ?? t('common.loading')}</div>;
};

export default LoadingState;
