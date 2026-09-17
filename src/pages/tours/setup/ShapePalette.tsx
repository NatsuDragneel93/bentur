import React from 'react';
import { useTranslation } from 'react-i18next';
import { SHAPE_TYPES, ShapeType } from '../../../utils/stagePlot';

// Tipo MIME usato per trascinare una forma dalla palette al palco (solo mouse)
export const SHAPE_DRAG_TYPE = 'application/x-bentur-shape';

// Anteprime a contorno disegnate in SVG, nel colore del testo del pulsante (accento)
const ShapeIcon: React.FC<{ type: ShapeType }> = ({ type }) => (
  <svg
    viewBox="0 0 40 40"
    width="22"
    height="22"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinejoin="round"
    strokeLinecap="round"
  >
    {type === 'circle' && <circle cx="20" cy="20" r="15" />}
    {type === 'square' && <rect x="6" y="6" width="28" height="28" rx="4" />}
    {type === 'rect' && <rect x="3" y="10" width="34" height="20" rx="3" />}
    {type === 'triangle' && <polygon points="20,5 36,34 4,34" />}
    {type === 'star' && <polygon points="20,3 25,15 38,15 28,23 32,36 20,28 8,36 12,23 2,15 15,15" />}
    {type === 'line' && <line x1="4" y1="20" x2="36" y2="20" />}
    {type === 'text' && (
      <path d="M8 8h24M20 8v26" />
    )}
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
      <span className="se-palette-title" aria-hidden="true">{t('setupEditor.shapesTitle')}</span>
      {SHAPE_TYPES.map(type => {
        const name = t(`setupEditor.shapes.${type}`);
        return (
          <button
            key={type}
            type="button"
            className="btn btn-secondary se-palette-item"
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
