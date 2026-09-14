import React, { useCallback, useEffect, useState } from 'react';
import './UsefulContacts.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFilter, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useRequiredUser } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import usefulContactsService, { Contact } from '../../services/usefulContacts.service';
import { CONTACT_CATEGORIES, ContactFilters, filterContacts, getUniqueCities } from '../../utils/contacts';
import FormModal from '../../components/ui/FormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingState from '../../components/ui/LoadingState';
import FloatingAddButton from '../../components/ui/FloatingAddButton';

type ContactForm = Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

const emptyForm: ContactForm = { name: '', category: '', phone: '', email: '', notes: '', city: '' };
const emptyFilters: ContactFilters = { category: '', city: '' };

const UsefulContacts: React.FC = () => {
  const user = useRequiredUser();
  const { showError } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ContactFilters>(emptyFilters);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const loadUserContacts = useCallback(async (userId: string) => {
    try {
      setContacts(await usefulContactsService.getUserContacts(userId));
    } catch (error) {
      console.error('Errore nel caricamento dei contatti:', error);
      showError('Errore nel caricamento dei contatti');
    }
  }, [showError]);

  useEffect(() => {
    loadUserContacts(user.uid).finally(() => setLoading(false));
  }, [user.uid, loadUserContacts]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setForm({
      name: contact.name,
      category: contact.category,
      phone: contact.phone,
      email: contact.email,
      notes: contact.notes,
      city: contact.city
    });
    setEditingId(contact.id ?? null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category) {
      showError('Nome e categoria sono obbligatori');
      return;
    }

    try {
      if (editingId !== null) {
        await usefulContactsService.updateContact(editingId, form);
      } else {
        await usefulContactsService.addContact(user.uid, form);
      }
      await loadUserContacts(user.uid);
      closeModal();
    } catch (error) {
      console.error('Errore nel salvare il contatto:', error);
      showError('Errore nel salvare il contatto');
    }
  };

  const handleDelete = async () => {
    if (contactToDelete === null) return;

    try {
      await usefulContactsService.deleteContact(contactToDelete);
      await loadUserContacts(user.uid);
      setContactToDelete(null);
    } catch (error) {
      console.error('Errore nell\'eliminazione del contatto:', error);
      showError('Errore nell\'eliminazione del contatto');
    }
  };

  const handleFilterChange = (field: keyof ContactFilters, value: string) => {
    setFilters(current => ({ ...current, [field]: value }));
  };

  const filteredContacts = filterContacts(contacts, filters, searchTerm);
  const uniqueCities = getUniqueCities(contacts);

  const searchBar = (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Cerca contatti..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );

  const filterToggle = (
    <button className="filter-button" onClick={() => setShowFilters(!showFilters)} aria-label="Filtri">
      <FontAwesomeIcon icon={faFilter} />
    </button>
  );

  const filterSection = showFilters && (
    <div className="filter-section">
      <div className="filter-group">
        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          aria-label="Filtra per categoria"
        >
          <option value="" disabled>Seleziona categoria</option>
          {CONTACT_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <select
          className="filter-select"
          value={filters.city}
          onChange={(e) => handleFilterChange('city', e.target.value)}
          aria-label="Filtra per città"
        >
          <option value="" disabled>Seleziona città</option>
          {uniqueCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <button
          className="reset-filters-button"
          onClick={() => setFilters(emptyFilters)}
          aria-label="Azzera filtri"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="useful-contacts-page-container">
        <LoadingState message="Caricamento contatti..." />
      </div>
    );
  }

  return (
    <div className="useful-contacts-page-container">
      <div className="contacts-container">
        <h1>Your Contacts</h1>

        {isMobile ? (
          <div className="header-container mobile">
            <div className="searchbar-filter">
              {searchBar}
              <div className="filters">{filterToggle}</div>
            </div>
            {filterSection}
          </div>
        ) : (
          <div className="header-container desktop">
            <div className="searchbar-filter">
              {searchBar}
              <div className="filters">
                {filterToggle}
                {filterSection}
              </div>
            </div>
          </div>
        )}

        <div className="contacts-list">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="contact-card">
              <h3>{contact.name}</h3>
              <div className="card-row"><strong>Categoria:</strong> {contact.category}</div>
              <div className="card-row"><strong>Telefono:</strong> {contact.phone}</div>
              <div className="card-row"><strong>Email:</strong> {contact.email}</div>
              <div className="card-row"><strong>Città:</strong> {contact.city}</div>
              <div className="card-row"><strong>Note:</strong> {contact.notes}</div>
              <div className="card-actions">
                <button className="edit-button" onClick={() => openEditModal(contact)}>
                  <FontAwesomeIcon icon={faEdit} /> Modifica
                </button>
                <button
                  className="delete-button"
                  onClick={() => setContactToDelete(contact.id ?? null)}
                  aria-label={`Elimina ${contact.name}`}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <FloatingAddButton label="Aggiungi contatto" onClick={openAddModal} />
      </div>

      <FormModal
        open={isModalOpen}
        title={editingId !== null ? 'Modifica Contatto' : 'Aggiungi Nuovo Contatto'}
        submitLabel={editingId !== null ? 'Salva Modifiche' : 'Salva'}
        onSubmit={handleSave}
        onClose={closeModal}
      >
        <label>
          Nome:
          <input type="text" name="name" value={form.name} onChange={handleInputChange} autoFocus />
        </label>
        <label>
          Categoria:
          <select name="category" value={form.category} onChange={handleInputChange}>
            <option value="">Seleziona una categoria</option>
            {CONTACT_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          Telefono:
          <input type="tel" name="phone" value={form.phone} onChange={handleInputChange} />
        </label>
        <label>
          Email:
          <input type="email" name="email" value={form.email} onChange={handleInputChange} />
        </label>
        <label>
          Città:
          <input type="text" name="city" value={form.city} onChange={handleInputChange} />
        </label>
        <label>
          Note:
          <textarea name="notes" value={form.notes} onChange={handleInputChange} />
        </label>
      </FormModal>

      <ConfirmDialog
        open={contactToDelete !== null}
        message="Sicuro di voler cancellare il contatto?"
        onConfirm={handleDelete}
        onCancel={() => setContactToDelete(null)}
      />
    </div>
  );
};

export default UsefulContacts;
