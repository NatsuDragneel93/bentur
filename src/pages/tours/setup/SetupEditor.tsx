import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import './SetupEditor.scss';
import LoadingState from '../../../components/ui/LoadingState';
import { generateItemId } from '../../../utils/categoryItems';
import {
  createElement,
  fitScale,
  moveElement,
  removeElement,
  ShapeType,
  spawnPosition,
  StageElement,
  TransformResult,
  transformElement,
} from '../../../utils/stagePlot';
import { artistPath } from '../artist-lists/artistListPaths';
import { useTourArtist } from '../useTourArtist';
import { isSetupKey } from './setupPaths';
import ShapePalette from './ShapePalette';
import StageCanvas from './StageCanvas';

// Scala del palco adattata allo spazio disponibile (ricalcolata quando la finestra cambia)
const useFitScale = () => {
  // Callback ref: il contenitore compare solo dopo il caricamento dell'artista
  const [container, ref] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!container) return;

    const update = () => setScale(fitScale(container.clientWidth, container.clientHeight));
    update();

    // ResizeObserver manca solo in ambienti di test
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  return { ref, scale };
};

// Editor della disposizione del palco: /tours/:tourId/artists/:artistId/setup/:setupKey
const SetupEditor: React.FC = () => {
  const { tourId, artistId, setupKey } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { artist, loading } = useTourArtist(tourId, artistId);
  const { ref: canvasAreaRef, scale } = useFitScale();

  // TODO fase salvataggio: gli elementi verranno letti e salvati su Firestore
  const [elements, setElements] = useState<StageElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addShape = (type: ShapeType, position = spawnPosition(elements.length)) => {
    const label = type === 'text' ? t('setupEditor.shapes.text') : '';
    const element = createElement(type, generateItemId(), position, label);
    setElements(current => [...current, element]);
    setSelectedId(element.id);
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setElements(current => removeElement(current, selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // Canc/Backspace elimina la forma selezionata (non mentre si scrive in un campo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  if (!tourId || !artistId) {
    return <Navigate to="/tours" replace />;
  }

  if (!isSetupKey(setupKey)) {
    return <Navigate to={artistPath(tourId, artistId)} replace />;
  }

  return (
    <div className="se-page">
      <div className="se-header">
        <button type="button" className="se-back" onClick={() => navigate(artistPath(tourId, artistId))}>
          <FontAwesomeIcon icon={faArrowLeft} /> {t('setupEditor.back')}
        </button>
        <div className="se-heading">
          <h1>{t(setupKey === 'a' ? 'setupEditor.titleA' : 'setupEditor.titleB')}</h1>
          {artist && <p>{artist.name}</p>}
        </div>
      </div>
      <p className="se-notice">{t('setupEditor.previewNotice')}</p>

      {loading && <LoadingState />}
      {!loading && !artist && <div className="error">{t('artistDetail.notFound')}</div>}

      {!loading && artist && (
        <div className="se-body">
          <ShapePalette onAdd={type => addShape(type)} />

          <div className="se-workspace">
            <div className="se-canvas-area" ref={canvasAreaRef}>
              <StageCanvas
                elements={elements}
                selectedId={selectedId}
                scale={scale}
                ariaLabel={t('setupEditor.canvasLabel')}
                onSelect={setSelectedId}
                onMove={(id, x, y) => setElements(current => moveElement(current, id, x, y))}
                onTransform={(id, result: TransformResult) => setElements(current => transformElement(current, id, result))}
                onDropShape={(type, position) => addShape(type, position)}
              />
            </div>

            <div className="se-actions">
              <button type="button" className="se-action se-action--danger" onClick={deleteSelected} disabled={!selectedId}>
                <FontAwesomeIcon icon={faTrash} /> {t('setupEditor.deleteShape')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupEditor;
