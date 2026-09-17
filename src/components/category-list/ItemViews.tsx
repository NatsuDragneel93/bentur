import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import type { ChecklistItem, ConsumableItem, InventoryItem } from '../../services/categoryList.service';
import type { FormErrors } from '../../utils/formErrors';
import Checkbox from '../ui/Checkbox';
import Field from '../ui/Field';
import { Input } from '../ui/Input';
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
  errors: FormErrors<TForm>;
}

export const ChecklistContent = ({ item, update }: { item: ChecklistItem } & ItemActions<ChecklistItem>) => {
  const { t } = useTranslation();

  return (
    <>
      <Checkbox
        large
        checked={item.completed}
        onChange={() => update({ completed: !item.completed })}
        aria-label={t(item.completed ? 'checklist.markNotCompleted' : 'checklist.markCompleted', { text: item.text })}
      />
      <span className={`cl-item-text ${item.completed ? 'cl-completed' : ''}`}>{item.text}</span>
    </>
  );
};

export const ChecklistFields = ({ form, setForm, errors, completedLabel }: FieldsProps<ChecklistForm> & { completedLabel: string }) => {
  const { t } = useTranslation();

  return (
    <>
      <Field label={t('checklist.text')} error={errors.text && t(errors.text)}>
        <Input
          value={form.text}
          onChange={e => setForm({ ...form, text: e.target.value })}
          autoFocus
        />
      </Field>
      <label className="bt-check-row">
        <Checkbox
          checked={form.completed}
          onChange={e => setForm({ ...form, completed: e.target.checked })}
        />
        {completedLabel}
      </label>
    </>
  );
};

export const InventoryContent = ({ item }: { item: InventoryItem }) => (
  <span className="cl-item-text">{item.name} - {item.number}</span>
);

export const InventoryFields = ({ form, setForm, errors }: FieldsProps<InventoryForm>) => {
  const { t } = useTranslation();

  return (
    <>
      <Field label={t('inventoryItem.name')} error={errors.name && t(errors.name)}>
        <Input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          autoFocus
        />
      </Field>
      <Field label={t('inventoryItem.quantity')} error={errors.number && t(errors.number)}>
        <Input
          type="number"
          min={1}
          step={1}
          value={form.number}
          onChange={e => setForm({ ...form, number: e.target.value })}
        />
      </Field>
    </>
  );
};

export const ConsumableContent = ({ item, update }: { item: ConsumableItem } & ItemActions<ConsumableItem>) => {
  const { t } = useTranslation();
  const toRestock = item.toRestock === true;

  return (
    <>
      <span className="cl-item-text">{item.name} - {item.number}</span>
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

export const ConsumableFields = ({ form, setForm, errors }: FieldsProps<ConsumableForm>) => {
  const { t } = useTranslation();

  return (
    <>
      <InventoryFields form={form} setForm={inventory => setForm({ ...form, ...inventory })} errors={errors} />
      <label className="bt-check-row">
        <Checkbox
          checked={form.toRestock}
          onChange={e => setForm({ ...form, toRestock: e.target.checked })}
        />
        {t('consumableItem.toRestock')}
      </label>
    </>
  );
};
