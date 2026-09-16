import React from 'react';
import type { ParseKeys } from 'i18next';
import type { ListItem, NewItem } from '../../utils/categoryItems';

export interface ItemActions<TItem extends ListItem> {
  // Modifica immediata (aggiornamento ottimistico), es. spunta di un to-do
  update: (updates: Partial<NewItem<TItem>>) => void;
}

// Descrive come mostrare e modificare un tipo di elemento (checklist, inventario, ...)
export interface ItemType<TItem extends ListItem, TForm> {
  emptyForm: TForm;
  toForm: (item: TItem) => TForm;
  // Chiave di traduzione del messaggio di errore, oppure null se il form è valido
  validate: (form: TForm) => ParseKeys | null;
  toData: (form: TForm) => NewItem<TItem>;
  renderContent: (item: TItem, actions: ItemActions<TItem>) => React.ReactNode;
  renderFields: (form: TForm, setForm: (form: TForm) => void) => React.ReactNode;
}

// Testi già tradotti, specifici della sezione (To Do, To Buy, Inventario...)
export interface CategoryListLabels {
  pageTitle: string;
  addItem: string;
  editItem: string;
  deleteItemConfirm: string;
  emptyCategory: string;
}

// Azzeramento di tutti gli elementi, per categoria o per l'intera lista (es. togliere le spunte prima di ogni show)
export interface ResetAction<TItem extends ListItem> {
  // Modifica applicata a ogni elemento, es. { completed: false }
  updates: Partial<NewItem<TItem>>;
  // Elementi ancora da azzerare: se non ce ne sono il pulsante è disattivato
  needsReset: (item: TItem) => boolean;
  // Testi già tradotti
  allLabel: string;
  categoryLabel: (categoryTitle: string) => string;
  allConfirm: string;
  categoryConfirm: string;
}
