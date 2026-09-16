import { describe, expect, it } from 'vitest';
import {
  createElement,
  fitScale,
  isShapeType,
  MIN_ELEMENT_SIZE,
  moveElement,
  normalizeElements,
  removeElement,
  spawnPosition,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  transformElement,
  updateElement,
} from './stagePlot';

const noTransform = { rotation: 0, scaleX: 1, scaleY: 1 };

describe('stagePlot', () => {
  it('createElement usa i valori predefiniti del tipo e resta dentro il palco', () => {
    const element = createElement('rect', 'e1', { x: -50, y: 9999 }, 'Batteria');

    expect(element).toMatchObject({ id: 'e1', type: 'rect', x: 0, y: STAGE_HEIGHT, width: 160, height: 90, rotation: 0, label: 'Batteria' });
  });

  it('isShapeType riconosce solo i tipi di forma validi', () => {
    expect(isShapeType('triangle')).toBe(true);
    expect(isShapeType('hexagon')).toBe(false);
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

  it('fitScale fa entrare il palco nello spazio disponibile', () => {
    expect(fitScale(500, 1000)).toBe(0.5);
    expect(fitScale(2000, 300)).toBe(0.5);
    expect(fitScale(0, 300)).toBe(1);
  });
});
