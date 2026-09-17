import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faClone, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { COLOR_PRESETS, MAX_LABEL_LENGTH, StageElement } from '../../../utils/stagePlot';

type EditableField = 'label' | 'fill' | 'labelColor';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

// Colori rapidi + selettore libero
const ColorField: React.FC<ColorFieldProps> = ({ label, value, onChange }) => {
  const { t } = useTranslation();
  const inputId = useId();

  return (
    <div className="se-field">
      <label htmlFor={inputId}>{label}</label>
      <div className="se-colors">
        {COLOR_PRESETS.map(color => (
          <button
            key={color}
            type="button"
            className={`se-swatch ${value.toLowerCase() === color ? 'se-swatch--active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={t('setupEditor.properties.pickColor', { field: label, color })}
            aria-pressed={value.toLowerCase() === color}
          />
        ))}
        <input
          id={inputId}
          type="color"
          className="se-color-input"
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
  canBringForward: boolean;
  canSendBackward: boolean;
  onChange: (field: EditableField, value: string) => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDelete: () => void;
  onClose: () => void;
}

// Pannello della forma selezionata: a destra su PC, pannello a scomparsa dal basso su cellulare
const ShapeProperties: React.FC<ShapePropertiesProps> = ({
  element,
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
  const labelId = useId();

  if (!element) {
    return (
      <aside className="se-properties se-properties--empty">
        <p>{t('setupEditor.properties.hint')}</p>
      </aside>
    );
  }

  const isText = element.type === 'text';

  return (
    <aside className="se-properties" aria-label={t('setupEditor.properties.title')}>
      <div className="se-properties-header">
        <h2>{t(`setupEditor.shapes.${element.type}`)}</h2>
        <button type="button" className="se-icon-button" onClick={onClose} aria-label={t('setupEditor.properties.close')}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className="se-field">
        <label htmlFor={labelId}>{t(isText ? 'setupEditor.properties.text' : 'setupEditor.properties.name')}</label>
        <input
          id={labelId}
          type="text"
          value={element.label}
          maxLength={MAX_LABEL_LENGTH}
          placeholder={t('setupEditor.properties.namePlaceholder')}
          onChange={e => onChange('label', e.target.value)}
        />
      </div>

      {!isText && (
        <ColorField
          label={t(element.type === 'line' ? 'setupEditor.properties.lineColor' : 'setupEditor.properties.fill')}
          value={element.fill}
          onChange={color => onChange('fill', color)}
        />
      )}
      <ColorField
        label={t('setupEditor.properties.textColor')}
        value={element.labelColor}
        onChange={color => onChange('labelColor', color)}
      />

      <div className="se-properties-actions">
        <button type="button" className="se-action" onClick={onDuplicate}>
          <FontAwesomeIcon icon={faClone} /> {t('setupEditor.properties.duplicate')}
        </button>
        <button type="button" className="se-action" onClick={onBringForward} disabled={!canBringForward}>
          <FontAwesomeIcon icon={faArrowUp} /> {t('setupEditor.properties.bringForward')}
        </button>
        <button type="button" className="se-action" onClick={onSendBackward} disabled={!canSendBackward}>
          <FontAwesomeIcon icon={faArrowDown} /> {t('setupEditor.properties.sendBackward')}
        </button>
        <button type="button" className="se-action se-action--danger" onClick={onDelete}>
          <FontAwesomeIcon icon={faTrash} /> {t('setupEditor.deleteShape')}
        </button>
      </div>
    </aside>
  );
};

export default ShapeProperties;
