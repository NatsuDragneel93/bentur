import React, { useState } from 'react';
import './Manuals.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEdit, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

interface Manual {
  id: number;
  title: string;
  link: string;
}

const Manuals: React.FC = () => {
  const [manuals, setManuals] = useState<Manual[]>([
    { id: 1, title: 'Google', link: 'https://www.google.com' },
    { id: 2, title: 'Tesla', link: 'https://www.tesla.com' },
    { id: 3, title: 'Microsoft', link: 'https://www.microsoft.com' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [manualToDelete, setManualToDelete] = useState<number | null>(null);
  const [newManual, setNewManual] = useState<Manual>({ id: 0, title: '', link: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewManual({ ...newManual, [name]: value });
  };

  const handleAddOrEditManual = () => {
    const updatedLink = newManual.link.startsWith('http://') || newManual.link.startsWith('https://')
      ? newManual.link
      : `https://${newManual.link}`;

    if (editingIndex !== null) {
      const updatedManuals = [...manuals];
      updatedManuals[editingIndex] = { ...newManual, link: updatedLink };
      setManuals(updatedManuals);
    } else {
      setManuals([...manuals, { ...newManual, id: Date.now(), link: updatedLink }]);
    }

    setNewManual({ id: 0, title: '', link: '' });
    setEditingIndex(null);
    setIsModalOpen(false);
  };

  const handleDeleteManual = () => {
    if (manualToDelete !== null) {
      setManuals(manuals.filter((_, index) => index !== manualToDelete));
      setManualToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleEditManual = (index: number) => {
    setNewManual(manuals[index]);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const filteredManuals = manuals.filter((manual) =>
    manual.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          onClick={() => setIsModalOpen(true)}
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