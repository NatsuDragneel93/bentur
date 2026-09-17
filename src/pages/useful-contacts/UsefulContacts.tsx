import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faFilter,
  faLocationDot,
  faPen,
  faPhone,
  faPlus,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { useRequiredUser } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { MOBILE_MEDIA_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import usefulContactsService, { Contact } from '../../services/usefulContacts.service';
import { CONTACT_CATEGORIES, ContactFilters, filterContacts, getCategoryLabelKey, getUniqueCities } from '../../utils/contacts';
import { FormErrors, hasErrors, requiredFieldErrors, withoutError } from '../../utils/formErrors';
import FormModal from '../../components/ui/FormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingState from '../../components/ui/LoadingState';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import Field from '../../components/ui/Field';
import { Input, Select, Textarea } from '../../components/ui/Input';
import SearchInput from '../../components/ui/SearchInput';
import Segmented from '../../components/ui/Segmented';
import MenuSelect from '../../components/ui/MenuSelect';
import Tag from '../../components/ui/Tag';
import { Card } from '../../components/ui/Card';
import { Page, PageTitle, TopBar } from '../../components/ui/PageLayout';
import './UsefulContacts.scss';

type ContactForm = Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

const emptyForm: ContactForm = { name: '', category: '', phone: '', email: '', notes: '', city: '' };
const emptyFilters: ContactFilters = { category: '', city: '' };

// Il Service è la categoria messa in evidenza nelle card
const HIGHLIGHTED_CATEGORY = 'Service';

const UsefulContacts: React.FC = () => {
  const user = useRequiredUser();
  const { showError } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors<ContactForm>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Su cellulare i filtri stanno dietro al pulsante "Filtri"
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ContactFilters>(emptyFilters);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const field = name as keyof ContactForm;
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => withoutError(current, field));
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setErrors({});
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
    setErrors({});
    setEditingId(contact.id ?? null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const validation = requiredFieldErrors(form, { name: 'contacts.nameRequired', category: 'contacts.categoryRequired' });
    if (hasErrors(validation)) {
      setErrors(validation);
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
  const filtersVisible = !mobile || showFilters;

  return (
    <Page className="contacts">
      <TopBar back={{ label: t('nav.home'), onClick: () => navigate('/home') }} />

      <PageTitle
        title={t('contacts.title')}
        subtitle={t('contacts.subtitle')}
        primaryAction={
          <Button variant="primary" icon={faPlus} className="bt-btn-lg" onClick={openAddModal}>
            {t('contacts.add')}
          </Button>
        }
      />

      <div className="contacts__filters">
        <div className="contacts__search-row">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={t('contacts.search')} />
          {mobile && (
            <Button
              icon={faFilter}
              className="bt-btn-md"
              onClick={() => setShowFilters(current => !current)}
              aria-expanded={showFilters}
            >
              {t('contacts.filters')}
            </Button>
          )}
        </div>

        {filtersVisible && (
          <>
            <Segmented
              ariaLabel={t('contacts.filterByCategory')}
              value={filters.category}
              onChange={value => handleFilterChange('category', value)}
              options={[
                { value: '', label: t('contacts.allCategories') },
                ...CONTACT_CATEGORIES.map(category => ({ value: category.value, label: t(category.labelKey) })),
              ]}
            />
            <MenuSelect
              icon={faLocationDot}
              label={filters.city || t('contacts.city')}
              ariaLabel={t('contacts.filterByCity')}
              value={filters.city}
              onChange={value => handleFilterChange('city', value)}
              options={[
                { value: '', label: t('contacts.allCities') },
                ...uniqueCities.map(city => ({ value: city, label: city })),
              ]}
            />
            <Button variant="ghost" className="contacts__clear" onClick={() => setFilters(emptyFilters)}>
              {t('contacts.resetFilters')}
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <LoadingState message={t('contacts.loading')} />
      ) : (
        <ul className="bt-grid contacts__list">
          {filteredContacts.map((contact) => (
            <li key={contact.id}>
              <Card className="contacts__card">
                <div className="contacts__card-header">
                  <div className="contacts__identity">
                    <h2 className="contacts__name">{contact.name}</h2>
                    {contact.city && <div className="contacts__city">{contact.city}</div>}
                  </div>
                  {contact.category && (
                    <Tag tone={contact.category === HIGHLIGHTED_CATEGORY ? 'accent' : 'neutral'}>
                      {categoryLabel(contact.category)}
                    </Tag>
                  )}
                </div>

                {(contact.phone || contact.email) && (
                  <div className="contacts__channels">
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="contacts__channel">
                        <FontAwesomeIcon icon={faPhone} aria-label={t('contacts.phoneField')} />
                        {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="contacts__channel">
                        <FontAwesomeIcon icon={faEnvelope} aria-label={t('contacts.emailField')} />
                        {contact.email}
                      </a>
                    )}
                  </div>
                )}

                {contact.notes && <p className="contacts__notes">{contact.notes}</p>}

                <div className="contacts__card-actions">
                  <Button icon={faPen} onClick={() => openEditModal(contact)} aria-label={t('contacts.editLabel', { name: contact.name })}>
                    {t('common.edit')}
                  </Button>
                  <IconButton
                    icon={faTrashCan}
                    danger
                    label={t('contacts.deleteLabel', { name: contact.name })}
                    onClick={() => setContactToDelete(contact.id ?? null)}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <FormModal
        open={isModalOpen}
        title={t(editingId !== null ? 'contacts.editTitle' : 'contacts.addTitle')}
        submitLabel={t(editingId !== null ? 'common.saveChanges' : 'common.save')}
        onSubmit={handleSave}
        onClose={closeModal}
      >
        <Field label={t('contacts.nameField')} error={errors.name && t(errors.name)}>
          <Input name="name" value={form.name} onChange={handleInputChange} autoFocus />
        </Field>
        <Field label={t('contacts.categoryField')} error={errors.category && t(errors.category)}>
          <Select name="category" value={form.category} onChange={handleInputChange}>
            <option value="">{t('contacts.categoryPlaceholder')}</option>
            {CONTACT_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>{t(category.labelKey)}</option>
            ))}
          </Select>
        </Field>
        <Field label={t('contacts.phoneField')}>
          <Input type="tel" name="phone" value={form.phone} onChange={handleInputChange} />
        </Field>
        <Field label={t('contacts.emailField')}>
          <Input type="email" name="email" value={form.email} onChange={handleInputChange} />
        </Field>
        <Field label={t('contacts.cityField')}>
          <Input name="city" value={form.city} onChange={handleInputChange} />
        </Field>
        <Field label={t('contacts.notesField')}>
          <Textarea name="notes" value={form.notes} onChange={handleInputChange} />
        </Field>
      </FormModal>

      <ConfirmDialog
        open={contactToDelete !== null}
        message={t('contacts.deleteConfirm')}
        onConfirm={handleDelete}
        onCancel={() => setContactToDelete(null)}
      />
    </Page>
  );
};

export default UsefulContacts;
