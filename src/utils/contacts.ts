import type { Contact } from '../services/usefulContacts.service';

// `value` è ciò che viene salvato su Firestore (non cambiarlo: i contatti esistenti lo usano),
// `labelKey` è la chiave di traduzione mostrata all'utente
export const CONTACT_CATEGORIES = [
  { value: 'Negozio strumenti', labelKey: 'contacts.categories.instrumentStore' },
  { value: 'Service', labelKey: 'contacts.categories.service' },
  { value: 'Tecnico/riparatore', labelKey: 'contacts.categories.technician' },
  { value: 'Utility', labelKey: 'contacts.categories.utility' },
] as const;

export const getCategoryLabelKey = (value: string) =>
  CONTACT_CATEGORIES.find(category => category.value === value)?.labelKey;

export interface ContactFilters {
  category: string;
  city: string;
}

// "  gENOVA " -> "Genova": stessa forma per elenco città e confronto nei filtri
export const normalizeCity = (city: string): string => {
  const trimmed = city.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

// Città distinte (normalizzate, senza vuote) in ordine alfabetico
export const getUniqueCities = (contacts: Contact[]): string[] => {
  const cities = contacts
    .map(contact => normalizeCity(contact.city))
    .filter(city => city !== '');

  return [...new Set(cities)].sort((a, b) => a.localeCompare(b));
};

export const filterContacts = (
  contacts: Contact[],
  filters: ContactFilters,
  searchTerm: string
): Contact[] => {
  const search = searchTerm.trim().toLowerCase();

  return contacts.filter(contact => {
    const categoryMatch = filters.category === '' || contact.category === filters.category;
    const cityMatch = filters.city === '' || normalizeCity(contact.city) === filters.city;
    const nameMatch = contact.name.toLowerCase().includes(search);
    return categoryMatch && cityMatch && nameMatch;
  });
};
