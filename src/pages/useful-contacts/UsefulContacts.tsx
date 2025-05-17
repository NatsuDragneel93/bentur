import React, { useEffect, useState } from 'react';
import './UsefulContacts.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faFilter, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

interface Contact {
  name: string;
  category: string;
  phone: string;
  email: string;
  notes: string;
  city: string
}

const UsefulContacts: React.FC = () => {
  // const [contacts, setContacts] = useState<Contact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([
    {
      name: 'Thomann',
      category: 'Negozio strumenti',
      phone: '010111111',
      email: 'thoman@mail.com',
      notes: 'Strumenti musicali e accessori',
      city: 'Genova',
    },
    {
      name: 'Music Company',
      category: 'Negozio strumenti',
      phone: '020202022',
      email: 'muscomp@mail.com',
      notes: 'Specializzato in batterie',
      city: 'Milano',
    },
    {
      name: 'Tizio & Caio Srl',
      category: 'Service',
      phone: '010101020',
      email: 'tizioecaio@mail.com',
      notes: 'Service',
      city: 'Genova',
    },
    {
      name: 'Fabrizio',
      category: 'Tecnico/riparatore',
      phone: '3403403434',
      email: 'fabrizio@mail.com',
      notes: 'Riparatore chitarre e batterie',
      city: 'Milano',
    },
    {
      name: 'Scurreria',
      category: 'Utility',
      phone: '010505050',
      email: 'scurreria@mail.com',
      notes: 'Pub',
      city: 'Genova',
    },
    {
      name: 'Tamashi Ramen',
      category: 'Utility',
      phone: '010999999',
      email: 'tamashi@mail.com',
      notes: 'Ristorante',
      city: 'Genova',
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newContact, setNewContact] = useState<Contact>({
    name: '',
    category: '',
    phone: '',
    email: '',
    notes: '',
    city: '',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    city: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewContact({ ...newContact, [name]: value });
  };

  const handleAddOrEditContact = () => {
    if (editingIndex !== null) {
      const updatedContacts = [...contacts];
      updatedContacts[editingIndex] = newContact;
      setContacts(updatedContacts);
    } else {
      setContacts([...contacts, newContact]);
    }
    setNewContact({ name: '', category: '', phone: '', email: '', notes: '', city: '' });
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const handleEditContact = (index: number) => {
    setNewContact(contacts[index]);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleDeleteContact = () => {
    if (contactToDelete !== null) {
      setContacts(contacts.filter((_, index) => index !== contactToDelete));
      setContactToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const filteredContacts = contacts
  .filter((contact) => {
    return (
      (filters.category === '' || contact.category === filters.category) &&
      (filters.city === '' || contact.city === filters.city)
    );
  })
  .filter((contact) => {
    return contact.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleFilter = (category: string) => {
    setSearchTerm(category);
    setShowFilters(false);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: value,
    }));
  };

  return (
    <div className="useful-contacts-page-container">
      <div className='contacts-container'>
      <h1>Your Contacts</h1>
      {/* <div className="header-container">
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
                    className='filter-select'
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">Seleziona categoria</option>
                    <option value="Negozio strumenti">Negozio strumenti</option>
                    <option value="Service">Service</option>
                    <option value="Tecnico/riparatore">Tecnico/riparatore</option>
                    <option value="Utility">Utility</option>
                  </select>
                </div>
                <div className="filter-group">
                  <select
                    className='filter-select'
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  >
                    <option value="">Seleziona città</option>
                    <option value="Genova">Genova</option>
                    <option value="Milano">Milano</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div> */}

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
                    <option value="Genova">Genova</option>
                    <option value="Milano">Milano</option>
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
                      <option value="Genova">Genova</option>
                      <option value="Milano">Milano</option>
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
        {filteredContacts.map((contact, index) => (
          <div key={index} className="contact-card">
            <h3>{contact.name}</h3>
            <div className="card-row"><strong>Categoria:</strong> {contact.category}</div>
            <div className="card-row"><strong>Telefono:</strong> {contact.phone}</div>
            <div className="card-row"><strong>Email:</strong> {contact.email}</div>
            <div className="card-row"><strong>Città:</strong> {contact.city}</div>
            <div className="card-row"><strong>Note:</strong> {contact.notes}</div>
            <div className="card-actions">
              <button className="edit-button" onClick={() => handleEditContact(index)}>
                <FontAwesomeIcon icon={faEdit} /> Modifica
              </button>
              <button className="delete-button" onClick={() => {
                setContactToDelete(index);
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
            <h2>{editingIndex !== null ? 'Modifica Contatto' : 'Aggiungi Nuovo Contatto'}</h2>
            <form>
              <label>
                Nome:
                <input type="text" name="name" value={newContact.name} onChange={handleInputChange} />
              </label>
              <label>
                Categoria:
                <input type="text" name="category" value={newContact.category} onChange={handleInputChange} />
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
                  {editingIndex !== null ? 'Salva Modifiche' : 'Salva'}
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
  
      <button className="add-contact-floating-button" onClick={() => setIsModalOpen(true)}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
      </div>
    </div>
  );
};

export default UsefulContacts;