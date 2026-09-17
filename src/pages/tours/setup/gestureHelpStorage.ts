// Chiave in localStorage: se presente l'aiuto sui gesti non si apre più da solo
export const GESTURE_HELP_STORAGE_KEY = 'bentur.setupHelpSeen';

// localStorage può non essere disponibile (es. navigazione privata): in quel caso l'aiuto si mostra sempre
export const hasSeenGestureHelp = (): boolean => {
  try {
    return localStorage.getItem(GESTURE_HELP_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const markGestureHelpSeen = () => {
  try {
    localStorage.setItem(GESTURE_HELP_STORAGE_KEY, '1');
  } catch {
    // Nessun problema: al prossimo accesso l'aiuto verrà mostrato di nuovo
  }
};
