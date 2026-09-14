import { useTranslation } from 'react-i18next';
import type { ChecklistItem } from '../../services/categoryList.service';
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
