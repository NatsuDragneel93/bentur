import React from 'react';
import type { ListItem, NewItem } from '../../utils/categoryItems';
import type { FormErrors } from '../../utils/formErrors';

export interface ItemActions<TItem extends ListItem> {
  // Modifica immediata (aggiornamento ottimistico), es. spunta di un to-do
  update: (updates: Partial<NewItem<TItem>>) => void;
}

// Descrive come mostrare e modificare un tipo di elemento (checklist, inventario, ...)
export interface ItemType<TItem extends ListItem, TForm> {
  emptyForm: TForm;
  toForm: (item: TItem) => TForm;
  // Errori per campo (chiavi di traduzione); oggetto vuoto se il form è valido
  validate: (form: TForm) => FormErrors<TForm>;
  toData: (form: TForm) => NewItem<TItem>;
  // Elementi con spunta: permette di mostrare l'avanzamento della categoria
  isCompleted?: (item: TItem) => boolean;
  renderContent: (item: TItem, actions: ItemActions<TItem>) => React.ReactNode;
  renderFields: (form: TForm, setForm: (form: TForm) => void, errors: FormErrors<TForm>) => React.ReactNode;
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
