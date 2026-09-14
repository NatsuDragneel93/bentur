import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CategoryListPage from '../../../components/category-list/CategoryListPage';
import { checklistItemType } from '../../../components/category-list/itemTypes';
import todoPersonalService from '../../../services/todoPersonal.service';

const ToDoPersonal: React.FC = () => {
  const { t } = useTranslation();
  const itemType = useMemo(() => checklistItemType(t('toDoPersonal.completedLabel')), [t]);

  const labels = {
    pageTitle: t('toDoPersonal.title'),
    addItem: t('toDoPersonal.addItem'),
    editItem: t('toDoPersonal.editItem'),
    deleteItemConfirm: t('toDoPersonal.deleteItemConfirm'),
    emptyCategory: t('toDoPersonal.emptyCategory'),
  };

  return <CategoryListPage service={todoPersonalService} itemType={itemType} labels={labels} />;
};

export default ToDoPersonal;
