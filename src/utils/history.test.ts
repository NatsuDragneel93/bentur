import { describe, expect, it } from 'vitest';
import { commit, createHistory, MAX_HISTORY, redo, undo } from './history';

describe('history', () => {
  it('annulla e ripristina le modifiche in ordine', () => {
    let history = createHistory('a');
    history = commit(history, 'b');
    history = commit(history, 'c');

    history = undo(history);
    expect(history.present).toBe('b');
    history = undo(history);
    expect(history.present).toBe('a');
    expect(undo(history)).toBe(history);

    history = redo(history);
    expect(history.present).toBe('b');
  });

  it('una nuova modifica cancella i passi ripristinabili', () => {
    let history = commit(commit(createHistory('a'), 'b'), 'c');
    history = commit(undo(history), 'd');

    expect(history.future).toEqual([]);
    expect(redo(history)).toBe(history);
  });

  it('unisce le modifiche consecutive con la stessa chiave in un solo passo', () => {
    let history = createHistory('');
    history = commit(history, 'P', 'label:e1');
    history = commit(history, 'Pi', 'label:e1');
    history = commit(history, 'Pia', 'label:e1');
    history = commit(history, 'Pia!', 'fill:e1');

    expect(history.past).toEqual(['', 'Pia']);
    expect(undo(undo(history)).present).toBe('');
  });

  it('dopo un annullamento la stessa chiave crea un nuovo passo', () => {
    let history = commit(commit(createHistory('a'), 'b', 'k'), 'c', 'k');
    history = commit(undo(history), 'x', 'k');

    expect(history.past).toEqual(['a']);
  });

  it('ignora modifiche che non cambiano nulla e limita la lunghezza', () => {
    let history = createHistory(0);
    expect(commit(history, 0)).toBe(history);

    for (let i = 1; i <= MAX_HISTORY + 10; i++) history = commit(history, i);
    expect(history.past).toHaveLength(MAX_HISTORY);
  });
});
