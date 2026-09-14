import { useCallback, useRef, useState } from 'react';

// Esegue un'azione asincrona una sola volta alla volta: le chiamate mentre è in corso vengono ignorate.
// Evita i doppi salvataggi da doppio clic.
export const useAsyncAction = () => {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const run = useCallback(async (action: () => Promise<void> | void) => {
    if (pendingRef.current) return;

    pendingRef.current = true;
    setPending(true);
    try {
      await action();
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, []);

  return { pending, run };
};
