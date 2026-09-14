import type { ChecklistItem, InventoryItem } from '../../services/categoryList.service';
import type { ItemType } from './types';

interface ChecklistForm {
  text: string;
  completed: boolean;
}

// Elementi con testo e spunta (To Do, To Buy). completedLabel es. "Già completato"
export const checklistItemType = (completedLabel: string): ItemType<ChecklistItem, ChecklistForm> => ({
  emptyForm: { text: '', completed: false },
  toForm: (item) => ({ text: item.text, completed: item.completed }),
  validate: (form) => (form.text.trim() ? null : 'Il testo è obbligatorio'),
  toData: (form) => ({ text: form.text.trim(), completed: form.completed }),
  renderContent: (item, { update }) => (
    <>
      <input
        type="checkbox"
        className="cl-checkbox"
        checked={item.completed}
        onChange={() => update({ completed: !item.completed })}
        aria-label={`Segna "${item.text}" come ${item.completed ? 'da fare' : 'completato'}`}
      />
      <span className={item.completed ? 'cl-completed' : undefined}>{item.text}</span>
    </>
  ),
  renderFields: (form, setForm) => (
    <>
      <label>
        Testo:
        <input
          type="text"
          value={form.text}
          onChange={e => setForm({ ...form, text: e.target.value })}
          autoFocus
        />
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.completed}
          onChange={e => setForm({ ...form, completed: e.target.checked })}
        />
        {completedLabel}
      </label>
    </>
  ),
});

interface InventoryForm {
  name: string;
  number: string;
}

// Elementi con nome e quantità (inventario)
export const inventoryItemType: ItemType<InventoryItem, InventoryForm> = {
  emptyForm: { name: '', number: '1' },
  toForm: (item) => ({ name: item.name, number: String(item.number) }),
  validate: (form) => {
    if (!form.name.trim()) return 'Il nome è obbligatorio';
    const quantity = Number(form.number);
    if (!Number.isInteger(quantity) || quantity < 1) return 'La quantità deve essere un numero intero maggiore di zero';
    return null;
  },
  toData: (form) => ({ name: form.name.trim(), number: Number(form.number) }),
  renderContent: (item) => (
    <span>{item.name} - {item.number}</span>
  ),
  renderFields: (form, setForm) => (
    <>
      <label>
        Nome:
        <input
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          autoFocus
        />
      </label>
      <label>
        Numero:
        <input
          type="number"
          min={1}
          step={1}
          value={form.number}
          onChange={e => setForm({ ...form, number: e.target.value })}
        />
      </label>
    </>
  ),
};
