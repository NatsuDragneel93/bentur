import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  faArrowLeft,
  faCircleQuestion,
  faDownload,
  faExpand,
  faFloppyDisk,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPen,
  faRotateLeft,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import LoadingState from '../../../components/ui/LoadingState';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Dialog from '../../../components/ui/Dialog';
import Button from '../../../components/ui/Button';
import IconButton from '../../../components/ui/IconButton';
import { useToast } from '../../../hooks/useToast';
import { useRequiredUser } from '../../../hooks/useAuth';
import { COMPACT_MEDIA_QUERY, MOBILE_MEDIA_QUERY, useMediaQuery } from '../../../hooks/useMediaQuery';
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
  hasDefaultLabel,
  MAX_STAGE_ELEMENTS,
  MAX_ZOOM,
  moveElement,
  Point,
  removeElement,
  reorderElement,
  sameElements,
  ShapeType,
  Size,
  spawnPosition,
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
import GestureHelp from './GestureHelp';
import { hasSeenGestureHelp, markGestureHelpSeen } from './gestureHelpStorage';
import ShapePalette from './ShapePalette';
import ShapeProperties from './ShapeProperties';
import StageCanvas, { StageCanvasHandle } from './StageCanvas';
import { STAGE_BACKGROUND } from './stageTheme';
import './SetupEditor.scss';

const BUTTON_ZOOM_FACTOR = 1.25;

// Margine tra il bordo della tela e il palco a zoom 1 (lascia spazio alla scritta "Pubblico")
const STAGE_MARGIN = 32;
const STAGE_MARGIN_MOBILE = 16;

// Spazio disponibile per la tela e scala del palco adattata (ricalcolati quando la finestra cambia)
const useFitScale = (margin: number) => {
  // Callback ref: il contenitore compare solo dopo il caricamento
  const [container, ref] = useState<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    if (!container) return;

    const update = () => setViewport({ width: container.clientWidth, height: container.clientHeight });
    update();

    // ResizeObserver manca solo in ambienti di test
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  return { ref, viewport, scale: fitScale(viewport.width - margin * 2, viewport.height - margin * 2) };
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
  // Cellulare: palette in basso e barra su due righe
  const mobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  // Tablet e cellulare: il pannello proprietà si apre in primo piano
  const compact = useMediaQuery(COMPACT_MEDIA_QUERY);
  const { ref: canvasAreaRef, viewport, scale } = useFitScale(mobile ? STAGE_MARGIN_MOBILE : STAGE_MARGIN);
  const canvasRef = useRef<StageCanvasHandle>(null);

  // Ultima versione salvata (o letta) su Firestore: null finché non è caricata
  const [saved, setSaved] = useState<StageSetup | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [history, setHistory] = useState<History<StageElement[]>>(() => createHistory([]));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [storedView, setView] = useState<StageView>(DEFAULT_VIEW);
  const [saving, setSaving] = useState(false);
  // Su tablet e cellulare il pannello proprietà si apre solo su richiesta (Modifica o doppio tocco)
  const [editing, setEditing] = useState(false);
  // Aiuto sui gesti: aperto da solo al primo accesso
  const [helpOpen, setHelpOpen] = useState(() => !hasSeenGestureHelp());

  // Dialoghi
  const [conflict, setConflict] = useState<StageSetup | null>(null);
  const [copySource, setCopySource] = useState<StageElement[] | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const elements = history.present;
  // La vista resta valida anche quando la scala cambia (es. rotazione del telefono)
  const view = clampView(storedView, scale, viewport);
  const selectedIndex = elements.findIndex(element => element.id === selectedId);
  const selected = selectedIndex === -1 ? null : elements[selectedIndex];
  const dirty = saved !== null && !sameElements(elements, saved.elements);
  const validSetupKey = isSetupKey(setupKey) ? setupKey : null;
  const showPropertiesSheet = compact && editing && selected !== null;

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

  // Selezionando nel vuoto (o un'altra forma senza pannello aperto) il pannello si chiude
  const selectShape = (id: string | null) => {
    setSelectedId(id);
    if (!id) setEditing(false);
  };

  const editShape = (id: string) => {
    setSelectedId(id);
    setEditing(true);
  };

  const closeHelp = () => {
    setHelpOpen(false);
    markGestureHelpSeen();
  };

  const addShape = (type: ShapeType, position?: Point) => {
    if (elements.length >= MAX_STAGE_ELEMENTS) {
      showError(t('setupEditor.tooManyShapes', { max: MAX_STAGE_ELEMENTS }));
      return;
    }
    const label = hasDefaultLabel(type) ? t(`setupEditor.shapes.${type}`) : '';
    const element = createElement(type, generateItemId(), position ?? spawnPosition(elements.length, visibleCenter(view, scale, viewport)), label);
    applyChange(current => [...current, element]);
    setSelectedId(element.id);
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    applyChange(current => removeElement(current, selectedId));
    setSelectedId(null);
    setEditing(false);
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
    setView(zoomAt(view, scale, viewport, { x: viewport.width / 2, y: viewport.height / 2 }, factor));

  if (!tourId || !artistId) {
    return <Navigate to="/tours" replace />;
  }

  if (!validSetupKey) {
    return <Navigate to={artistPath(tourId, artistId)} replace />;
  }

  const goBack = () => navigate(artistPath(tourId, artistId));
  const requestBack = () => (dirty ? setConfirmLeave(true) : goBack());
  const backLabel = artist?.name ?? t('setupEditor.back');

  const propertiesPanel = (
    <ShapeProperties
      element={selected}
      variant={compact ? 'sheet' : 'side'}
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
      // PC: chiude deselezionando; tablet e cellulare: chiude il pannello lasciando la forma selezionata
      onClose={() => (compact ? setEditing(false) : selectShape(null))}
    />
  );
  const loading = loadingArtist || (artist !== null && loadingSetup);
  const ready = !loading && artist !== null && saved !== null;

  return (
    <div className="se-page">
      <header className="se-header">
        {mobile ? (
          <IconButton icon={faArrowLeft} className="se-back" onClick={requestBack} label={backLabel} />
        ) : (
          <Button icon={faArrowLeft} className="se-back" onClick={requestBack}>
            <span>{backLabel}</span>
          </Button>
        )}

        <div className="se-heading">
          <h1>{t(validSetupKey === 'a' ? 'setupEditor.titleA' : 'setupEditor.titleB')}</h1>
          {artist && <p>{artist.name} · {artist.role}</p>}
        </div>

        {ready && (
          <>
            <div className="se-tools">
              <span className={`se-status ${dirty ? 'se-status--dirty' : ''}`} role="status">
                {t(saving ? 'setupEditor.toolbar.saving' : dirty ? 'setupEditor.toolbar.unsaved' : 'setupEditor.toolbar.saved')}
              </span>

              <IconButton
                icon={faRotateLeft}
                onClick={() => setHistory(undo)}
                disabled={history.past.length === 0}
                label={t('setupEditor.toolbar.undo')}
              />
              <IconButton
                icon={faRotateRight}
                onClick={() => setHistory(redo)}
                disabled={history.future.length === 0}
                label={t('setupEditor.toolbar.redo')}
              />
              <IconButton
                icon={faMagnifyingGlassMinus}
                onClick={() => zoomFromCenter(1 / BUTTON_ZOOM_FACTOR)}
                disabled={view.zoom <= 1}
                label={t('setupEditor.toolbar.zoomOut')}
              />
              <IconButton
                icon={faMagnifyingGlassPlus}
                onClick={() => zoomFromCenter(BUTTON_ZOOM_FACTOR)}
                disabled={view.zoom >= MAX_ZOOM}
                label={t('setupEditor.toolbar.zoomIn')}
              />
              <IconButton
                icon={faExpand}
                onClick={() => setView(DEFAULT_VIEW)}
                disabled={view.zoom <= 1}
                label={t('setupEditor.toolbar.resetZoom')}
              />
              <IconButton icon={faDownload} onClick={exportImage} label={t('setupEditor.toolbar.export')} />
              <IconButton
                icon={faCircleQuestion}
                onClick={() => (helpOpen ? closeHelp() : setHelpOpen(true))}
                aria-pressed={helpOpen}
                label={t('setupEditor.toolbar.help')}
              />

              {compact && selected && !editing && (
                <Button variant="primary" icon={faPen} className="se-edit" onClick={() => setEditing(true)}>
                  {t('setupEditor.toolbar.edit')}
                </Button>
              )}
            </div>

            <Button
              variant="primary"
              icon={faFloppyDisk}
              className="se-save"
              onClick={() => save()}
              disabled={!dirty || saving}
            >
              {t('setupEditor.toolbar.save')}
            </Button>
          </>
        )}
      </header>

      {loading && <LoadingState />}
      {!loading && !artist && <p className="bt-empty se-message">{t('artistDetail.notFound')}</p>}
      {!loading && artist && !saved && <p className="bt-empty se-message">{t('setupEditor.loadError')}</p>}

      {ready && (
        <div className="se-body">
          {!mobile && <ShapePalette onAdd={type => addShape(type)} />}

          <div className="se-workspace">
            {/* In sovrimpressione: non toglie spazio al palco */}
            {helpOpen && <GestureHelp mobile={mobile} compact={compact} onClose={closeHelp} />}

            <div className="se-canvas-area" ref={canvasAreaRef} style={{ backgroundColor: STAGE_BACKGROUND }}>
              <StageCanvas
                ref={canvasRef}
                elements={elements}
                selectedId={selectedId}
                baseScale={scale}
                viewport={viewport}
                view={view}
                ariaLabel={t('setupEditor.canvasLabel')}
                audienceLabel={t('setupEditor.audience')}
                onViewChange={setView}
                onSelect={selectShape}
                onEdit={editShape}
                onMove={(id, x, y) => applyChange(current => moveElement(current, id, x, y))}
                onTransform={(id, result) => applyChange(current => transformElement(current, id, result))}
                onDropShape={addShape}
              />
            </div>
          </div>

          {mobile && <ShapePalette onAdd={type => addShape(type)} />}
          {!compact && propertiesPanel}
        </div>
      )}

      {/* Tablet e cellulare: nome e colori in primo piano sopra il palco, agganciati alla pagina */}
      {showPropertiesSheet && createPortal(
        <div
          className="se-sheet-backdrop"
          onClick={e => {
            // Toccando fuori dal pannello si chiude, come con "Fatto"
            if (e.target === e.currentTarget) setEditing(false);
          }}
        >
          <div className="se-sheet" role="dialog" aria-modal="true" aria-label={t('setupEditor.properties.title')}>
            {propertiesPanel}
          </div>
        </div>,
        document.body
      )}

      <Dialog
        open={conflict !== null}
        title={t('setupEditor.conflict.title')}
        onClose={() => setConflict(null)}
        preventClose={saving}
      >
        <p className="dialog-body">
          {conflict?.updatedBy?.name
            ? t('setupEditor.conflict.messageNamed', { name: conflict.updatedBy.name })
            : t('setupEditor.conflict.message')}
        </p>
        <div className="bt-dialog-stack">
          <Button variant="primary" onClick={loadRemoteVersion} disabled={saving}>
            {t('setupEditor.conflict.loadTheirs')}
          </Button>
          <Button danger onClick={() => save(true)} disabled={saving}>
            {t('setupEditor.conflict.overwrite')}
          </Button>
          <Button onClick={() => setConflict(null)} disabled={saving}>
            {t('common.cancel')}
          </Button>
        </div>
      </Dialog>

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
