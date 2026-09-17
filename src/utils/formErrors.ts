import type { ParseKeys } from 'i18next';

// Errori di validazione di un form: per ogni campo non valido, la chiave di traduzione del messaggio
export type FormErrors<TForm> = Partial<Record<keyof TForm, ParseKeys>>;

export const hasErrors = <TForm>(errors: FormErrors<TForm>): boolean =>
  Object.values(errors).some(Boolean);

// Errori dei campi obbligatori rimasti vuoti (spazi compresi)
export const requiredFieldErrors = <TForm extends object>(
  form: TForm,
  required: Partial<Record<keyof TForm, ParseKeys>>
): FormErrors<TForm> => {
  const errors: FormErrors<TForm> = {};
  for (const field of Object.keys(required) as (keyof TForm)[]) {
    const value = form[field];
    if (typeof value !== 'string' || value.trim() === '') errors[field] = required[field];
  }
  return errors;
};

// Toglie l'errore di un campo (quando l'utente lo modifica)
export const withoutError = <TForm>(errors: FormErrors<TForm>, field: keyof TForm): FormErrors<TForm> => {
  if (!errors[field]) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
};
