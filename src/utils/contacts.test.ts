import { describe, expect, it } from 'vitest';
import type { Contact } from '../services/usefulContacts.service';
import { filterContacts, getUniqueCities, normalizeCity } from './contacts';

const contact = (overrides: Partial<Contact>): Contact => ({
  id: 'id',
  userId: 'user-1',
  name: '',
  category: '',
  phone: '',
  email: '',
  notes: '',
  city: '',
  ...overrides,
});

const contacts = [
  contact({ id: '1', name: 'Music Store', category: 'Negozio strumenti', city: 'genova' }),
  contact({ id: '2', name: 'Audio Service', category: 'Service', city: ' Milano ' }),
  contact({ id: '3', name: 'Mario Riparazioni', category: 'Tecnico/riparatore', city: 'GENOVA' }),
  contact({ id: '4', name: 'Senza città', category: 'Utility', city: '' }),
];

const noFilters = { category: '', city: '' };

describe('normalizeCity', () => {
  it('toglie gli spazi e capitalizza', () => {
    expect(normalizeCity('  gENOVA ')).toBe('Genova');
  });
});

describe('getUniqueCities', () => {
  it('restituisce città normalizzate, distinte, non vuote e ordinate', () => {
    expect(getUniqueCities(contacts)).toEqual(['Genova', 'Milano']);
  });
});

describe('filterContacts', () => {
  it('senza filtri restituisce tutti i contatti', () => {
    expect(filterContacts(contacts, noFilters, '')).toHaveLength(4);
  });

  it('filtra per nome ignorando maiuscole', () => {
    expect(filterContacts(contacts, noFilters, 'audio').map(c => c.id)).toEqual(['2']);
  });

  it('filtra per categoria', () => {
    const result = filterContacts(contacts, { category: 'Service', city: '' }, '');
    expect(result.map(c => c.id)).toEqual(['2']);
  });

  it('filtra per città anche se salvata con spazi o maiuscole diverse', () => {
    expect(filterContacts(contacts, { category: '', city: 'Genova' }, '').map(c => c.id)).toEqual(['1', '3']);
    expect(filterContacts(contacts, { category: '', city: 'Milano' }, '').map(c => c.id)).toEqual(['2']);
  });

  it('combina filtri e ricerca', () => {
    const result = filterContacts(contacts, { category: 'Tecnico/riparatore', city: 'Genova' }, 'mario');
    expect(result.map(c => c.id)).toEqual(['3']);
  });
});
