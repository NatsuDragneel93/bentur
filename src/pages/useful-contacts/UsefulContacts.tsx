import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './UsefulContacts.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFilter, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useRequiredUser } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import usefulContactsService, { Contact } from '../../services/usefulContacts.service';
import { CONTACT_CATEGORIES, ContactFilters, filterContacts, getCategoryLabelKey, getUniqueCities } from '../../utils/contacts';
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
  const { t } = useTranslation();
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
      showError(t('contacts.loadError'));
    }
  }, [showError, t]);

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
      showError(t('contacts.requiredFields'));
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
      showError(t('contacts.saveError'));
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
      showError(t('contacts.deleteError'));
    }
  };

  const handleFilterChange = (field: keyof ContactFilters, value: string) => {
    setFilters(current => ({ ...current, [field]: value }));
  };

  // Etichetta tradotta della categoria; valori sconosciuti mostrati così come sono salvati
  const categoryLabel = (value: string) => {
    const labelKey = getCategoryLabelKey(value);
    return labelKey ? t(labelKey) : value;
  };

  const filteredContacts = filterContacts(contacts, filters, searchTerm);
  const uniqueCities = getUniqueCities(contacts);

  const searchBar = (
    <div className="search-bar">
      <input
        type="text"
        placeholder={t('contacts.search')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );

  const filterToggle = (
    <button className="filter-button" onClick={() => setShowFilters(!showFilters)} aria-label={t('contacts.filters')}>
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
          aria-label={t('contacts.filterByCategory')}
        >
          <option value="" disabled>{t('contacts.selectCategory')}</option>
          {CONTACT_CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>{t(category.labelKey)}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <select
          className="filter-select"
          value={filters.city}
          onChange={(e) => handleFilterChange('city', e.target.value)}
          aria-label={t('contacts.filterByCity')}
        >
          <option value="" disabled>{t('contacts.selectCity')}</option>
          {uniqueCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <button
          className="reset-filters-button"
          onClick={() => setFilters(emptyFilters)}
          aria-label={t('contacts.resetFilters')}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="useful-contacts-page-container">
        <LoadingState message={t('contacts.loading')} />
      </div>
    );
  }

  return (
    <div className="useful-contacts-page-container">
      <div className="contacts-container">
        <h1>{t('contacts.title')}</h1>

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
              <div className="card-row"><strong>{t('contacts.categoryField')}</strong> {categoryLabel(contact.category)}</div>
              <div className="card-row"><strong>{t('contacts.phoneField')}</strong> {contact.phone}</div>
              <div className="card-row"><strong>{t('contacts.emailField')}</strong> {contact.email}</div>
              <div className="card-row"><strong>{t('contacts.cityField')}</strong> {contact.city}</div>
              <div className="card-row"><strong>{t('contacts.notesField')}</strong> {contact.notes}</div>
              <div className="card-actions">
                <button className="edit-button" onClick={() => openEditModal(contact)}>
                  <FontAwesomeIcon icon={faEdit} /> {t('common.edit')}
                </button>
                <button
                  className="delete-button"
                  onClick={() => setContactToDelete(contact.id ?? null)}
                  aria-label={t('contacts.deleteLabel', { name: contact.name })}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <FloatingAddButton label={t('contacts.add')} onClick={openAddModal} />
      </div>

      <FormModal
        open={isModalOpen}
        title={t(editingId !== null ? 'contacts.editTitle' : 'contacts.addTitle')}
        submitLabel={t(editingId !== null ? 'common.saveChanges' : 'common.save')}
        onSubmit={handleSave}
        onClose={closeModal}
      >
        <label>
          {t('contacts.nameField')}
          <input type="text" name="name" value={form.name} onChange={handleInputChange} autoFocus />
        </label>
        <label>
          {t('contacts.categoryField')}
          <select name="category" value={form.category} onChange={handleInputChange}>
            <option value="">{t('contacts.categoryPlaceholder')}</option>
            {CONTACT_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>{t(category.labelKey)}</option>
            ))}
          </select>
        </label>
        <label>
          {t('contacts.phoneField')}
          <input type="tel" name="phone" value={form.phone} onChange={handleInputChange} />
        </label>
        <label>
          {t('contacts.emailField')}
          <input type="email" name="email" value={form.email} onChange={handleInputChange} />
        </label>
        <label>
          {t('contacts.cityField')}
          <input type="text" name="city" value={form.city} onChange={handleInputChange} />
        </label>
        <label>
          {t('contacts.notesField')}
          <textarea name="notes" value={form.notes} onChange={handleInputChange} />
        </label>
      </FormModal>

      <ConfirmDialog
        open={contactToDelete !== null}
        message={t('contacts.deleteConfirm')}
        onConfirm={handleDelete}
        onCancel={() => setContactToDelete(null)}
      />
    </div>
  );
};

export default UsefulContacts;
