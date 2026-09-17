// Cronologia per annulla/ripristina. Logica pura e immutabile.

export interface History<T> {
  past: T[];
  present: T;
  future: T[];
  // Chiave dell'ultima modifica: modifiche consecutive con la stessa chiave
  // (es. lettere scritte nel nome di una forma) diventano un solo passo da annullare
  lastMergeKey: string | null;
}

export const MAX_HISTORY = 100;

export const createHistory = <T>(present: T): History<T> => ({ past: [], present, future: [], lastMergeKey: null });

export const commit = <T>(history: History<T>, next: T, mergeKey?: string): History<T> => {
  if (next === history.present) return history;

  if (mergeKey && mergeKey === history.lastMergeKey) {
    return { ...history, present: next, future: [] };
  }

  return {
    past: [...history.past, history.present].slice(-MAX_HISTORY),
    present: next,
    future: [],
    lastMergeKey: mergeKey ?? null,
  };
};

export const undo = <T>(history: History<T>): History<T> => {
  if (history.past.length === 0) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
    lastMergeKey: null,
  };
};

export const redo = <T>(history: History<T>): History<T> => {
  if (history.future.length === 0) return history;
  return {
    past: [...history.past, history.present],
    present: history.future[0],
    future: history.future.slice(1),
    lastMergeKey: null,
  };
};
