import type { ChecklistItem, ConsumableItem, InventoryItem } from '../../services/categoryList.service';
import type { ItemType } from './types';
import {
  ChecklistContent,
  ChecklistFields,
  ChecklistForm,
  ConsumableContent,
  ConsumableFields,
  ConsumableForm,
  InventoryFields,
  InventoryForm,
} from './ItemViews';

// Elementi con testo e spunta (To Do, To Buy). completedLabel è già tradotto, es. "Già completato"
export const checklistItemType = (completedLabel: string): ItemType<ChecklistItem, ChecklistForm> => ({
  emptyForm: { text: '', completed: false },
  toForm: (item) => ({ text: item.text, completed: item.completed }),
  validate: (form) => (form.text.trim() ? null : 'checklist.textRequired'),
  toData: (form) => ({ text: form.text.trim(), completed: form.completed }),
  renderContent: (item, actions) => <ChecklistContent item={item} {...actions} />,
  renderFields: (form, setForm) => <ChecklistFields form={form} setForm={setForm} completedLabel={completedLabel} />,
});

// Elementi con nome e quantità (inventario, spare)
export const inventoryItemType: ItemType<InventoryItem, InventoryForm> = {
  emptyForm: { name: '', number: '1' },
  toForm: (item) => ({ name: item.name, number: String(item.number) }),
  validate: (form) => {
    if (!form.name.trim()) return 'inventoryItem.nameRequired';
    const quantity = Number(form.number);
    if (!Number.isInteger(quantity) || quantity < 1) return 'inventoryItem.quantityInvalid';
    return null;
  },
  toData: (form) => ({ name: form.name.trim(), number: Number(form.number) }),
  renderContent: (item) => <span>{item.name} - {item.number}</span>,
  renderFields: (form, setForm) => <InventoryFields form={form} setForm={setForm} />,
};

// Consumabili: come l'inventario, con il flag "da ricomprare" modificabile direttamente dalla lista
export const consumableItemType: ItemType<ConsumableItem, ConsumableForm> = {
  emptyForm: { ...inventoryItemType.emptyForm, toRestock: false },
  toForm: (item) => ({ ...inventoryItemType.toForm(item), toRestock: item.toRestock === true }),
  validate: (form) => inventoryItemType.validate(form),
  toData: (form) => ({ ...inventoryItemType.toData(form), toRestock: form.toRestock }),
  renderContent: (item, actions) => <ConsumableContent item={item} {...actions} />,
  renderFields: (form, setForm) => <ConsumableFields form={form} setForm={setForm} />,
};
