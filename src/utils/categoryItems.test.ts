import { describe, expect, it } from 'vitest';
import {
  appendItem,
  categoryProgress,
  generateItemId,
  moveItemById,
  normalizeOrder,
  removeItemById,
  sortByOrder,
  updateAllItems,
  updateItemById,
} from './categoryItems';

interface Todo {
  id: string;
  order: number;
  text: string;
  completed: boolean;
}

const todo = (id: string, order: number): Todo => ({ id, order, text: `todo ${id}`, completed: false });
const ids = (items: Todo[]) => items.map(item => item.id);
const orders = (items: Todo[]) => items.map(item => item.order);

describe('categoryItems', () => {
  it('sortByOrder ordina per order senza modificare l\'array originale', () => {
    const items = [todo('b', 1), todo('a', 0), todo('c', 2)];

    expect(ids(sortByOrder(items))).toEqual(['a', 'b', 'c']);
    expect(ids(items)).toEqual(['b', 'a', 'c']);
  });

  it('normalizeOrder elimina i buchi negli order', () => {
    expect(orders(normalizeOrder([todo('a', 0), todo('b', 5), todo('c', 9)]))).toEqual([0, 1, 2]);
  });

  it('appendItem aggiunge in fondo con id e order corretti', () => {
    const result = appendItem<Todo>([todo('a', 0), todo('b', 1)], { text: 'nuovo', completed: true }, 'x');

    expect(result[2]).toEqual({ id: 'x', order: 2, text: 'nuovo', completed: true });
    expect(orders(result)).toEqual([0, 1, 2]);
  });

  it('updateItemById aggiorna solo l\'elemento indicato', () => {
    const result = updateItemById<Todo>([todo('a', 0), todo('b', 1)], 'b', { completed: true });

    expect(result.map(item => item.completed)).toEqual([false, true]);
  });

  it('removeItemById rimuove e ricompatta gli order', () => {
    const result = removeItemById([todo('a', 0), todo('b', 1), todo('c', 2)], 'b');

    expect(ids(result)).toEqual(['a', 'c']);
    expect(orders(result)).toEqual([0, 1]);
  });

  it('moveItemById sposta un elemento e rinumera gli order', () => {
    const items = [todo('a', 0), todo('b', 1), todo('c', 2), todo('d', 3)];

    expect(ids(moveItemById(items, 'd', 0))).toEqual(['d', 'a', 'b', 'c']);
    expect(ids(moveItemById(items, 'a', 2))).toEqual(['b', 'c', 'a', 'd']);
    expect(orders(moveItemById(items, 'a', 2))).toEqual([0, 1, 2, 3]);
  });

  it('moveItemById limita la destinazione alla lunghezza della lista', () => {
    expect(ids(moveItemById([todo('a', 0), todo('b', 1)], 'a', 10))).toEqual(['b', 'a']);
  });

  it('segnala un errore se l\'elemento non esiste (es. eliminato da un altro dispositivo)', () => {
    const items = [todo('a', 0)];

    expect(() => updateItemById<Todo>(items, 'z', { completed: true })).toThrow('Elemento non trovato');
    expect(() => removeItemById(items, 'z')).toThrow('Elemento non trovato');
    expect(() => moveItemById(items, 'z', 0)).toThrow('Elemento non trovato');
  });

  it('updateAllItems applica la modifica a tutti gli elementi mantenendo l\'ordine', () => {
    const items = [{ ...todo('a', 0), completed: true }, todo('b', 1)];

    const result = updateAllItems(items, { completed: false });

    expect(result.map(item => [item.id, item.order, item.completed])).toEqual([['a', 0, false], ['b', 1, false]]);
    expect(items[0].completed).toBe(true);
  });

  it('generateItemId genera id diversi', () => {
    expect(generateItemId()).not.toBe(generateItemId());
  });

  it('categoryProgress distingue categorie vuote, da iniziare, a metà e completate', () => {
    const done = (item: { completed: boolean }) => item.completed;
    const item = (id: string, completed: boolean) => ({ id, order: 0, completed });

    expect(categoryProgress([], done)).toEqual({ status: 'empty' });
    expect(categoryProgress([item('a', false), item('b', false)], done)).toEqual({ status: 'open', count: 2 });
    expect(categoryProgress([item('a', true), item('b', false), item('c', false)], done)).toEqual({ status: 'partial', done: 1, total: 3 });
    expect(categoryProgress([item('a', true)], done)).toEqual({ status: 'done' });
  });
});
