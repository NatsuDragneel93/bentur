import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import type { ChecklistItem, ConsumableItem } from '../../services/categoryList.service';
import type { ItemActions } from './types';

// Componenti di visualizzazione/modifica usati dai tipi di elemento in itemTypes.tsx

export interface ChecklistForm {
  text: string;
  completed: boolean;
}

export interface InventoryForm {
  name: string;
  number: string;
}

export interface ConsumableForm extends InventoryForm {
  toRestock: boolean;
}

interface FieldsProps<TForm> {
  form: TForm;
  setForm: (form: TForm) => void;
}

export const ChecklistContent = ({ item, update }: { item: ChecklistItem } & ItemActions<ChecklistItem>) => {
  const { t } = useTranslation();

  return (
    <>
      <input
        type="checkbox"
        className="cl-checkbox"
        checked={item.completed}
        onChange={() => update({ completed: !item.completed })}
        aria-label={t(item.completed ? 'checklist.markNotCompleted' : 'checklist.markCompleted', { text: item.text })}
      />
      <span className={item.completed ? 'cl-completed' : undefined}>{item.text}</span>
    </>
  );
};

export const ChecklistFields = ({ form, setForm, completedLabel }: FieldsProps<ChecklistForm> & { completedLabel: string }) => {
  const { t } = useTranslation();

  return (
    <>
      <label>
        {t('checklist.text')}
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
  );
};

export const InventoryFields = ({ form, setForm }: FieldsProps<InventoryForm>) => {
  const { t } = useTranslation();

  return (
    <>
      <label>
        {t('inventoryItem.name')}
        <input
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          autoFocus
        />
      </label>
      <label>
        {t('inventoryItem.quantity')}
        <input
          type="number"
          min={1}
          step={1}
          value={form.number}
          onChange={e => setForm({ ...form, number: e.target.value })}
        />
      </label>
    </>
  );
};

export const ConsumableContent = ({ item, update }: { item: ConsumableItem } & ItemActions<ConsumableItem>) => {
  const { t } = useTranslation();
  const toRestock = item.toRestock === true;

  return (
    <>
      <span>{item.name} - {item.number}</span>
      <button
        type="button"
        className={`cl-restock ${toRestock ? 'cl-restock--active' : ''}`}
        onClick={() => update({ toRestock: !toRestock })}
        aria-pressed={toRestock}
        aria-label={t(toRestock ? 'consumableItem.unmarkToRestock' : 'consumableItem.markToRestock', { name: item.name })}
      >
        <FontAwesomeIcon icon={faCartShopping} />
        {toRestock && t('consumableItem.toRestock')}
      </button>
    </>
  );
};

export const ConsumableFields = ({ form, setForm }: FieldsProps<ConsumableForm>) => {
  const { t } = useTranslation();

  return (
    <>
      <InventoryFields form={form} setForm={inventory => setForm({ ...form, ...inventory })} />
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.toRestock}
          onChange={e => setForm({ ...form, toRestock: e.target.checked })}
        />
        {t('consumableItem.toRestock')}
      </label>
    </>
  );
};
