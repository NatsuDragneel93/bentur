import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Konva from 'konva';
import { Ellipse, Group, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import {
  clampView,
  isShapeType,
  keepsRatio,
  MIN_ELEMENT_SIZE,
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

// Necessario per il pizzico a due dita mentre un dito sta già trascinando
Konva.hitOnDragEnabled = true;

const BACKGROUND_NAME = 'se-background';
const WHEEL_ZOOM_FACTOR = 1.1;

// Maniglie più grandi sui dispositivi touch
const isCoarsePointer = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

// Disegno di una forma, centrata nell'origine del gruppo
const ShapeBody: React.FC<{ element: StageElement }> = ({ element }) => {
  const { type, width, height, fill, stroke } = element;
  const common = { fill, stroke, strokeWidth: 2 };

  switch (type) {
    case 'circle':
      return <Ellipse radiusX={width / 2} radiusY={height / 2} {...common} />;
    case 'square':
    case 'rect':
      return <Rect x={-width / 2} y={-height / 2} width={width} height={height} cornerRadius={4} {...common} />;
    case 'triangle':
      return <Line points={[0, -height / 2, width / 2, height / 2, -width / 2, height / 2]} closed {...common} />;
    case 'line':
      return <Rect x={-width / 2} y={-height / 2} width={width} height={height} fill={fill} />;
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
      fontStyle="bold"
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
  selectedId: string | null;
  // Rapporto tra pixel sullo schermo e unità logiche del palco, senza zoom
  baseScale: number;
  // Dimensioni della tela: tutto lo spazio disponibile, il palco vi è centrato
  viewport: Size;
  view: StageView;
  ariaLabel: string;
  onViewChange: (view: StageView) => void;
  onSelect: (id: string | null) => void;
  // Doppio clic / doppio tocco su una forma: apre nome e colori
  onEdit: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onTransform: (id: string, result: TransformResult) => void;
  onDropShape: (type: ShapeType, position: Point) => void;
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const middle = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const StageCanvas: React.FC<StageCanvasProps> = ({
  ref,
  elements,
  selectedId,
  baseScale,
  viewport,
  view,
  ariaLabel,
  onViewChange,
  onSelect,
  onEdit,
  onMove,
  onTransform,
  onDropShape,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  // Stato del pizzico a due dita in corso
  const pinchRef = useRef<{ center: Point; distance: number } | null>(null);
  const selected = elements.find(element => element.id === selectedId) ?? null;
  const scale = baseScale * view.zoom;

  // Collega le maniglie di ridimensionamento/rotazione alla forma selezionata
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    const node = selectedId ? stage.findOne(`#${selectedId}`) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, elements]);

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

  const deselectOnEmpty = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage() || e.target.name() === BACKGROUND_NAME) {
      onSelect(null);
    }
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

  const handleTransformEnd = (element: StageElement, e: Konva.KonvaEventObject<Event>) => {
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
    stage.find('.se-element').forEach(node => {
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
        // Con lo zoom attivo si sposta la vista trascinando lo sfondo
        draggable={view.zoom > 1}
        dragBoundFunc={pos => {
          const bounded = clampView({ zoom: view.zoom, x: pos.x, y: pos.y }, baseScale, viewport);
          return { x: bounded.x, y: bounded.y };
        }}
        onDragEnd={e => {
          if (e.target === stageRef.current) onViewChange({ zoom: view.zoom, x: e.target.x(), y: e.target.y() });
        }}
        onWheel={handleWheel}
        onMouseDown={deselectOnEmpty}
        onTouchStart={deselectOnEmpty}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { pinchRef.current = null; }}
      >
        <Layer>
          {/* Palco: area salvata ed esportata; intorno la tela continua con lo stesso sfondo */}
          <Rect
            name={BACKGROUND_NAME}
            width={STAGE_WIDTH}
            height={STAGE_HEIGHT}
            fill="#222222"
            stroke="#555555"
            strokeWidth={2}
            strokeScaleEnabled={false}
            dash={[10, 6]}
          />

          {elements.map(element => (
            <Group
              key={element.id}
              id={element.id}
              name="se-element"
              x={element.x}
              y={element.y}
              rotation={element.rotation}
              draggable
              onMouseDown={() => onSelect(element.id)}
              onTap={() => onSelect(element.id)}
              onDblClick={() => onEdit(element.id)}
              onDblTap={() => onEdit(element.id)}
              onDragStart={e => {
                // Forma semitrasparente durante il trascinamento: si vede che si sta muovendo
                e.target.opacity(0.6);
                onSelect(element.id);
              }}
              onDragEnd={e => {
                // L'evento risale fino allo Stage: qui interessa solo la forma
                e.cancelBubble = true;
                e.target.opacity(1);
                onMove(element.id, e.target.x(), e.target.y());
              }}
              onTransformEnd={e => handleTransformEnd(element, e)}
            >
              <ShapeBody element={element} />
              <ShapeLabel element={element} />
            </Group>
          ))}

          <Transformer
            ref={transformerRef}
            rotationSnaps={[0, 90, 180, 270]}
            keepRatio={selected ? keepsRatio(selected.type) : false}
            enabledAnchors={
              selected?.type === 'line'
                ? ['middle-left', 'middle-right']
                : selected && keepsRatio(selected.type)
                  ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
                  : undefined
            }
            anchorSize={coarse ? 22 : 10}
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
