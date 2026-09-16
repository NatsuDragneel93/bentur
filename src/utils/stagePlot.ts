// Logica pura dell'editor Setup (disposizione del palco). Non tocca Konva né Firestore.

export const SHAPE_TYPES = ['circle', 'square', 'rect', 'triangle', 'line', 'text'] as const;
export type ShapeType = (typeof SHAPE_TYPES)[number];

export const isShapeType = (value: string): value is ShapeType => SHAPE_TYPES.includes(value as ShapeType);

// Dimensioni del palco in unità logiche: il disegno si adatta allo schermo, i dati no
export const STAGE_WIDTH = 1000;
export const STAGE_HEIGHT = 600;

// Dimensione minima di una forma, per non farla sparire ridimensionandola
export const MIN_ELEMENT_SIZE = 10;

export interface StageElement {
  id: string;
  type: ShapeType;
  // Centro della forma, in unità logiche (la rotazione avviene attorno al centro)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  label: string;
  labelColor: string;
}

const DEFAULTS: Record<ShapeType, Pick<StageElement, 'width' | 'height' | 'fill' | 'stroke' | 'labelColor'>> = {
  circle: { width: 80, height: 80, fill: '#f5f5f5', stroke: '#888888', labelColor: '#000000' },
  square: { width: 80, height: 80, fill: '#4a90d9', stroke: '#1f4f80', labelColor: '#ffffff' },
  rect: { width: 160, height: 90, fill: '#4a90d9', stroke: '#1f4f80', labelColor: '#ffffff' },
  triangle: { width: 90, height: 80, fill: '#e67e22', stroke: '#9a4f0f', labelColor: '#000000' },
  line: { width: 200, height: 6, fill: '#ffffff', stroke: '#ffffff', labelColor: '#ffffff' },
  text: { width: 160, height: 40, fill: 'transparent', stroke: 'transparent', labelColor: '#ffffff' },
};

// Forme con proporzioni fisse durante il ridimensionamento
export const keepsRatio = (type: ShapeType): boolean => type === 'circle' || type === 'square';

export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/**
 * Posizione di una nuova forma aggiunta con un tocco: vicino al centro,
 * spostata un po' a ogni aggiunta così le forme non finiscono una sopra l'altra.
 */
export const spawnPosition = (existingCount: number): { x: number; y: number } => {
  const step = (existingCount % 8) * 20;
  return { x: STAGE_WIDTH / 2 - 70 + step, y: STAGE_HEIGHT / 2 - 70 + step };
};

export const createElement = (
  type: ShapeType,
  id: string,
  position: { x: number; y: number },
  label = ''
): StageElement => ({
  id,
  type,
  x: clamp(position.x, 0, STAGE_WIDTH),
  y: clamp(position.y, 0, STAGE_HEIGHT),
  rotation: 0,
  label,
  ...DEFAULTS[type],
});

export const updateElement = (
  elements: StageElement[],
  id: string,
  updates: Partial<Omit<StageElement, 'id' | 'type'>>
): StageElement[] => elements.map(element => (element.id === id ? { ...element, ...updates } : element));

export const removeElement = (elements: StageElement[], id: string): StageElement[] =>
  elements.filter(element => element.id !== id);

// Fine di uno spostamento: il centro resta dentro il palco
export const moveElement = (elements: StageElement[], id: string, x: number, y: number): StageElement[] =>
  updateElement(elements, id, { x: clamp(x, 0, STAGE_WIDTH), y: clamp(y, 0, STAGE_HEIGHT) });

export interface TransformResult {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

/**
 * Fine di un ridimensionamento/rotazione: Konva restituisce una scala,
 * che viene trasformata in nuove dimensioni (la scala del nodo torna a 1).
 */
export const transformElement = (elements: StageElement[], id: string, result: TransformResult): StageElement[] =>
  elements.map(element => {
    if (element.id !== id) return element;

    const width = Math.max(MIN_ELEMENT_SIZE, element.width * Math.abs(result.scaleX));
    // Le linee cambiano solo lunghezza, non spessore
    const height = element.type === 'line'
      ? element.height
      : Math.max(MIN_ELEMENT_SIZE, element.height * Math.abs(result.scaleY));
    const size = keepsRatio(element.type) ? { width, height: width } : { width, height };

    return {
      ...element,
      ...size,
      x: clamp(result.x, 0, STAGE_WIDTH),
      y: clamp(result.y, 0, STAGE_HEIGHT),
      rotation: Math.round(result.rotation * 10) / 10,
    };
  });

// Scala per far entrare tutto il palco nello spazio disponibile
export const fitScale = (availableWidth: number, availableHeight: number): number => {
  if (availableWidth <= 0 || availableHeight <= 0) return 1;
  return Math.min(availableWidth / STAGE_WIDTH, availableHeight / STAGE_HEIGHT);
};
