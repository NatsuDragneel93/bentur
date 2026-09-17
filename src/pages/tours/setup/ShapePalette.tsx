import React from 'react';
import { useTranslation } from 'react-i18next';
import { SHAPE_TYPES, ShapeType } from '../../../utils/stagePlot';

// Tipo MIME usato per trascinare una forma dalla palette al palco (solo mouse)
export const SHAPE_DRAG_TYPE = 'application/x-bentur-shape';

// Anteprime disegnate in SVG
const ShapeIcon: React.FC<{ type: ShapeType }> = ({ type }) => (
  <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">
    {type === 'circle' && <circle cx="20" cy="20" r="14" />}
    {type === 'square' && <rect x="7" y="7" width="26" height="26" rx="5" />}
    {type === 'rect' && <rect x="3" y="11" width="34" height="18" rx="4" />}
    {type === 'triangle' && <polygon points="20,5 36,34 4,34" strokeLinejoin="round" />}
    {type === 'star' && <polygon points="20,3 25,15 38,15 28,23 32,36 20,28 8,36 12,23 2,15 15,15" />}
    {type === 'line' && <rect x="3" y="18" width="34" height="4" />}
    {type === 'text' && <text x="20" y="28" textAnchor="middle" fontSize="22" fontWeight="bold">T</text>}
  </svg>
);

interface ShapePaletteProps {
  onAdd: (type: ShapeType) => void;
}

/**
 * Elenco delle forme. Clic/tocco = aggiunge la forma al centro della vista;
 * con il mouse si può anche trascinare la forma nel punto voluto.
 */
const ShapePalette: React.FC<ShapePaletteProps> = ({ onAdd }) => {
  const { t } = useTranslation();

  return (
    <div className="se-palette" role="toolbar" aria-label={t('setupEditor.shapesTitle')}>
      {SHAPE_TYPES.map(type => {
        const name = t(`setupEditor.shapes.${type}`);
        return (
          <button
            key={type}
            type="button"
            className="se-palette-item"
            onClick={() => onAdd(type)}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData(SHAPE_DRAG_TYPE, type);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            title={t('setupEditor.addShape', { shape: name })}
            aria-label={t('setupEditor.addShape', { shape: name })}
          >
            <ShapeIcon type={type} />
            <span>{name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ShapePalette;
