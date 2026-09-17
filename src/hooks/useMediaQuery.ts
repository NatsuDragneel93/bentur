import { useCallback, useSyncExternalStore } from 'react';

// Larghezza sotto cui l'interfaccia passa al layout da cellulare (uguale ai @media degli SCSS)
export const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

const supportsMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

// true se la media query è soddisfatta; si aggiorna quando cambia (es. rotazione del telefono)
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback((onChange: () => void) => {
    if (!supportsMatchMedia()) return () => {};
    const media = window.matchMedia(query);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return useSyncExternalStore(subscribe, () => supportsMatchMedia() && window.matchMedia(query).matches, () => false);
};

// Sotto questa larghezza (tablet e cellulare) i pannelli laterali diventano pannelli in primo piano
export const COMPACT_MEDIA_QUERY = '(max-width: 1023px)';
