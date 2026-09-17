import type { ChecklistItem, ConsumableItem, InventoryItem } from '../../services/categoryList.service';
import type { FormErrors } from '../../utils/formErrors';
import type { ItemType } from './types';
import {
  ChecklistContent,
  ChecklistFields,
  ChecklistForm,
  ConsumableContent,
  ConsumableFields,
  ConsumableForm,
  InventoryContent,
  InventoryFields,
  InventoryForm,
} from './ItemViews';

// Elementi con testo e spunta (To Do, To Buy). completedLabel è già tradotto, es. "Già completato"
export const checklistItemType = (completedLabel: string): ItemType<ChecklistItem, ChecklistForm> => ({
  emptyForm: { text: '', completed: false },
  toForm: (item) => ({ text: item.text, completed: item.completed }),
  validate: (form) => (form.text.trim() ? {} : { text: 'checklist.textRequired' }),
  toData: (form) => ({ text: form.text.trim(), completed: form.completed }),
  isCompleted: (item) => item.completed,
  renderContent: (item, actions) => <ChecklistContent item={item} {...actions} />,
  renderFields: (form, setForm, errors) => (
    <ChecklistFields form={form} setForm={setForm} errors={errors} completedLabel={completedLabel} />
  ),
});

const validateInventory = (form: InventoryForm): FormErrors<InventoryForm> => {
  const errors: FormErrors<InventoryForm> = {};
  if (!form.name.trim()) errors.name = 'inventoryItem.nameRequired';
  const quantity = Number(form.number);
  if (!Number.isInteger(quantity) || quantity < 1) errors.number = 'inventoryItem.quantityInvalid';
  return errors;
};

// Elementi con nome e quantità (inventario, spare)
export const inventoryItemType: ItemType<InventoryItem, InventoryForm> = {
  emptyForm: { name: '', number: '1' },
  toForm: (item) => ({ name: item.name, number: String(item.number) }),
  validate: validateInventory,
  toData: (form) => ({ name: form.name.trim(), number: Number(form.number) }),
  renderContent: (item) => <InventoryContent item={item} />,
  renderFields: (form, setForm, errors) => <InventoryFields form={form} setForm={setForm} errors={errors} />,
};

// Consumabili: come l'inventario, con il flag "da ricomprare" modificabile direttamente dalla lista
export const consumableItemType: ItemType<ConsumableItem, ConsumableForm> = {
  emptyForm: { ...inventoryItemType.emptyForm, toRestock: false },
  toForm: (item) => ({ ...inventoryItemType.toForm(item), toRestock: item.toRestock === true }),
  validate: (form) => validateInventory(form),
  toData: (form) => ({ ...inventoryItemType.toData(form), toRestock: form.toRestock }),
  renderContent: (item, actions) => <ConsumableContent item={item} {...actions} />,
  renderFields: (form, setForm, errors) => <ConsumableFields form={form} setForm={setForm} errors={errors} />,
};
