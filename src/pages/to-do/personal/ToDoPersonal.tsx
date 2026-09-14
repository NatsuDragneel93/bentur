import React from 'react';
import CategoryListPage from '../../../components/category-list/CategoryListPage';
import { checklistItemType } from '../../../components/category-list/itemTypes';
import todoPersonalService from '../../../services/todoPersonal.service';

const itemType = checklistItemType('Già completato');

const labels = {
  pageTitle: 'To Do - Personal',
  addItem: 'Aggiungi To Do',
  editItem: 'Modifica To Do',
  deleteItemConfirm: 'Sei sicuro di voler cancellare il to do?',
  emptyCategory: 'Nessun to do presente',
};

const ToDoPersonal: React.FC = () => (
  <CategoryListPage service={todoPersonalService} itemType={itemType} labels={labels} />
);

export default ToDoPersonal;
