import React from 'react';
import { useTranslation } from 'react-i18next';
import { faArrowDown, faArrowUp, faCheck, faCopy, faTrashCan, faXmark } from '@fortawesome/free-solid-svg-icons';
import Button from '../../../components/ui/Button';
import IconButton from '../../../components/ui/IconButton';
import Field from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { FILL_PRESETS, LABEL_PRESETS, MAX_LABEL_LENGTH, StageElement } from '../../../utils/stagePlot';

type EditableField = 'label' | 'fill' | 'labelColor';

interface ColorFieldProps {
  label: string;
  value: string;
  presets: readonly string[];
  onChange: (color: string) => void;
}

// Colori rapidi del tema + selettore libero
const ColorField: React.FC<ColorFieldProps> = ({ label, value, presets, onChange }) => {
  const { t } = useTranslation();
  const current = value.toLowerCase();
  const isCustom = !presets.includes(current);

  return (
    <div className="field" role="group" aria-label={label}>
      <span className="se-field-label">{label}</span>
      <div className="se-colors">
        {presets.map(color => (
          <button
            key={color}
            type="button"
            className={`se-swatch ${current === color ? 'se-swatch--active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={t('setupEditor.properties.pickColor', { field: label, color })}
            aria-pressed={current === color}
          />
        ))}
        <input
          type="color"
          className={`se-swatch se-color-input ${isCustom ? 'se-swatch--active' : ''}`}
          aria-label={t('setupEditor.properties.customColor', { field: label })}
          // Il selettore nativo accetta solo #rrggbb
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

interface ShapePropertiesProps {
  element: StageElement | null;
  // Numero di forme selezionate: con più di una si mostrano solo le azioni di gruppo
  selectedCount: number;
  // side = colonna a destra (PC); sheet = pannello in primo piano sopra il palco (tablet e cellulare)
  variant: 'side' | 'sheet';
  canBringForward: boolean;
  canSendBackward: boolean;
  onChange: (field: EditableField, value: string) => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDelete: () => void;
  onClose: () => void;
}

// Pannello della forma selezionata: a destra su PC, in primo piano sopra il palco su tablet e cellulare
const ShapeProperties: React.FC<ShapePropertiesProps> = ({
  element,
  selectedCount,
  variant,
  canBringForward,
  canSendBackward,
  onChange,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onDelete,
  onClose,
}) => {
  const { t } = useTranslation();

  // Più forme selezionate: nome e colori restano per la forma singola, qui solo duplica ed elimina
  if (selectedCount > 1) {
    return (
      <aside className="se-properties se-properties--side" aria-label={t('setupEditor.multi.title')}>
        <div className="se-properties-header">
          <h2>{t('setupEditor.multi.selected', { count: selectedCount })}</h2>
        </div>
        <p className="se-properties-hint">{t('setupEditor.multi.hint')}</p>

        <div className="se-properties-actions">
          <Button icon={faCopy} onClick={onDuplicate}>
            {t('setupEditor.properties.duplicate')}
          </Button>
          <Button icon={faTrashCan} danger onClick={onDelete}>
            {t('setupEditor.deleteShape')}
          </Button>
        </div>
      </aside>
    );
  }

  if (!element) {
    return (
      <aside className="se-properties se-properties--empty">
        <p>{t('setupEditor.properties.hint')}</p>
      </aside>
    );
  }

  const isText = element.type === 'text';

  return (
    <aside className={`se-properties se-properties--${variant}`} aria-label={t('setupEditor.properties.title')}>
      <div className="se-properties-header">
        <h2>{t('setupEditor.properties.title')}</h2>
        {variant === 'sheet' ? (
          <Button variant="primary" icon={faCheck} onClick={onClose}>
            {t('setupEditor.properties.done')}
          </Button>
        ) : (
          <IconButton icon={faXmark} variant="ghost" onClick={onClose} label={t('setupEditor.properties.close')} />
        )}
      </div>

      <Field label={t(isText ? 'setupEditor.properties.text' : 'setupEditor.properties.name')}>
        <Input
          value={element.label}
          maxLength={MAX_LABEL_LENGTH}
          placeholder={t('setupEditor.properties.namePlaceholder')}
          onChange={e => onChange('label', e.target.value)}
        />
      </Field>

      {!isText && (
        <ColorField
          label={t(element.type === 'line' ? 'setupEditor.properties.lineColor' : 'setupEditor.properties.fill')}
          value={element.fill}
          presets={FILL_PRESETS}
          onChange={color => onChange('fill', color)}
        />
      )}
      <ColorField
        label={t('setupEditor.properties.textColor')}
        value={element.labelColor}
        presets={LABEL_PRESETS}
        onChange={color => onChange('labelColor', color)}
      />

      <div className="se-properties-actions">
        <Button icon={faCopy} onClick={onDuplicate}>
          {t('setupEditor.properties.duplicate')}
        </Button>
        <Button icon={faArrowUp} onClick={onBringForward} disabled={!canBringForward}>
          {t('setupEditor.properties.bringForward')}
        </Button>
        <Button icon={faArrowDown} onClick={onSendBackward} disabled={!canSendBackward}>
          {t('setupEditor.properties.sendBackward')}
        </Button>
        <Button icon={faTrashCan} danger onClick={onDelete}>
          {t('setupEditor.deleteShape')}
        </Button>
      </div>
    </aside>
  );
};

export default ShapeProperties;
