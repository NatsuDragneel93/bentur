import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  faArrowLeft,
  faCheck,
  faCircleQuestion,
  faCopy,
  faDownload,
  faExpand,
  faFloppyDisk,
  faHouse,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPen,
  faRotateLeft,
  faRotateRight,
  faTrashCan,
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
  applyTransforms,
  clampView,
  copyElements,
  createElement,
  DEFAULT_VIEW,
  duplicateElement,
  duplicateElements,
  exportFileName,
  fitScale,
  hasDefaultLabel,
  MAX_STAGE_ELEMENTS,
  MAX_ZOOM,
  moveElement,
  moveElementsBy,
  PlacementResult,
  Point,
  removeElements,
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

type LeaveTarget = 'artist' | 'home';

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
  // Forme correnti lette dalle scorciatoie da tastiera, senza riagganciare l'ascoltatore a ogni modifica
  const elementsRef = useRef<StageElement[]>([]);

  // Ultima versione salvata (o letta) su Firestore: null finché non è caricata
  const [saved, setSaved] = useState<StageSetup | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [history, setHistory] = useState<History<StageElement[]>>(() => createHistory([]));
  // Selezione corrente, nell'ordine in cui è stata fatta
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Touch: dopo una pressione prolungata ogni tocco aggiunge o toglie una forma dalla selezione
  const [multiSelectMode, setMultiSelectMode] = useState(false);
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
  const [leaveTarget, setLeaveTarget] = useState<LeaveTarget>('artist');

  const elements = history.present;
  // La vista resta valida anche quando la scala cambia (es. rotazione del telefono)
  const view = clampView(storedView, scale, viewport);
  // Nome e colori si cambiano su una forma sola: con più forme il pannello mostra solo le azioni di gruppo
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedIndex = elements.findIndex(element => element.id === selectedId);
  const selected = selectedIndex === -1 ? null : elements[selectedIndex];
  const dirty = saved !== null && !sameElements(elements, saved.elements);
  elementsRef.current = elements;
  const validSetupKey = isSetupKey(setupKey) ? setupKey : null;
  const showPropertiesSheet = compact && editing && selected !== null;
  // Barra delle azioni di gruppo: in multiselezione da touch, o quando manca il pannello laterale
  // (su PC conteggio e azioni sono già nel pannello a destra)
  const showMultiBar = multiSelectMode || (compact && selectedIds.length > 1);

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
        setSelectedIds([]);

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
  const selectShape = (id: string | null, additive = false) => {
    if (!id) {
      setSelectedIds([]);
      setEditing(false);
      setMultiSelectMode(false);
      return;
    }
    if (!additive) {
      setSelectedIds([id]);
      return;
    }
    // Ctrl+clic o multiselezione: la forma già selezionata esce dalla selezione
    setSelectedIds(current => (current.includes(id) ? current.filter(other => other !== id) : [...current, id]));
    setEditing(false);
  };

  // Fine del rettangolo di selezione
  const selectShapes = (ids: string[], additive: boolean) => {
    setEditing(false);
    setSelectedIds(current => (additive ? [...current, ...ids.filter(id => !current.includes(id))] : ids));
  };

  const editShape = (id: string) => {
    setSelectedIds([id]);
    setEditing(true);
  };

  // Touch: pressione prolungata su una forma
  const startMultiSelect = (id: string) => {
    setMultiSelectMode(true);
    setEditing(false);
    setSelectedIds(current => (current.includes(id) ? current : [...current, id]));
  };

  const exitMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedIds([]);
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
    setSelectedIds([element.id]);
  };

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    applyChange(current => removeElements(current, selectedIds));
    setSelectedIds([]);
    setEditing(false);
    setMultiSelectMode(false);
  }, [selectedIds, applyChange]);

  const duplicateSelected = () => {
    if (selectedIds.length === 0) return;
    if (elements.length + selectedIds.length > MAX_STAGE_ELEMENTS) {
      showError(t('setupEditor.tooManyShapes', { max: MAX_STAGE_ELEMENTS }));
      return;
    }

    // Una forma sola: stessa logica di prima; più forme: copie di tutta la selezione
    if (selectedIds.length === 1) {
      const newId = generateItemId();
      applyChange(current => duplicateElement(current, selectedIds[0], newId));
      setSelectedIds([newId]);
      return;
    }

    const { elements: copied, newIds } = duplicateElements(elements, selectedIds, generateItemId);
    applyChange(() => copied);
    setSelectedIds(newIds);
  };

  // Scorciatoie: Canc elimina, Esc deseleziona, Ctrl+A seleziona tutto,
  // Ctrl+Z annulla, Ctrl+Y / Ctrl+Maiusc+Z ripristina (non mentre si scrive)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingText(e.target)) return;

      const key = e.key.toLowerCase();
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
        setEditing(false);
        setMultiSelectMode(false);
      } else if ((e.ctrlKey || e.metaKey) && key === 'a') {
        e.preventDefault();
        setSelectedIds(elementsRef.current.map(element => element.id));
        setEditing(false);
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
    setSelectedIds([]);
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
  const goHome = () => navigate('/home');

  const runLeave = (target: LeaveTarget) => {
    if (target === 'home') {
      goHome();
      return;
    }
    goBack();
  };

  const requestLeave = (target: LeaveTarget) => {
    if (dirty) {
      setLeaveTarget(target);
      setConfirmLeave(true);
      return;
    }
    runLeave(target);
  };

  const requestBack = () => requestLeave('artist');
  const requestHome = () => requestLeave('home');
  const backLabel = artist?.name ?? t('setupEditor.back');

  const propertiesPanel = (
    <ShapeProperties
      element={selected}
      selectedCount={selectedIds.length}
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
        <div className="se-nav">
          {mobile ? (
            <>
              <IconButton icon={faArrowLeft} className="se-back" onClick={requestBack} label={backLabel} />
              <IconButton icon={faHouse} className="se-home" onClick={requestHome} label={t('nav.home')} />
            </>
          ) : (
            <>
              <Button icon={faArrowLeft} className="se-back" onClick={requestBack}>
                <span>{backLabel}</span>
              </Button>
              <Button icon={faHouse} className="se-home" onClick={requestHome}>
                <span>{t('nav.home')}</span>
              </Button>
            </>
          )}
        </div>

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

            {showMultiBar && (
              <div className="se-multibar" role="toolbar" aria-label={t('setupEditor.multi.title')}>
                <span className="se-multibar-count">
                  {t('setupEditor.multi.selected', { count: selectedIds.length })}
                </span>
                <Button icon={faCopy} onClick={duplicateSelected} disabled={selectedIds.length === 0}>
                  {t('setupEditor.properties.duplicate')}
                </Button>
                <Button icon={faTrashCan} danger onClick={deleteSelected} disabled={selectedIds.length === 0}>
                  {t('setupEditor.deleteShape')}
                </Button>
                <Button variant="primary" icon={faCheck} onClick={exitMultiSelect}>
                  {t('setupEditor.multi.exit')}
                </Button>
              </div>
            )}

            <div className="se-canvas-area" ref={canvasAreaRef} style={{ backgroundColor: STAGE_BACKGROUND }}>
              <StageCanvas
                ref={canvasRef}
                elements={elements}
                selectedIds={selectedIds}
                multiSelectMode={multiSelectMode}
                baseScale={scale}
                viewport={viewport}
                view={view}
                ariaLabel={t('setupEditor.canvasLabel')}
                audienceLabel={t('setupEditor.audience')}
                onViewChange={setView}
                onSelect={selectShape}
                onSelectMany={selectShapes}
                onEdit={editShape}
                onLongPress={startMultiSelect}
                onMove={(id, x, y) => applyChange(current => moveElement(current, id, x, y))}
                onMoveMany={(dx, dy) => applyChange(current => moveElementsBy(current, selectedIds, dx, dy))}
                onTransform={(id, result) => applyChange(current => transformElement(current, id, result))}
                onTransformMany={(results: PlacementResult[]) => applyChange(current => applyTransforms(current, results))}
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
        onConfirm={() => {
          setConfirmLeave(false);
          runLeave(leaveTarget);
        }}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  );
};

export default SetupEditor;
