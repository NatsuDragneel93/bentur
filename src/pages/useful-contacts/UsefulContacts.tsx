import React, { useState } from 'react';
import './UsefulContacts.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

interface Contact {
  name: string;
  category: string;
  phone: string;
  email: string;
  notes: string;
}

const UsefulContacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newContact, setNewContact] = useState<Contact>({
    name: '',
    category: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);

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
    setNewContact({ name: '', category: '', phone: '', email: '', notes: '' });
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

  return (
    <div className="useful-contacts-page-container">
      <h1>Your Contacts</h1>
      <button className="add-contact-button" onClick={() => setIsModalOpen(true)}>
        Aggiungi Contatto
      </button>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingIndex !== null ? 'Modifica Contatto' : 'Aggiungi Nuovo Contatto'}</h2>
            <form>
              <label>
                Nome:
                <input type="text" name="name" value={newContact.name} onChange={handleInputChange}/>
              </label>
              <label>
                Categoria:
                <input type="text" name="category" value={newContact.category} onChange={handleInputChange}/>
              </label>
              <label>
                Telefono:
                <input type="text" name="phone" value={newContact.phone} onChange={handleInputChange}/>
              </label>
              <label>
                Email:
                <input type="email" name="email" value={newContact.email} onChange={handleInputChange}/>
              </label>
              <label>
                Note:
                <textarea name="notes" value={newContact.notes} onChange={handleInputChange}/>
              </label>
              <div className="add-edit-actions">
                <button type="button" className="save-button" onClick={handleAddOrEditContact}>
                  {editingIndex !== null ? 'Salva Modifiche' : 'Salva'}
                </button>
                <button type="button" className="cancel-button" onClick={() => setIsModalOpen(false)}>
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

      <div className="contacts-list">
        {contacts.map((contact, index) => (
          <div key={index} className="contact-card">
            <h3>{contact.name}</h3>
            <div><strong>Categoria:</strong> {contact.category}</div>
            <div><strong>Telefono:</strong> {contact.phone}</div>
            <div><strong>Email:</strong> {contact.email}</div>
            <div><strong>Note:</strong> {contact.notes}</div>
            <div className="card-actions">
              <button className="edit-button" onClick={() => handleEditContact(index)}>
                Modifica
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
    </div>
  );
};

export default UsefulContacts;