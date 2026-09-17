import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faDownload,
  faExpand,
  faFloppyDisk,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faRotateLeft,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import './SetupEditor.scss';
import LoadingState from '../../../components/ui/LoadingState';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../hooks/useToast';
import { useRequiredUser } from '../../../hooks/useAuth';
import artistSetupsService, { StageSetup } from '../../../services/artistSetups.service';
import { generateItemId } from '../../../utils/categoryItems';
import { commit, createHistory, History, redo, undo } from '../../../utils/history';
import {
  clampView,
  copyElements,
  createElement,
  DEFAULT_VIEW,
  duplicateElement,
  exportFileName,
  fitScale,
  MAX_STAGE_ELEMENTS,
  MAX_ZOOM,
  moveElement,
  Point,
  removeElement,
  reorderElement,
  sameElements,
  ShapeType,
  spawnPosition,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  StageElement,
  StageView,
  transformElement,
  updateElement,
  visibleCenter,
  zoomAt,
} from '../../../utils/stagePlot';
import { artistPath } from '../artist-lists/artistListPaths';
import { useTourArtist } from '../useTourArtist';
import { isSetupKey } from './setupPaths';
import ShapePalette from './ShapePalette';
import ShapeProperties from './ShapeProperties';
import StageCanvas, { StageCanvasHandle } from './StageCanvas';

const BUTTON_ZOOM_FACTOR = 1.25;

// Scala del palco adattata allo spazio disponibile (ricalcolata quando la finestra cambia)
const useFitScale = () => {
  // Callback ref: il contenitore compare solo dopo il caricamento
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

// Avviso del browser chiudendo o ricaricando la pagina con modifiche non salvate
const useUnsavedChangesWarning = (dirty: boolean) => {
  useEffect(() => {
    if (!dirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);
};

const isEditingText = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]') !== null;

// Editor della disposizione del palco: /tours/:tourId/artists/:artistId/setup/:setupKey
const SetupEditor: React.FC = () => {
  const { tourId, artistId, setupKey } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const user = useRequiredUser();
  const { artist, loading: loadingArtist } = useTourArtist(tourId, artistId);
  const { ref: canvasAreaRef, scale } = useFitScale();
  const canvasRef = useRef<StageCanvasHandle>(null);

  // Ultima versione salvata (o letta) su Firestore: null finché non è caricata
  const [saved, setSaved] = useState<StageSetup | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [history, setHistory] = useState<History<StageElement[]>>(() => createHistory([]));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [storedView, setView] = useState<StageView>(DEFAULT_VIEW);
  const [saving, setSaving] = useState(false);

  // Dialoghi
  const [conflict, setConflict] = useState<StageSetup | null>(null);
  const [copySource, setCopySource] = useState<StageElement[] | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const elements = history.present;
  // La vista resta valida anche quando la scala cambia (es. rotazione del telefono)
  const view = clampView(storedView, scale);
  const selectedIndex = elements.findIndex(element => element.id === selectedId);
  const selected = selectedIndex === -1 ? null : elements[selectedIndex];
  const dirty = saved !== null && !sameElements(elements, saved.elements);
  const validSetupKey = isSetupKey(setupKey) ? setupKey : null;

  useUnsavedChangesWarning(dirty);

  // Caricamento del setup; il Setup B vuoto propone di copiare il Setup A
  useEffect(() => {
    if (!tourId || !artistId || !validSetupKey || !artist) return;
    let cancelled = false;

    const load = async () => {
      try {
        const setup = await artistSetupsService.getSetup(tourId, artistId, validSetupKey);
        if (cancelled) return;
        setSaved(setup);
        setHistory(createHistory(setup.elements));
        setSelectedId(null);

        if (validSetupKey === 'b' && setup.elements.length === 0) {
          const setupA = await artistSetupsService.getSetup(tourId, artistId, 'a').catch(error => {
            // Senza Setup A si parte semplicemente da vuoto
            console.error('Error loading setup A:', error);
            return null;
          });
          if (!cancelled && setupA && setupA.elements.length > 0) setCopySource(setupA.elements);
        }
      } catch (error) {
        console.error('Error loading setup:', error);
        showError(t('setupEditor.loadError'));
      }
    };

    setLoadingSetup(true);
    load().finally(() => {
      if (!cancelled) setLoadingSetup(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tourId, artistId, validSetupKey, artist, showError, t]);

  // Ogni modifica passa dalla cronologia (annulla/ripristina)
  const applyChange = useCallback((change: (current: StageElement[]) => StageElement[], mergeKey?: string) => {
    setHistory(current => commit(current, change(current.present), mergeKey));
  }, []);

  const addShape = (type: ShapeType, position?: Point) => {
    if (elements.length >= MAX_STAGE_ELEMENTS) {
      showError(t('setupEditor.tooManyShapes', { max: MAX_STAGE_ELEMENTS }));
      return;
    }
    const label = type === 'text' ? t('setupEditor.shapes.text') : '';
    const element = createElement(type, generateItemId(), position ?? spawnPosition(elements.length, visibleCenter(view, scale)), label);
    applyChange(current => [...current, element]);
    setSelectedId(element.id);
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    applyChange(current => removeElement(current, selectedId));
    setSelectedId(null);
  }, [selectedId, applyChange]);

  const duplicateSelected = () => {
    if (!selectedId) return;
    const newId = generateItemId();
    applyChange(current => duplicateElement(current, selectedId, newId));
    setSelectedId(newId);
  };

  // Scorciatoie: Canc elimina, Ctrl+Z annulla, Ctrl+Y / Ctrl+Maiusc+Z ripristina (non mentre si scrive)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingText(e.target)) return;

      const key = e.key.toLowerCase();
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        setHistory(e.shiftKey ? redo : undo);
      } else if ((e.ctrlKey || e.metaKey) && key === 'y') {
        e.preventDefault();
        setHistory(redo);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  const save = async (force = false) => {
    if (!tourId || !artistId || !validSetupKey || !saved || saving) return;

    setSaving(true);
    try {
      const result = await artistSetupsService.saveSetup(tourId, artistId, validSetupKey, elements, {
        user: { uid: user.uid, name: user.displayName || t('auth.defaultUserName') },
        baseUpdatedAt: saved.updatedAt,
        force,
      });

      if (result.status === 'conflict') {
        setConflict(result.remote);
        return;
      }
      setSaved(result.setup);
      setConflict(null);
      showSuccess(t('setupEditor.saveSuccess'));
    } catch (error) {
      console.error('Error saving setup:', error);
      showError(t('setupEditor.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // Conflitto: si scartano le proprie modifiche e si riparte dalla versione salvata dall'altro utente
  const loadRemoteVersion = () => {
    if (!conflict) return;
    setSaved(conflict);
    setHistory(createHistory(conflict.elements));
    setSelectedId(null);
    setConflict(null);
  };

  const exportImage = () => {
    const dataUrl = canvasRef.current?.exportImage();
    if (!dataUrl || !artist || !validSetupKey) {
      showError(t('setupEditor.exportError'));
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = exportFileName(artist.name, validSetupKey);
    link.click();
  };

  const zoomFromCenter = (factor: number) =>
    setView(zoomAt(view, scale, { x: STAGE_WIDTH * scale / 2, y: STAGE_HEIGHT * scale / 2 }, factor));

  if (!tourId || !artistId) {
    return <Navigate to="/tours" replace />;
  }

  if (!validSetupKey) {
    return <Navigate to={artistPath(tourId, artistId)} replace />;
  }

  const goBack = () => navigate(artistPath(tourId, artistId));
  const loading = loadingArtist || (artist !== null && loadingSetup);

  return (
    <div className="se-page">
      <div className="se-header">
        <button type="button" className="se-back" onClick={() => (dirty ? setConfirmLeave(true) : goBack())}>
          <FontAwesomeIcon icon={faArrowLeft} /> {t('setupEditor.back')}
        </button>
        <div className="se-heading">
          <h1>{t(validSetupKey === 'a' ? 'setupEditor.titleA' : 'setupEditor.titleB')}</h1>
          {artist && <p>{artist.name}</p>}
        </div>
      </div>

      {loading && <LoadingState />}
      {!loading && !artist && <div className="error">{t('artistDetail.notFound')}</div>}
      {!loading && artist && !saved && <div className="error">{t('setupEditor.loadError')}</div>}

      {!loading && artist && saved && (
        <div className="se-body">
          <ShapePalette onAdd={type => addShape(type)} />

          <div className="se-workspace">
            <div className="se-toolbar">
              <div className="se-toolbar-group">
                <button
                  type="button"
                  className="se-icon-button"
                  onClick={() => setHistory(undo)}
                  disabled={history.past.length === 0}
                  title={t('setupEditor.toolbar.undo')}
                  aria-label={t('setupEditor.toolbar.undo')}
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                </button>
                <button
                  type="button"
                  className="se-icon-button"
                  onClick={() => setHistory(redo)}
                  disabled={history.future.length === 0}
                  title={t('setupEditor.toolbar.redo')}
                  aria-label={t('setupEditor.toolbar.redo')}
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                </button>
              </div>

              <div className="se-toolbar-group">
                <button
                  type="button"
                  className="se-icon-button"
                  onClick={() => zoomFromCenter(1 / BUTTON_ZOOM_FACTOR)}
                  disabled={view.zoom <= 1}
                  title={t('setupEditor.toolbar.zoomOut')}
                  aria-label={t('setupEditor.toolbar.zoomOut')}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
                </button>
                <button
                  type="button"
                  className="se-icon-button"
                  onClick={() => zoomFromCenter(BUTTON_ZOOM_FACTOR)}
                  disabled={view.zoom >= MAX_ZOOM}
                  title={t('setupEditor.toolbar.zoomIn')}
                  aria-label={t('setupEditor.toolbar.zoomIn')}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
                </button>
                <button
                  type="button"
                  className="se-icon-button"
                  onClick={() => setView(DEFAULT_VIEW)}
                  disabled={view.zoom <= 1}
                  title={t('setupEditor.toolbar.resetZoom')}
                  aria-label={t('setupEditor.toolbar.resetZoom')}
                >
                  <FontAwesomeIcon icon={faExpand} />
                </button>
              </div>

              <div className="se-toolbar-group">
                <button
                  type="button"
                  className="se-icon-button"
                  onClick={exportImage}
                  title={t('setupEditor.toolbar.export')}
                  aria-label={t('setupEditor.toolbar.export')}
                >
                  <FontAwesomeIcon icon={faDownload} />
                </button>
              </div>

              <span className={`se-status ${dirty ? 'se-status--dirty' : ''}`} role="status">
                {t(saving ? 'setupEditor.toolbar.saving' : dirty ? 'setupEditor.toolbar.unsaved' : 'setupEditor.toolbar.saved')}
              </span>

              <button type="button" className="se-save" onClick={() => save()} disabled={!dirty || saving}>
                <FontAwesomeIcon icon={faFloppyDisk} /> {t('setupEditor.toolbar.save')}
              </button>
            </div>

            <div className="se-canvas-area" ref={canvasAreaRef}>
              <StageCanvas
                ref={canvasRef}
                elements={elements}
                selectedId={selectedId}
                baseScale={scale}
                view={view}
                ariaLabel={t('setupEditor.canvasLabel')}
                onViewChange={setView}
                onSelect={setSelectedId}
                onMove={(id, x, y) => applyChange(current => moveElement(current, id, x, y))}
                onTransform={(id, result) => applyChange(current => transformElement(current, id, result))}
                onDropShape={addShape}
              />
            </div>
          </div>

          <ShapeProperties
            element={selected}
            canBringForward={selectedIndex !== -1 && selectedIndex < elements.length - 1}
            canSendBackward={selectedIndex > 0}
            onChange={(field, value) => {
              if (!selectedId) return;
              // Lettere consecutive nello stesso campo = un solo passo da annullare
              applyChange(current => updateElement(current, selectedId, { [field]: value }), `${field}:${selectedId}`);
            }}
            onDuplicate={duplicateSelected}
            onBringForward={() => selectedId && applyChange(current => reorderElement(current, selectedId, 'forward'))}
            onSendBackward={() => selectedId && applyChange(current => reorderElement(current, selectedId, 'backward'))}
            onDelete={deleteSelected}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}

      <Modal
        open={conflict !== null}
        title={t('setupEditor.conflict.title')}
        onClose={() => setConflict(null)}
        preventClose={saving}
      >
        <p className="bt-modal__message">
          {conflict?.updatedBy?.name
            ? t('setupEditor.conflict.messageNamed', { name: conflict.updatedBy.name })
            : t('setupEditor.conflict.message')}
        </p>
        <div className="se-conflict-actions">
          <button type="button" className="bt-button bt-button--primary" onClick={loadRemoteVersion} disabled={saving}>
            {t('setupEditor.conflict.loadTheirs')}
          </button>
          <button type="button" className="bt-button bt-button--danger" onClick={() => save(true)} disabled={saving}>
            {t('setupEditor.conflict.overwrite')}
          </button>
          <button type="button" className="bt-button bt-button--secondary" onClick={() => setConflict(null)} disabled={saving}>
            {t('common.cancel')}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={copySource !== null}
        message={t('setupEditor.copyFromA.message')}
        confirmLabel={t('setupEditor.copyFromA.confirm')}
        cancelLabel={t('setupEditor.copyFromA.cancel')}
        onConfirm={() => {
          if (copySource) applyChange(() => copyElements(copySource, generateItemId));
          setCopySource(null);
        }}
        onCancel={() => setCopySource(null)}
      />

      <ConfirmDialog
        open={confirmLeave}
        message={t('setupEditor.leaveConfirm.message')}
        confirmLabel={t('setupEditor.leaveConfirm.confirm')}
        onConfirm={goBack}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  );
};

export default SetupEditor;
