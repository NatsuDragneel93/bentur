import React, { useEffect, useRef } from 'react';
import type Konva from 'konva';
import { Ellipse, Group, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import {
  isShapeType,
  keepsRatio,
  MIN_ELEMENT_SIZE,
  ShapeType,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  StageElement,
  TransformResult,
} from '../../../utils/stagePlot';
import { SHAPE_DRAG_TYPE } from './ShapePalette';

const BACKGROUND_NAME = 'se-background';

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

  // Sulle linee il nome sta sopra, nelle altre forme al centro
  const isLine = type === 'line';
  return (
    <Text
      text={label}
      x={-width / 2}
      y={isLine ? -height / 2 - 24 : -height / 2}
      width={width}
      height={isLine ? 20 : height}
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

interface StageCanvasProps {
  elements: StageElement[];
  selectedId: string | null;
  // Rapporto tra pixel sullo schermo e unità logiche del palco
  scale: number;
  ariaLabel: string;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onTransform: (id: string, result: TransformResult) => void;
  onDropShape: (type: ShapeType, position: { x: number; y: number }) => void;
}

const StageCanvas: React.FC<StageCanvasProps> = ({
  elements,
  selectedId,
  scale,
  ariaLabel,
  onSelect,
  onMove,
  onTransform,
  onDropShape,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selected = elements.find(element => element.id === selectedId) ?? null;

  // Collega le maniglie di ridimensionamento/rotazione alla forma selezionata
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    const node = selectedId ? stage.findOne(`#${selectedId}`) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, elements]);

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
    const pointer = stage.getPointerPosition();
    if (pointer) {
      onDropShape(type, { x: pointer.x / scale, y: pointer.y / scale });
    }
  };

  const handleTransformEnd = (element: StageElement, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const result = { x: node.x(), y: node.y(), rotation: node.rotation(), scaleX: node.scaleX(), scaleY: node.scaleY() };
    // Le dimensioni diventano width/height: la scala del nodo torna a 1
    node.scale({ x: 1, y: 1 });
    onTransform(element.id, result);
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
        width={STAGE_WIDTH * scale}
        height={STAGE_HEIGHT * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={deselectOnEmpty}
        onTouchStart={deselectOnEmpty}
      >
        <Layer>
          <Rect name={BACKGROUND_NAME} width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#1c1c1c" stroke="#555555" strokeWidth={2} />

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
              onDragStart={() => onSelect(element.id)}
              onDragEnd={e => onMove(element.id, e.target.x(), e.target.y())}
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
