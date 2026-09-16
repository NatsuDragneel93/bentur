import { DocumentReference, writeBatch } from 'firebase/firestore';
import FirebaseService from './firebase.service';

// Limite di operazioni per singolo batch Firestore
export const MAX_BATCH_OPERATIONS = 500;

/**
 * Elimina i documenti nell'ordine dato, a gruppi di al massimo 500 (limite di Firestore).
 * Fino a 500 documenti l'operazione è atomica; oltre, i gruppi sono confermati uno dopo l'altro.
 * Mettere i documenti "padre" per ultimi: le regole di sicurezza dei figli li leggono.
 */
export const deleteInBatches = async (refs: DocumentReference[]): Promise<void> => {
  for (let start = 0; start < refs.length; start += MAX_BATCH_OPERATIONS) {
    const batch = writeBatch(FirebaseService.database);
    refs.slice(start, start + MAX_BATCH_OPERATIONS).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
};
