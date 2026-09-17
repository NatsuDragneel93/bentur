import { describe, expect, it } from 'vitest';
import {
  clampView,
  copyElements,
  createElement,
  DEFAULT_VIEW,
  duplicateElement,
  exportFileName,
  fitScale,
  hasDefaultLabel,
  isShapeType,
  keepsRatio,
  MAX_ZOOM,
  MIN_ELEMENT_SIZE,
  moveElement,
  normalizeElements,
  removeElement,
  reorderElement,
  sameElements,
  spawnPosition,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  transformElement,
  updateElement,
  visibleCenter,
  zoomAt,
} from './stagePlot';

const noTransform = { rotation: 0, scaleX: 1, scaleY: 1 };

describe('stagePlot', () => {
  it('createElement usa i valori predefiniti del tipo e resta dentro il palco', () => {
    const element = createElement('rect', 'e1', { x: -50, y: 9999 }, 'Batteria');

    expect(element).toMatchObject({ id: 'e1', type: 'rect', x: 0, y: STAGE_HEIGHT, width: 160, height: 90, rotation: 0, label: 'Batteria' });
  });

  it('isShapeType riconosce solo i tipi di forma validi', () => {
    expect(isShapeType('triangle')).toBe(true);
    expect(isShapeType('star')).toBe(true);
    expect(isShapeType('hexagon')).toBe(false);
  });

  it('cerchi, quadrati e stelle mantengono le proporzioni; solo il testo ha un nome predefinito', () => {
    expect(keepsRatio('circle')).toBe(true);
    expect(keepsRatio('star')).toBe(true);
    expect(keepsRatio('rect')).toBe(false);
    expect(hasDefaultLabel('text')).toBe(true);
    expect(hasDefaultLabel('circle')).toBe(false);
  });

  it('spawnPosition sposta le nuove forme per non sovrapporle', () => {
    expect(spawnPosition(0)).not.toEqual(spawnPosition(1));
    expect(spawnPosition(8)).toEqual(spawnPosition(0));
  });

  it('updateElement e removeElement agiscono solo sulla forma indicata', () => {
    const elements = [createElement('circle', 'a', { x: 10, y: 10 }), createElement('square', 'b', { x: 20, y: 20 })];

    const updated = updateElement(elements, 'b', { fill: '#ffffff', label: 'Piatto' });
    expect(updated[0]).toBe(elements[0]);
    expect(updated[1]).toMatchObject({ fill: '#ffffff', label: 'Piatto' });

    expect(removeElement(elements, 'a').map(e => e.id)).toEqual(['b']);
  });

  it('moveElement tiene il centro dentro il palco', () => {
    const elements = [createElement('circle', 'a', { x: 10, y: 10 })];

    expect(moveElement(elements, 'a', STAGE_WIDTH + 100, -5)[0]).toMatchObject({ x: STAGE_WIDTH, y: 0 });
  });

  it('transformElement converte la scala in dimensioni', () => {
    const elements = [createElement('rect', 'a', { x: 100, y: 100 })];

    const [result] = transformElement(elements, 'a', { x: 120, y: 130, rotation: 45.26, scaleX: 2, scaleY: 0.5 });

    expect(result).toMatchObject({ x: 120, y: 130, width: 320, height: 45, rotation: 45.3 });
  });

  it('transformElement mantiene le proporzioni di cerchi e quadrati', () => {
    const elements = [createElement('circle', 'a', { x: 100, y: 100 })];

    const [result] = transformElement(elements, 'a', { x: 100, y: 100, ...noTransform, scaleX: 1.5, scaleY: 3 });

    expect(result.width).toBe(120);
    expect(result.height).toBe(120);
  });

  it('transformElement non cambia lo spessore delle linee e impone una dimensione minima', () => {
    const elements = [createElement('line', 'a', { x: 100, y: 100 })];

    const [result] = transformElement(elements, 'a', { x: 100, y: 100, ...noTransform, scaleX: 0.01, scaleY: 5 });

    expect(result.width).toBe(MIN_ELEMENT_SIZE);
    expect(result.height).toBe(elements[0].height);
  });

  it('normalizeElements scarta i dati non validi e completa i campi mancanti', () => {
    const elements = normalizeElements([
      { id: 'a', type: 'rect', x: 100, y: 50, label: 'Batteria', fill: '#00aaff' },
      { id: 'b', type: 'hexagon', x: 1, y: 1 },
      { type: 'circle' },
      null,
      { id: 'c', type: 'circle', x: 'dieci', y: 20, width: 2 },
    ]);

    expect(elements.map(e => e.id)).toEqual(['a', 'c']);
    expect(elements[0]).toMatchObject({ x: 100, y: 50, width: 160, height: 90, rotation: 0, label: 'Batteria', fill: '#00aaff' });
    expect(elements[1]).toMatchObject({ x: 0, y: 20, width: MIN_ELEMENT_SIZE, label: '' });
    expect(normalizeElements(undefined)).toEqual([]);
  });

  it('spawnPosition parte dal centro indicato (parte visibile del palco)', () => {
    const position = spawnPosition(3, { x: 200, y: 100 });

    expect(position).toEqual({ x: 200, y: 100 });
  });

  it('duplicateElement aggiunge una copia spostata in primo piano', () => {
    const elements = [createElement('rect', 'a', { x: 100, y: 100 }, 'Batteria'), createElement('circle', 'b', { x: 0, y: 0 })];

    const result = duplicateElement(elements, 'a', 'c');

    expect(result.map(e => e.id)).toEqual(['a', 'b', 'c']);
    expect(result[2]).toMatchObject({ x: 120, y: 120, label: 'Batteria', type: 'rect' });
    expect(duplicateElement(elements, 'x', 'c')).toBe(elements);
  });

  it('reorderElement porta avanti e indietro senza uscire dai limiti', () => {
    const elements = ['a', 'b', 'c'].map(id => createElement('circle', id, { x: 0, y: 0 }));
    const ids = (list: typeof elements) => list.map(e => e.id);

    expect(ids(reorderElement(elements, 'a', 'forward'))).toEqual(['b', 'a', 'c']);
    expect(ids(reorderElement(elements, 'c', 'backward'))).toEqual(['a', 'c', 'b']);
    expect(reorderElement(elements, 'c', 'forward')).toBe(elements);
    expect(reorderElement(elements, 'a', 'backward')).toBe(elements);
  });

  it('copyElements copia le forme con id nuovi', () => {
    const elements = [createElement('rect', 'a', { x: 100, y: 100 }, 'Batteria')];
    let counter = 0;

    const copy = copyElements(elements, () => `new-${++counter}`);

    expect(copy).toEqual([{ ...elements[0], id: 'new-1' }]);
    expect(sameElements(elements, copy)).toBe(false);
    expect(sameElements(elements, [{ ...elements[0] }])).toBe(true);
  });

  it('zoomAt ingrandisce mantenendo fermo il punto indicato', () => {
    // Tela 500x300 (baseScale 0.5): il punto (250, 150) è il centro del palco
    const viewport = { width: 500, height: 300 };
    const view = zoomAt(DEFAULT_VIEW, 0.5, viewport, { x: 250, y: 150 }, 2);

    expect(view).toEqual({ zoom: 2, x: -250, y: -150 });
    expect(visibleCenter(view, 0.5, viewport)).toEqual({ x: STAGE_WIDTH / 2, y: STAGE_HEIGHT / 2 });
  });

  it('zoomAt e clampView restano nei limiti di zoom e non mostrano bordi vuoti', () => {
    const viewport = { width: 500, height: 300 };

    expect(zoomAt(DEFAULT_VIEW, 0.5, viewport, { x: 0, y: 0 }, 100).zoom).toBe(MAX_ZOOM);
    expect(zoomAt(DEFAULT_VIEW, 0.5, viewport, { x: 0, y: 0 }, 0.1)).toEqual(DEFAULT_VIEW);
    expect(clampView({ zoom: 2, x: 50, y: -9999 }, 0.5, viewport)).toEqual({ zoom: 2, x: 0, y: -300 });
  });

  it('clampView centra il palco quando la tela è più grande', () => {
    // Tela larga 700: il palco (500x300) resta al centro in orizzontale
    const view = clampView({ zoom: 1, x: -50, y: 10 }, 0.5, { width: 700, height: 300 });

    expect(view).toEqual({ zoom: 1, x: 100, y: 0 });
    expect(visibleCenter(view, 0.5, { width: 700, height: 300 })).toEqual({ x: STAGE_WIDTH / 2, y: STAGE_HEIGHT / 2 });
  });

  it('exportFileName crea un nome file senza accenti né spazi', () => {
    expect(exportFileName('Màneskin & Co.', 'b')).toBe('setup-b-maneskin-co.png');
    expect(exportFileName('   ', 'a')).toBe('setup-a.png');
  });

  it('fitScale fa entrare il palco nello spazio disponibile', () => {
    expect(fitScale(500, 1000)).toBe(0.5);
    expect(fitScale(2000, 300)).toBe(0.5);
    expect(fitScale(0, 300)).toBe(1);
  });
});
