import React, { useState, useEffect } from 'react';
import './Manuals.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEdit, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useFirebase } from '../../context/firebase.context';
import { onAuthStateChanged, User } from 'firebase/auth';
import manualsService, { Manual } from '../../services/manuals.service';

const Manuals: React.FC = () => {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebase = useFirebase();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [manualToDelete, setManualToDelete] = useState<number | null>(null);
  const [newManual, setNewManual] = useState<Omit<Manual, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>({
    title: '', 
    link: ''
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserManuals(currentUser.uid);
      } else {
        setManuals([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firebase.auth]);

  const loadUserManuals = async (userId: string) => {
    try {
      setLoading(true);
      const userManuals = await manualsService.getUserManuals(userId);
      setManuals(userManuals);
    } catch (error) {
      console.error('Errore nel caricamento dei manuali:', error);
      alert('Errore nel caricamento dei manuali');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewManual({ ...newManual, [name]: value });
  };

  const handleAddOrEditManual = async () => {
    if (!user) {
      alert('Devi essere autenticato per gestire i manuali');
      return;
    }

    try {
      if (editingIndex !== null) {
        // Modifica manuale esistente
        const manualToUpdate = manuals[editingIndex];
        if (manualToUpdate.id) {
          await manualsService.updateManual(manualToUpdate.id, newManual);
          await loadUserManuals(user.uid);
        }
      } else {
        // Aggiungi nuovo manuale
        await manualsService.addManual(user.uid, newManual);
        await loadUserManuals(user.uid);
      }
      
      setNewManual({ title: '', link: '' });
      setEditingIndex(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Errore nel salvare il manuale:', error);
      alert('Errore nel salvare il manuale');
    }
  };

  const handleDeleteManual = async () => {
    if (!user || manualToDelete === null) return;

    try {
      const manualToRemove = manuals[manualToDelete];
      if (manualToRemove.id) {
        await manualsService.deleteManual(manualToRemove.id);
        await loadUserManuals(user.uid);
      }
      setManualToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Errore nell\'eliminazione del manuale:', error);
      alert('Errore nell\'eliminazione del manuale');
    }
  };

  const handleEditManual = (index: number) => {
    const manual = manuals[index];
    setNewManual({
      title: manual.title,
      link: manual.link
    });
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
    // Reset dei campi quando si chiude la modale
    setNewManual({ title: '', link: '' });
  };

  const openAddManualModal = () => {
    // Reset dei campi prima di aprire la modale per un nuovo manuale
    setNewManual({ title: '', link: '' });
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const filteredManuals = manuals.filter((manual) =>
    manual.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="manuals-page-container">
        <div className="manuals-container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            fontSize: '18px',
            color: 'white'
          }}>
            Caricamento manuali...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manuals-page-container">
      <div className="manuals-container">
        <h1>Manuals</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cerca manuali..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="manuals-list">
          {filteredManuals.map((manual, index) => (
            <div key={manual.id} className="manual-item">
              <div className="manual-info">
                <span className="manual-title">{manual.title}</span>
                <span className="manual-link">{manual.link}</span>
              </div>
              <div className="manual-actions">
                <a
                  href={manual.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="open-button"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} /> Apri
                </a>
                <button className="edit-button" onClick={() => handleEditManual(index)}>
                  <FontAwesomeIcon icon={faEdit} /> Modifica
                </button>
                <button
                  className="delete-button"
                  onClick={() => {
                    setManualToDelete(index);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} /> Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          className="add-manual-floating-button"
          onClick={openAddManualModal}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingIndex !== null ? 'Modifica Manuale' : 'Aggiungi Manuale'}</h2>
            <form>
              <label>
                Titolo:
                <input
                  type="text"
                  name="title"
                  value={newManual.title}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Link:
                <input
                  type="text"
                  name="link"
                  value={newManual.link}
                  onChange={handleInputChange}
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="save-button" onClick={handleAddOrEditManual}>
                  {editingIndex !== null ? 'Salva Modifiche' : 'Aggiungi'}
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
            <h3>Sei sicuro di voler cancellare il manuale?</h3>
            <div className="delete-actions">
              <button
                type="button"
                className="confirm-button"
                onClick={handleDeleteManual}
              >
                Sì
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Manuals;