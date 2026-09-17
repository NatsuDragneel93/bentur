import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CategoryListPage from '../../../components/category-list/CategoryListPage';
import { checklistItemType } from '../../../components/category-list/itemTypes';
import { useRequiredUser } from '../../../hooks/useAuth';
import todoPersonalService from '../../../services/todoPersonal.service';

const ToDoPersonal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useRequiredUser();
  const service = useMemo(() => todoPersonalService.forUser(user.uid), [user.uid]);
  const itemType = useMemo(() => checklistItemType(t('toDoPersonal.completedLabel')), [t]);

  const labels = {
    pageTitle: t('toDoPersonal.title'),
    addItem: t('toDoPersonal.addItem'),
    editItem: t('toDoPersonal.editItem'),
    deleteItemConfirm: t('toDoPersonal.deleteItemConfirm'),
    emptyCategory: t('toDoPersonal.emptyCategory'),
  };

  return (
    <CategoryListPage
      service={service}
      itemType={itemType}
      labels={labels}
      back={{ label: t('nav.toDo'), onClick: () => navigate('/to-do') }}
    />
  );
};

export default ToDoPersonal;
