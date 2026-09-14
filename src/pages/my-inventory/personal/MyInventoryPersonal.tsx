import React from 'react';
import CategoryListPage from '../../../components/category-list/CategoryListPage';
import { inventoryItemType } from '../../../components/category-list/itemTypes';
import myInventoryPersonalService from '../../../services/myInventoryPersonal.service';

const labels = {
  pageTitle: 'My Inventory - Personal',
  addItem: 'Aggiungi elemento',
  editItem: 'Modifica elemento',
  deleteItemConfirm: 'Sei sicuro di voler eliminare questo elemento?',
  emptyCategory: 'Nessun materiale presente',
};

const MyInventoryPersonal: React.FC = () => (
  <CategoryListPage service={myInventoryPersonalService} itemType={inventoryItemType} labels={labels} />
);

export default MyInventoryPersonal;
