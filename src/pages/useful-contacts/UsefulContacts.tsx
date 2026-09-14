import React, { useEffect, useState } from 'react';
import './UsefulContacts.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFilter, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useFirebase } from '../../context/firebase.context';
import { onAuthStateChanged, User } from 'firebase/auth';
import usefulContactsService, { Contact } from '../../services/usefulContacts.service';

const UsefulContacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebase = useFirebase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newContact, setNewContact] = useState<Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>({
    name: '',
    category: '',
    phone: '',
    email: '',
    notes: '',
    city: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    city: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserContacts(currentUser.uid);
      } else {
        setContacts([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firebase.auth]);

  const loadUserContacts = async (userId: string) => {
    try {
      setLoading(true);
      const userContacts = await usefulContactsService.getUserContacts(userId);
      setContacts(userContacts);
    } catch (error) {
      console.error('Errore nel caricamento dei contatti:', error);
      alert('Errore nel caricamento dei contatti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewContact({ ...newContact, [name]: value });
  };

  const handleAddOrEditContact = async () => {
    if (!user) {
      alert('Devi essere autenticato per aggiungere contatti');
      return;
    }

    if (!newContact.name.trim() || !newContact.category) {
      alert('Nome e categoria sono obbligatori');
      return;
    }

    try {
      if (editingId !== null) {
        // Modifica contatto esistente
        await usefulContactsService.updateContact(editingId, newContact);
        await loadUserContacts(user.uid);
      } else {
        // Aggiungi nuovo contatto
        await usefulContactsService.addContact(user.uid, newContact);
        await loadUserContacts(user.uid);
      }
      
      setNewContact({ name: '', category: '', phone: '', email: '', notes: '', city: '' });
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      console.error('Errore nel salvare il contatto:', error);
      alert('Errore nel salvare il contatto');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setNewContact({
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

  const handleDeleteContact = async () => {
    if (!user || contactToDelete === null) return;

    try {
      await usefulContactsService.deleteContact(contactToDelete);
      await loadUserContacts(user.uid);
      setContactToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Errore nell\'eliminazione del contatto:', error);
      alert('Errore nell\'eliminazione del contatto');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    // Reset dei campi quando si chiude la modale
    setNewContact({ name: '', category: '', phone: '', email: '', notes: '', city: '' });
  };

  const openAddContactModal = () => {
    // Reset dei campi prima di aprire la modale per un nuovo contatto
    setNewContact({ name: '', category: '', phone: '', email: '', notes: '', city: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const filteredContacts = contacts
  .filter((contact) => {
    const categoryMatch = filters.category === '' || contact.category === filters.category;
    const cityMatch = filters.city === '' || 
      (contact.city.charAt(0).toUpperCase() + contact.city.slice(1).toLowerCase()) === filters.city;
    
    return categoryMatch && cityMatch;
  })
  .filter((contact) => {
    return contact.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Funzione per estrarre le città uniche dai contatti
  const getUniqueCities = (): string[] => {
    const cities = contacts
      .map(contact => contact.city.trim()) // Rimuove spazi
      .filter(city => city !== '') // Rimuove città vuote
      .map(city => 
        // Capitalizza la prima lettera e minuscole per il resto
        city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
      );
    
    // Rimuove duplicati e ordina alfabeticamente
    return [...new Set(cities)].sort();
  };

  const uniqueCities = getUniqueCities();

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="useful-contacts-page-container">
        <div className="contacts-container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            fontSize: '18px' 
          }}>
            Caricamento contatti...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="useful-contacts-page-container">
      <div className='contacts-container'>
      <h1>Your Contacts</h1>

      {isMobile ? (
        <div className="header-container mobile">
          <div className="searchbar-filter">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Cerca contatti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filters">
              <button className="filter-button" onClick={() => setShowFilters(!showFilters)}>
                <FontAwesomeIcon icon={faFilter} />
              </button>
            </div>
          </div>
          {showFilters && (
                <div className="filter-section">
                <div className="filter-group">
                  <select
                    className="filter-select"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="" disabled>
                      Seleziona categoria
                    </option>
                    <option value="Negozio strumenti">Negozio strumenti</option>
                    <option value="Service">Service</option>
                    <option value="Tecnico/riparatore">Tecnico/riparatore</option>
                    <option value="Utility">Utility</option>
                  </select>
                </div>
                <div className="filter-group">
                  <select
                    className="filter-select"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  >
                    <option value="" disabled>
                      Seleziona città
                    </option>
                    {uniqueCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <button
                    className="reset-filters-button"
                    onClick={() => setFilters({ category: '', city: '' })}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              )}
        </div>
      ) : (
        <div className="header-container desktop">
          <div className="searchbar-filter">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Cerca contatti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filters">
              <button className="filter-button" onClick={() => setShowFilters(!showFilters)}>
                <FontAwesomeIcon icon={faFilter} />
              </button>
              {showFilters && (
                <div className="filter-section">
                  <div className="filter-group">
                    <select
                      className="filter-select"
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <option value="" disabled>
                        Seleziona categoria
                      </option>
                      <option value="Negozio strumenti">Negozio strumenti</option>
                      <option value="Service">Service</option>
                      <option value="Tecnico/riparatore">Tecnico/riparatore</option>
                      <option value="Utility">Utility</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <select
                      className="filter-select"
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                    >
                      <option value="" disabled>
                        Seleziona città
                      </option>
                      {uniqueCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <button className="reset-filters-button" onClick={() => setFilters({ category: '', city: '' })}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              )}
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
              <button className="edit-button" onClick={() => handleEditContact(contact)}>
                <FontAwesomeIcon icon={faEdit} /> Modifica
              </button>
              <button className="delete-button" onClick={() => {
                setContactToDelete(contact.id ?? null);
                setIsDeleteModalOpen(true);
              }}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ))}
      </div>
  
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingId !== null ? 'Modifica Contatto' : 'Aggiungi Nuovo Contatto'}</h2>
            <form>
              <label>
                Nome:
                <input type="text" name="name" value={newContact.name} onChange={handleInputChange} />
              </label>
              <label>
                Categoria:
                <select name="category" value={newContact.category} onChange={handleInputChange} required>
                  <option value="">Seleziona una categoria</option>
                  <option value="Negozio strumenti">Negozio strumenti</option>
                  <option value="Service">Service</option>
                  <option value="Utility">Utility</option>
                  <option value="Tecnico/riparatore">Tecnico/riparatore</option>
                </select>
              </label>
              <label>
                Telefono:
                <input type="text" name="phone" value={newContact.phone} onChange={handleInputChange} />
              </label>
              <label>
                Email:
                <input type="email" name="email" value={newContact.email} onChange={handleInputChange} />
              </label>
              <label>
                Città:
                <input name="city" value={newContact.city} onChange={handleInputChange} />
              </label>
              <label>
                Note:
                <textarea name="notes" value={newContact.notes} onChange={handleInputChange} />
              </label>
              <div className="add-edit-actions">
                <button type="button" className="save-button" onClick={handleAddOrEditContact}>
                  {editingId !== null ? 'Salva Modifiche' : 'Salva'}
                </button>
                <button type="button" className="cancel-button" onClick={closeModal}>
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  
      {isDeleteModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Sicuro di voler cancellare il contatto?</h3>
            <div className="delete-actions">
              <button type="button" className="confirm-button" onClick={handleDeleteContact}>
                Sì
              </button>
              <button type="button" className="cancel-button" onClick={() => setIsDeleteModalOpen(false)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
  
      <button 
        className={`add-contact-floating-button ${isMobile && isModalOpen ? 'hidden-mobile' : ''}`} 
        onClick={openAddContactModal}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
      </div>
    </div>
  );
};

export default UsefulContacts;