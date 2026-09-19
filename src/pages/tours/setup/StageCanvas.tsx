import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import Konva from 'konva';
import { Ellipse, Group, Layer, Line, Rect, Shape, Stage, Star, Text, Transformer } from 'react-konva';
import {
  clampView,
  isShapeType,
  keepsRatio,
  MIN_ELEMENT_SIZE,
  normalizeRect,
  PlacementResult,
  Point,
  ShapeType,
  Size,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  StageElement,
  StageView,
  TransformResult,
  zoomAt,
} from '../../../utils/stagePlot';
import { SHAPE_DRAG_TYPE } from './ShapePalette';
import { STAGE_ACCENT, STAGE_BACKGROUND, STAGE_BORDER, STAGE_CAPTION, STAGE_DOT, STAGE_FONT } from './stageTheme';

// Necessario per il pizzico a due dita mentre un dito sta già trascinando
Konva.hitOnDragEnabled = true;

const BACKGROUND_NAME = 'se-background';
const ELEMENT_NAME = 'se-element';
const WHEEL_ZOOM_FACTOR = 1.1;

// Pressione prolungata su una forma (touch): entra in multiselezione
const LONG_PRESS_MS = 500;
// Sotto questa soglia (in pixel sullo schermo) il trascinamento sullo sfondo è un semplice clic nel vuoto
const MARQUEE_MIN_SIZE = 4;

// Maniglie più grandi sui dispositivi touch
const isCoarsePointer = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

// Forme a colori pieni con angoli arrotondati e ombra morbida (come --shadow-md di Nocturne)
const BODY_NAME = 'se-body';
const SHADOW = { shadowColor: 'black', shadowOpacity: 0.55, shadowBlur: 18, shadowOffsetY: 6, shadowForStrokeEnabled: false };
// Ombra più ampia mentre si trascina: la forma sembra sollevata dal palco
const DRAG_SHADOW = { shadowBlur: 26, shadowOffsetY: 12 };

// Inizio e fine del trascinamento: la forma si solleva dal palco e poi si riappoggia
const liftShape = (node: Konva.Node) => {
  node.opacity(0.9);
  (node as Konva.Group).findOne(`.${BODY_NAME}`)?.setAttrs(DRAG_SHADOW);
};

const dropShape = (node: Konva.Node) => {
  node.opacity(1);
  (node as Konva.Group).findOne(`.${BODY_NAME}`)?.setAttrs({
    shadowBlur: SHADOW.shadowBlur,
    shadowOffsetY: SHADOW.shadowOffsetY,
  });
};

const DOT_SPACING = 26;
// Scritta "Pubblico" sotto il bordo del palco, in pixel sullo schermo
const CAPTION_FONT_SIZE = 10;
const CAPTION_GAP = 8;

// Sfondo a puntini del palco, disegnato come un'unica figura (migliaia di cerchi sarebbero lenti)
const DottedGrid: React.FC = () => (
  <Shape
    listening={false}
    perfectDrawEnabled={false}
    sceneFunc={context => {
      context.beginPath();
      for (let x = DOT_SPACING; x < STAGE_WIDTH; x += DOT_SPACING) {
        for (let y = DOT_SPACING; y < STAGE_HEIGHT; y += DOT_SPACING) {
          context.moveTo(x + 1.2, y);
          context.arc(x, y, 1.2, 0, Math.PI * 2);
        }
      }
      context.fillStyle = STAGE_DOT;
      context.fill();
    }}
  />
);

// Disegno di una forma, centrata nell'origine del gruppo
const ShapeBody: React.FC<{ element: StageElement }> = ({ element }) => {
  const { type, width, height, fill } = element;
  const common = { name: BODY_NAME, fill, perfectDrawEnabled: false, ...SHADOW };

  switch (type) {
    case 'circle':
      return <Ellipse radiusX={width / 2} radiusY={height / 2} {...common} />;
    case 'square':
    case 'rect':
      return (
        <Rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          cornerRadius={Math.min(10, width / 4, height / 4)}
          {...common}
        />
      );
    case 'triangle':
      // Bordo dello stesso colore con giunzioni arrotondate: punte morbide
      return (
        <Line
          points={[0, -height / 2, width / 2, height / 2, -width / 2, height / 2]}
          closed
          stroke={fill}
          strokeWidth={6}
          lineJoin="round"
          {...common}
        />
      );
    case 'star':
      return <Star numPoints={5} outerRadius={width / 2} innerRadius={width / 4.4} lineJoin="round" {...common} />;
    case 'line':
      return <Rect x={-width / 2} y={-height / 2} width={width} height={height} cornerRadius={height / 2} {...common} />;
    case 'text':
      // Area invisibile per poter selezionare e spostare il testo
      return <Rect x={-width / 2} y={-height / 2} width={width} height={height} fill="rgba(0,0,0,0.01)" />;
  }
};

const ShapeLabel: React.FC<{ element: StageElement }> = ({ element }) => {
  const { type, width, height, label, labelColor } = element;
  if (!label) return null;

  // Sulle linee il nome sta sopra (può essere più largo della linea), nelle altre forme al centro
  const isLine = type === 'line';
  const labelWidth = isLine ? Math.max(width, 140) : width;
  return (
    <Text
      text={label}
      x={-labelWidth / 2}
      y={isLine ? -height / 2 - 24 : -height / 2}
      width={labelWidth}
      height={isLine ? 22 : height}
      align="center"
      verticalAlign="middle"
      fontSize={type === 'text' ? 22 : 16}
      fontFamily={STAGE_FONT}
      fontStyle="500"
      fill={labelColor}
      padding={4}
      listening={false}
    />
  );
};

export interface StageCanvasHandle {
  // Immagine PNG dell'intero palco (senza maniglie di selezione), come data URL
  exportImage: () => string | null;
}

interface StageCanvasProps {
  ref?: React.Ref<StageCanvasHandle>;
  elements: StageElement[];
  selectedIds: string[];
  // Modalità multiselezione su touch: ogni tocco aggiunge o toglie una forma
  multiSelectMode: boolean;
  // Rapporto tra pixel sullo schermo e unità logiche del palco, senza zoom
  baseScale: number;
  // Dimensioni della tela: tutto lo spazio disponibile, il palco vi è centrato
  viewport: Size;
  view: StageView;
  ariaLabel: string;
  // Scritta sotto il bordo inferiore del palco (lato pubblico)
  audienceLabel: string;
  onViewChange: (view: StageView) => void;
  // additive = Ctrl/Cmd/Maiusc o modalità multiselezione: aggiunge o toglie dalla selezione
  onSelect: (id: string | null, additive?: boolean) => void;
  // Fine del rettangolo di selezione: le forme intersecate
  onSelectMany: (ids: string[], additive: boolean) => void;
  // Doppio clic / doppio tocco su una forma: apre nome e colori
  onEdit: (id: string) => void;
  // Pressione prolungata su una forma (touch): avvia la multiselezione
  onLongPress: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  // Spostamento in blocco: un unico delta per tutte le forme selezionate
  onMoveMany: (dx: number, dy: number) => void;
  onTransform: (id: string, result: TransformResult) => void;
  // Rotazione in blocco: posizione e rotazione di ogni forma selezionata
  onTransformMany: (results: PlacementResult[]) => void;
  onDropShape: (type: ShapeType, position: Point) => void;
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const middle = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const StageCanvas: React.FC<StageCanvasProps> = ({
  ref,
  elements,
  selectedIds,
  multiSelectMode,
  baseScale,
  viewport,
  view,
  ariaLabel,
  audienceLabel,
  onViewChange,
  onSelect,
  onSelectMany,
  onEdit,
  onLongPress,
  onMove,
  onMoveMany,
  onTransform,
  onTransformMany,
  onDropShape,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  // Stato del pizzico a due dita in corso
  const pinchRef = useRef<{ center: Point; distance: number } | null>(null);
  // Timer della pressione prolungata (touch) e segnale che è già scattata
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  // Rettangolo di selezione in corso (mouse), in unità logiche del palco
  const [marquee, setMarquee] = useState<{ start: Point; current: Point; additive: boolean } | null>(null);
  const multi = selectedIds.length > 1;
  const selected = !multi ? elements.find(element => element.id === selectedIds[0]) ?? null : null;
  const scale = baseScale * view.zoom;

  // Collega le maniglie di ridimensionamento/rotazione alle forme selezionate
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    const nodes = selectedIds.flatMap(id => {
      const node = stage.findOne(`#${id}`);
      return node ? [node] : [];
    });
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, elements]);

  // Il timer della pressione prolungata non deve sopravvivere alla pagina
  useEffect(() => () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }, []);

  const cancelLongPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    longPressRef.current = null;
  };

  useImperativeHandle(ref, () => ({
    exportImage: () => {
      const stage = stageRef.current;
      const transformer = transformerRef.current;
      if (!stage) return null;

      // Esporta il palco intero a 2000x1200 px, indipendentemente da zoom e schermo
      transformer?.visible(false);
      try {
        return stage.toDataURL({
          x: view.x,
          y: view.y,
          width: STAGE_WIDTH * scale,
          height: STAGE_HEIGHT * scale,
          pixelRatio: 2 / scale,
          mimeType: 'image/png',
        });
      } finally {
        transformer?.visible(true);
      }
    },
  }), [view, scale]);

  const isEmptyArea = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) =>
    e.target === e.target.getStage() || e.target.name() === BACKGROUND_NAME;

  // Mouse: trascinando sul vuoto si disegna il rettangolo di selezione (lo sfondo non sposta più la vista)
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isEmptyArea(e) || e.evt.button !== 0) return;

    const position = stageRef.current?.getRelativePointerPosition();
    if (!position) return;
    setMarquee({ start: position, current: position, additive: e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey });
  };

  const handleMouseMove = () => {
    const position = stageRef.current?.getRelativePointerPosition();
    if (marquee && position) setMarquee({ ...marquee, current: position });
  };

  const handleMouseUp = () => {
    if (!marquee) return;
    setMarquee(null);

    const stage = stageRef.current;
    const area = normalizeRect(marquee.start, marquee.current);
    // Trascinamento troppo corto in entrambe le direzioni: è un clic nel vuoto, quindi deseleziona
    // (un rettangolo basso e larghissimo serve invece a prendere una fila di forme)
    if (!stage || (area.width * scale < MARQUEE_MIN_SIZE && area.height * scale < MARQUEE_MIN_SIZE)) {
      if (!marquee.additive) onSelect(null);
      return;
    }

    // getClientRect tiene conto di rotazione, zoom e spostamento della vista
    const box = {
      x: area.x * scale + view.x,
      y: area.y * scale + view.y,
      width: area.width * scale,
      height: area.height * scale,
    };
    const ids = stage
      .find(`.${ELEMENT_NAME}`)
      .filter(node => Konva.Util.haveIntersection(box, node.getClientRect()))
      .map(node => node.id());
    onSelectMany(ids, marquee.additive);
  };

  const deselectOnTouch = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isEmptyArea(e)) onSelect(null);
  };

  // Clic/tocco su una forma: con Ctrl, Cmd, Maiusc o in multiselezione si aggiunge alla selezione
  const selectShape = (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Alzando il dito dopo una pressione prolungata Konva emette anche un tocco:
    // va ignorato, altrimenti toglierebbe subito la forma appena selezionata
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }

    const evt = e.evt as MouseEvent & TouchEvent;
    const additive = multiSelectMode || evt.ctrlKey || evt.metaKey || evt.shiftKey;
    // Premendo su una forma già selezionata la selezione non si riduce: così si può
    // trascinare tutto il gruppo partendo da una qualsiasi delle sue forme
    if (!additive && selectedIds.includes(id)) return;
    onSelect(id, additive);
  };

  const startLongPress = (id: string) => {
    cancelLongPress();
    longPressFiredRef.current = false;
    longPressRef.current = setTimeout(() => {
      longPressRef.current = null;
      longPressFiredRef.current = true;
      navigator.vibrate?.(30);
      onLongPress(id);
    }, LONG_PRESS_MS);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const type = e.dataTransfer.getData(SHAPE_DRAG_TYPE);
    const stage = stageRef.current;
    if (!stage || !isShapeType(type)) return;

    e.preventDefault();
    stage.setPointersPositions(e.nativeEvent);
    // Posizione già convertita in unità logiche (tiene conto di zoom e spostamento)
    const position = stage.getRelativePointerPosition();
    if (position) onDropShape(type, position);
  };

  // Rotazione di più forme insieme: Konva aggiorna posizione e rotazione di ogni nodo, non la scala
  const handleGroupTransformEnd = () => {
    const nodes = transformerRef.current?.nodes() ?? [];
    onTransformMany(nodes.map(node => ({ id: node.id(), x: node.x(), y: node.y(), rotation: node.rotation() })));
  };

  /**
   * Fine dello spostamento in blocco. Konva sposta insieme tutte le forme agganciate al riquadro
   * (trascinando una forma o l'area vuota del riquadro): basta misurare lo spostamento di una
   * per salvarlo su tutte, senza clampare ogni forma da sé e deformare la selezione.
   */
  const handleGroupDragEnd = () => {
    const first = transformerRef.current?.nodes()[0];
    const source = elements.find(element => element.id === first?.id());
    if (!first || !source) return;

    onMoveMany(first.x() - source.x, first.y() - source.y);
  };

  const handleTransformEnd = (element: StageElement, e: Konva.KonvaEventObject<Event>) => {
    // Con più forme selezionate se ne occupa il Transformer, una volta sola per tutte
    if (multi) return;

    const node = e.target;
    const result = { x: node.x(), y: node.y(), rotation: node.rotation(), scaleX: node.scaleX(), scaleY: node.scaleY() };
    // Le dimensioni diventano width/height: la scala del nodo torna a 1
    node.scale({ x: 1, y: 1 });
    onTransform(element.id, result);
  };

  // Rotella del mouse: zoom verso il puntatore
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;

    e.evt.preventDefault();
    const factor = e.evt.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR;
    onViewChange(zoomAt(view, baseScale, viewport, pointer, factor));
  };

  // Due dita: zoom (pizzico) e spostamento della vista insieme
  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const stage = stageRef.current;
    const [touch1, touch2] = Array.from(e.evt.touches);
    if (!stage || !touch1 || !touch2) return;

    e.evt.preventDefault();
    // Il pizzico ha la precedenza sul trascinamento iniziato con il primo dito
    if (stage.isDragging()) stage.stopDrag();
    stage.find(`.${ELEMENT_NAME}`).forEach(node => {
      if (node.isDragging()) node.stopDrag();
    });

    const rect = stage.container().getBoundingClientRect();
    const p1 = { x: touch1.clientX - rect.left, y: touch1.clientY - rect.top };
    const p2 = { x: touch2.clientX - rect.left, y: touch2.clientY - rect.top };
    const center = middle(p1, p2);
    const currentDistance = distance(p1, p2);

    const previous = pinchRef.current;
    pinchRef.current = { center, distance: currentDistance };
    if (!previous || previous.distance === 0) return;

    const zoomed = zoomAt(view, baseScale, viewport, center, currentDistance / previous.distance);
    onViewChange(clampView(
      { ...zoomed, x: zoomed.x + center.x - previous.center.x, y: zoomed.y + center.y - previous.center.y },
      baseScale,
      viewport
    ));
  };

  const coarse = isCoarsePointer();

  return (
    <div
      className="se-canvas"
      aria-label={ariaLabel}
      onDragOver={e => {
        if (e.dataTransfer.types.includes(SHAPE_DRAG_TYPE)) e.preventDefault();
      }}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={viewport.width}
        height={viewport.height}
        scaleX={scale}
        scaleY={scale}
        x={view.x}
        y={view.y}
        // Solo su touch: con lo zoom attivo si sposta la vista trascinando con un dito.
        // Col mouse il trascinamento sullo sfondo disegna il rettangolo di selezione.
        draggable={view.zoom > 1 && coarse}
        dragBoundFunc={pos => {
          const bounded = clampView({ zoom: view.zoom, x: pos.x, y: pos.y }, baseScale, viewport);
          return { x: bounded.x, y: bounded.y };
        }}
        onDragEnd={e => {
          if (e.target === stageRef.current) onViewChange({ zoom: view.zoom, x: e.target.x(), y: e.target.y() });
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        // Uscendo dalla tela il rettangolo si annulla, altrimenti resterebbe disegnato
        onMouseLeave={() => setMarquee(null)}
        onTouchStart={deselectOnTouch}
        onTouchMove={e => {
          cancelLongPress();
          handleTouchMove(e);
        }}
        onTouchEnd={() => {
          pinchRef.current = null;
          cancelLongPress();
        }}
      >
        <Layer>
          {/* Palco: area salvata ed esportata; intorno la tela continua con lo stesso sfondo */}
          <Rect
            name={BACKGROUND_NAME}
            width={STAGE_WIDTH}
            height={STAGE_HEIGHT}
            fill={STAGE_BACKGROUND}
            cornerRadius={4}
            stroke={STAGE_BORDER}
            strokeWidth={1}
            strokeScaleEnabled={false}
            dash={[6, 4]}
          />
          <DottedGrid />
          {/* Stessa dimensione sullo schermo a qualsiasi zoom; fuori dall'area esportata */}
          <Text
            text={audienceLabel.toUpperCase()}
            x={0}
            y={STAGE_HEIGHT + CAPTION_GAP / scale}
            width={STAGE_WIDTH}
            align="center"
            fontSize={CAPTION_FONT_SIZE / scale}
            fontFamily={STAGE_FONT}
            letterSpacing={2 / scale}
            fill={STAGE_CAPTION}
            listening={false}
          />

          {elements.map(element => (
            <Group
              key={element.id}
              id={element.id}
              name={ELEMENT_NAME}
              x={element.x}
              y={element.y}
              rotation={element.rotation}
              draggable
              onMouseDown={e => selectShape(element.id, e)}
              onTap={e => selectShape(element.id, e)}
              onTouchStart={() => startLongPress(element.id)}
              onTouchMove={cancelLongPress}
              onTouchEnd={cancelLongPress}
              onDblClick={() => onEdit(element.id)}
              onDblTap={() => onEdit(element.id)}
              onDragStart={e => {
                cancelLongPress();
                // Durante il trascinamento la forma "si solleva": ombra più ampia e leggera trasparenza.
                // Con più forme selezionate Konva trascina anche le altre, che passano di qui a loro volta.
                liftShape(e.target);
                if (!selectedIds.includes(element.id)) onSelect(element.id);
              }}
              onDragEnd={e => {
                // L'evento risale fino allo Stage: qui interessa solo la forma
                e.cancelBubble = true;
                dropShape(e.target);
                // Con più forme selezionate lo spostamento si salva una volta sola, dal riquadro
                if (!multi) onMove(element.id, e.target.x(), e.target.y());
              }}
              onTransformEnd={e => handleTransformEnd(element, e)}
            >
              <ShapeBody element={element} />
              <ShapeLabel element={element} />
            </Group>
          ))}

          {/* Rettangolo di selezione: sopra le forme, non intercetta gli eventi */}
          {marquee && (
            <Rect
              {...normalizeRect(marquee.start, marquee.current)}
              fill={`${STAGE_ACCENT}22`}
              stroke={STAGE_ACCENT}
              strokeWidth={1}
              strokeScaleEnabled={false}
              dash={[4, 4]}
              listening={false}
            />
          )}

          <Transformer
            ref={transformerRef}
            rotationSnaps={[0, 90, 180, 270]}
            // Con più forme selezionate si può solo ruotare il gruppo, non ridimensionarlo
            resizeEnabled={!multi}
            // Tutta l'area del riquadro si può trascinare, anche dove non c'è una forma
            shouldOverdrawWholeArea={multi}
            onTransformEnd={multi ? handleGroupTransformEnd : undefined}
            onDragEnd={multi ? handleGroupDragEnd : undefined}
            keepRatio={selected ? keepsRatio(selected.type) : false}
            enabledAnchors={
              selected?.type === 'line'
                ? ['middle-left', 'middle-right']
                : selected && keepsRatio(selected.type)
                  ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
                  : undefined
            }
            anchorSize={coarse ? 22 : 8}
            anchorCornerRadius={coarse ? 11 : 0}
            anchorStroke={STAGE_ACCENT}
            anchorFill={STAGE_ACCENT}
            borderStroke={STAGE_ACCENT}
            borderStrokeWidth={1.5}
            rotateAnchorOffset={coarse ? 40 : 30}
            flipEnabled={false}
            // Impedisce di schiacciare la forma fino a farla sparire (in pixel sullo schermo)
            boundBoxFunc={(oldBox, newBox) =>
              Math.abs(newBox.width) < MIN_ELEMENT_SIZE / 2 || Math.abs(newBox.height) < 2 ? oldBox : newBox
            }
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default StageCanvas;
