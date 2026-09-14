import React from 'react';
import CategoryListPage from '../../components/category-list/CategoryListPage';
import { checklistItemType } from '../../components/category-list/itemTypes';
import toBuyService from '../../services/tobuy.service';

const itemType = checklistItemType('Già comprato');

const labels = {
  pageTitle: 'To Buy',
  addItem: 'Aggiungi To Buy',
  editItem: 'Modifica To Buy',
  deleteItemConfirm: 'Sei sicuro di voler cancellare il to buy?',
  emptyCategory: 'Nessun to buy presente',
};

const ToBuy: React.FC = () => (
  <CategoryListPage service={toBuyService} itemType={itemType} labels={labels} />
);

export default ToBuy;
