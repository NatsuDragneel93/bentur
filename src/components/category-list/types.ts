import React from 'react';
import type { ListItem, NewItem } from '../../utils/categoryItems';

export interface ItemActions<TItem extends ListItem> {
  // Modifica immediata (aggiornamento ottimistico), es. spunta di un to-do
  update: (updates: Partial<NewItem<TItem>>) => void;
}

// Descrive come mostrare e modificare un tipo di elemento (checklist, inventario, ...)
export interface ItemType<TItem extends ListItem, TForm> {
  emptyForm: TForm;
  toForm: (item: TItem) => TForm;
  // Messaggio di errore, oppure null se il form è valido
  validate: (form: TForm) => string | null;
  toData: (form: TForm) => NewItem<TItem>;
  renderContent: (item: TItem, actions: ItemActions<TItem>) => React.ReactNode;
  renderFields: (form: TForm, setForm: (form: TForm) => void) => React.ReactNode;
}

export interface CategoryListLabels {
  pageTitle: string;
  addItem: string;
  editItem: string;
  deleteItemConfirm: string;
  emptyCategory: string;
}
