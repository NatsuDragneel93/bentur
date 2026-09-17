import { describe, expect, it } from 'vitest';
import { hasErrors, requiredFieldErrors, withoutError } from './formErrors';

describe('formErrors', () => {
  it('segnala i campi obbligatori vuoti o fatti di soli spazi', () => {
    const errors = requiredFieldErrors(
      { title: '  ', link: 'https://example.com', notes: '' },
      { title: 'manuals.titleRequired', link: 'manuals.linkRequired' }
    );

    expect(errors).toEqual({ title: 'manuals.titleRequired' });
    expect(hasErrors(errors)).toBe(true);
    expect(hasErrors({})).toBe(false);
  });

  it('toglie l\'errore di un solo campo senza modificare l\'originale', () => {
    const errors = { title: 'manuals.titleRequired', link: 'manuals.linkRequired' } as const;

    expect(withoutError(errors, 'title')).toEqual({ link: 'manuals.linkRequired' });
    expect(errors).toHaveProperty('title');
    expect(withoutError(errors, 'notes' as 'title')).toBe(errors);
  });
});
