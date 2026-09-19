// Logica pura dell'editor Setup (disposizione del palco). Non tocca Konva né Firestore.

export const SHAPE_TYPES = ['circle', 'square', 'rect', 'triangle', 'star', 'line', 'text'] as const;
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

type ElementDefaults = Pick<StageElement, 'width' | 'height' | 'fill' | 'stroke' | 'labelColor'>;

// Toni del tema Nocturne usati per le forme (valori di styles/nocturne.css: Konva non legge le variabili CSS)
export const STAGE_COLORS = {
  accent500: '#968ae0',
  accent700: '#5d5294',
  neutral100: '#f3f5fe',
  neutral500: '#9397ab',
  neutral700: '#595d6c',
  neutral900: '#292b31',
  accent300: '#d2cefd',
} as const;

const DEFAULTS: Record<ShapeType, ElementDefaults> = {
  // stroke non è più disegnato (resta nei dati per compatibilità)
  circle: { width: 80, height: 80, fill: STAGE_COLORS.accent700, stroke: 'transparent', labelColor: STAGE_COLORS.neutral100 },
  square: { width: 80, height: 80, fill: STAGE_COLORS.neutral700, stroke: 'transparent', labelColor: STAGE_COLORS.neutral100 },
  rect: { width: 160, height: 90, fill: STAGE_COLORS.accent500, stroke: 'transparent', labelColor: STAGE_COLORS.neutral900 },
  triangle: { width: 90, height: 80, fill: STAGE_COLORS.neutral500, stroke: 'transparent', labelColor: STAGE_COLORS.neutral900 },
  star: { width: 90, height: 90, fill: STAGE_COLORS.accent500, stroke: 'transparent', labelColor: STAGE_COLORS.neutral900 },
  line: { width: 200, height: 6, fill: STAGE_COLORS.neutral500, stroke: 'transparent', labelColor: STAGE_COLORS.neutral100 },
  text: { width: 160, height: 40, fill: 'transparent', stroke: 'transparent', labelColor: STAGE_COLORS.neutral100 },
};

// Forme con proporzioni fisse durante il ridimensionamento
export const keepsRatio = (type: ShapeType): boolean => type === 'circle' || type === 'square' || type === 'star';

// Nome predefinito alla creazione: solo il testo nasce già con una scritta
export const hasDefaultLabel = (type: ShapeType): boolean => type === 'text';

export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

// Lunghezza massima del nome di una forma
export const MAX_LABEL_LENGTH = 60;

// Colori proposti nel pannello proprietà (resta disponibile anche il selettore libero;
// i colori già salvati non vengono convertiti)
export const FILL_PRESETS: readonly string[] = [
  STAGE_COLORS.accent500, STAGE_COLORS.accent700, STAGE_COLORS.neutral500, STAGE_COLORS.neutral700, STAGE_COLORS.neutral900,
];

export const LABEL_PRESETS: readonly string[] = [STAGE_COLORS.neutral100, STAGE_COLORS.accent300, STAGE_COLORS.neutral900];

export interface Point {
  x: number;
  y: number;
}

const STAGE_CENTER: Point = { x: STAGE_WIDTH / 2, y: STAGE_HEIGHT / 2 };

/**
 * Posizione di una nuova forma aggiunta con un tocco: vicino al centro della parte visibile,
 * spostata un po' a ogni aggiunta così le forme non finiscono una sopra l'altra.
 */
export const spawnPosition = (existingCount: number, center: Point = STAGE_CENTER): Point => {
  const step = ((existingCount % 8) - 3) * 20;
  return { x: clamp(center.x + step, 0, STAGE_WIDTH), y: clamp(center.y + step, 0, STAGE_HEIGHT) };
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

// Copia della forma leggermente spostata, in primo piano
export const duplicateElement = (elements: StageElement[], id: string, newId: string): StageElement[] => {
  const source = elements.find(element => element.id === id);
  if (!source) return elements;

  const copy = { ...source, id: newId, x: clamp(source.x + 20, 0, STAGE_WIDTH), y: clamp(source.y + 20, 0, STAGE_HEIGHT) };
  return [...elements, copy];
};

// Copie di più forme insieme (selezione multipla): stesso ordine relativo, tutte in primo piano
export const duplicateElements = (
  elements: StageElement[],
  ids: string[],
  createId: () => string
): { elements: StageElement[]; newIds: string[] } => {
  const copies = elements
    .filter(element => ids.includes(element.id))
    .map(element => ({
      ...element,
      id: createId(),
      x: clamp(element.x + 20, 0, STAGE_WIDTH),
      y: clamp(element.y + 20, 0, STAGE_HEIGHT),
    }));

  return { elements: [...elements, ...copies], newIds: copies.map(copy => copy.id) };
};

export const removeElements = (elements: StageElement[], ids: string[]): StageElement[] =>
  elements.filter(element => !ids.includes(element.id));

// Le forme successive nell'array sono disegnate sopra le precedenti
export const reorderElement = (elements: StageElement[], id: string, move: 'forward' | 'backward'): StageElement[] => {
  const index = elements.findIndex(element => element.id === id);
  const target = move === 'forward' ? index + 1 : index - 1;
  if (index === -1 || target < 0 || target >= elements.length) return elements;

  const result = [...elements];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
};

// Copia di un intero setup (es. da Setup A a Setup B): stesse forme con id nuovi
export const copyElements = (elements: StageElement[], createId: () => string): StageElement[] =>
  elements.map(element => ({ ...element, id: createId() }));

export const sameElements = (a: StageElement[], b: StageElement[]): boolean =>
  a === b || JSON.stringify(a) === JSON.stringify(b);

// Fine di uno spostamento: il centro resta dentro il palco
export const moveElement = (elements: StageElement[], id: string, x: number, y: number): StageElement[] =>
  updateElement(elements, id, { x: clamp(x, 0, STAGE_WIDTH), y: clamp(y, 0, STAGE_HEIGHT) });

/**
 * Spostamento in blocco: un unico delta valido per tutte le forme selezionate, ridotto quanto serve
 * perché nessun centro esca dal palco. Clampando ogni forma da sé la selezione si deformerebbe,
 * schiacciando contro il bordo le forme più esterne.
 */
export const clampGroupDelta = (elements: StageElement[], ids: string[], dx: number, dy: number): Point => {
  const selected = elements.filter(element => ids.includes(element.id));
  if (selected.length === 0) return { x: 0, y: 0 };

  const xs = selected.map(element => element.x);
  const ys = selected.map(element => element.y);
  return {
    x: clamp(dx, -Math.min(...xs), STAGE_WIDTH - Math.max(...xs)),
    y: clamp(dy, -Math.min(...ys), STAGE_HEIGHT - Math.max(...ys)),
  };
};

export const moveElementsBy = (elements: StageElement[], ids: string[], dx: number, dy: number): StageElement[] => {
  const delta = clampGroupDelta(elements, ids, dx, dy);
  if (delta.x === 0 && delta.y === 0) return elements;

  return elements.map(element =>
    ids.includes(element.id) ? { ...element, x: element.x + delta.x, y: element.y + delta.y } : element
  );
};

export interface PlacementResult {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

/**
 * Rotazione di un gruppo di forme: ruotando più nodi insieme Konva cambia solo posizione e rotazione
 * di ciascuno (il ridimensionamento è disattivato), quindi non serve convertire una scala in dimensioni.
 */
export const applyTransforms = (elements: StageElement[], results: PlacementResult[]): StageElement[] =>
  elements.map(element => {
    const result = results.find(item => item.id === element.id);
    if (!result) return element;

    return {
      ...element,
      x: clamp(result.x, 0, STAGE_WIDTH),
      y: clamp(result.y, 0, STAGE_HEIGHT),
      rotation: Math.round(result.rotation * 10) / 10,
    };
  });

export interface Rect extends Point, Size {}

// Rettangolo di selezione tra due punti, con larghezza e altezza sempre positive
export const normalizeRect = (start: Point, end: Point): Rect => ({
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y),
});

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

// Numero massimo di forme per setup (stesso limite in firestore.rules)
export const MAX_STAGE_ELEMENTS = 500;

const numberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const stringOr = (value: unknown, fallback: string): string => (typeof value === 'string' ? value : fallback);

/**
 * Converte i dati letti da Firestore in forme valide: scarta ciò che non è riconoscibile
 * e completa i campi mancanti con i valori predefiniti del tipo.
 */
export const normalizeElements = (raw: unknown): StageElement[] => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item): StageElement[] => {
    if (typeof item !== 'object' || item === null) return [];
    const data = item as Record<string, unknown>;
    if (typeof data.id !== 'string' || typeof data.type !== 'string' || !isShapeType(data.type)) return [];

    const base = createElement(data.type, data.id, { x: numberOr(data.x, 0), y: numberOr(data.y, 0) });
    return [{
      ...base,
      width: Math.max(MIN_ELEMENT_SIZE, numberOr(data.width, base.width)),
      height: data.type === 'line' ? numberOr(data.height, base.height) : Math.max(MIN_ELEMENT_SIZE, numberOr(data.height, base.height)),
      rotation: numberOr(data.rotation, 0),
      fill: stringOr(data.fill, base.fill),
      stroke: stringOr(data.stroke, base.stroke),
      label: stringOr(data.label, ''),
      labelColor: stringOr(data.labelColor, base.labelColor),
    }];
  });
};

// Scala per far entrare tutto il palco nello spazio disponibile
export const fitScale = (availableWidth: number, availableHeight: number): number => {
  if (availableWidth <= 0 || availableHeight <= 0) return 1;
  return Math.min(availableWidth / STAGE_WIDTH, availableHeight / STAGE_HEIGHT);
};

// --- Zoom e spostamento della vista ---
// La tela occupa tutto lo spazio disponibile (viewport); dentro, il palco è disegnato
// con scala baseScale * zoom e spostato di (x, y) pixel.

export interface Size {
  width: number;
  height: number;
}

export interface StageView {
  zoom: number;
  x: number;
  y: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const DEFAULT_VIEW: StageView = { zoom: 1, x: 0, y: 0 };

// Su un asse: palco più piccolo della tela = centrato; più grande = nessun bordo vuoto
const clampAxis = (position: number, content: number, viewport: number): number =>
  content <= viewport ? (viewport - content) / 2 : clamp(position, viewport - content, 0);

export const clampView = (view: StageView, baseScale: number, viewport: Size): StageView => {
  const zoom = clamp(view.zoom, MIN_ZOOM, MAX_ZOOM);
  const scale = baseScale * zoom;
  return {
    zoom,
    x: clampAxis(view.x, STAGE_WIDTH * scale, viewport.width),
    y: clampAxis(view.y, STAGE_HEIGHT * scale, viewport.height),
  };
};

// Zoom mantenendo fermo il punto indicato (in pixel della tela), es. il puntatore o il centro del pizzico
export const zoomAt = (view: StageView, baseScale: number, viewport: Size, point: Point, factor: number): StageView => {
  const oldScale = baseScale * view.zoom;
  const zoom = clamp(view.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  const logicalX = (point.x - view.x) / oldScale;
  const logicalY = (point.y - view.y) / oldScale;
  return clampView(
    { zoom, x: point.x - logicalX * baseScale * zoom, y: point.y - logicalY * baseScale * zoom },
    baseScale,
    viewport
  );
};

// Centro della parte di tela visibile, in unità logiche del palco
export const visibleCenter = (view: StageView, baseScale: number, viewport: Size): Point => {
  const scale = baseScale * view.zoom;
  return {
    x: (viewport.width / 2 - view.x) / scale,
    y: (viewport.height / 2 - view.y) / scale,
  };
};

// Nome del file PNG esportato, es. "setup-a-tananai.png"
export const exportFileName = (artistName: string, setupKey: string): string => {
  const slug = artistName
    .normalize('NFD')
    // Toglie gli accenti (lettere decomposte da normalize)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `setup-${setupKey}${slug ? `-${slug}` : ''}.png`;
};
