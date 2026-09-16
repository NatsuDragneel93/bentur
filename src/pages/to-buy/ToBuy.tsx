import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CategoryListPage from '../../components/category-list/CategoryListPage';
import { checklistItemType } from '../../components/category-list/itemTypes';
import { useRequiredUser } from '../../hooks/useAuth';
import toBuyService from '../../services/tobuy.service';

const ToBuy: React.FC = () => {
  const { t } = useTranslation();
  const user = useRequiredUser();
  const service = useMemo(() => toBuyService.forUser(user.uid), [user.uid]);
  const itemType = useMemo(() => checklistItemType(t('toBuy.completedLabel')), [t]);

  const labels = {
    pageTitle: t('toBuy.title'),
    addItem: t('toBuy.addItem'),
    editItem: t('toBuy.editItem'),
    deleteItemConfirm: t('toBuy.deleteItemConfirm'),
    emptyCategory: t('toBuy.emptyCategory'),
  };

  return <CategoryListPage service={service} itemType={itemType} labels={labels} />;
};

export default ToBuy;
