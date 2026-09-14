import React, { useState, useEffect, useCallback } from 'react';
import './Manuals.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useRequiredUser } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import manualsService, { Manual } from '../../services/manuals.service';
import FormModal from '../../components/ui/FormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingState from '../../components/ui/LoadingState';
import FloatingAddButton from '../../components/ui/FloatingAddButton';

type ManualForm = Pick<Manual, 'title' | 'link'>;

const emptyForm: ManualForm = { title: '', link: '' };

const Manuals: React.FC = () => {
  const user = useRequiredUser();
  const { showError } = useToast();
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ManualForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualToDelete, setManualToDelete] = useState<string | null>(null);

  const loadUserManuals = useCallback(async (userId: string) => {
    try {
      setManuals(await manualsService.getUserManuals(userId));
    } catch (error) {
      console.error('Errore nel caricamento dei manuali:', error);
      showError('Errore nel caricamento dei manuali');
    }
  }, [showError]);

  useEffect(() => {
    loadUserManuals(user.uid).finally(() => setLoading(false));
  }, [user.uid, loadUserManuals]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (manual: Manual) => {
    setForm({ title: manual.title, link: manual.link });
    setEditingId(manual.id ?? null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.link.trim()) {
      showError('Titolo e link sono obbligatori');
      return;
    }

    try {
      if (editingId !== null) {
        await manualsService.updateManual(editingId, form);
      } else {
        await manualsService.addManual(user.uid, form);
      }
      await loadUserManuals(user.uid);
      closeModal();
    } catch (error) {
      console.error('Errore nel salvare il manuale:', error);
      showError('Errore nel salvare il manuale');
    }
  };

  const handleDelete = async () => {
    if (manualToDelete === null) return;

    try {
      await manualsService.deleteManual(manualToDelete);
      await loadUserManuals(user.uid);
      setManualToDelete(null);
    } catch (error) {
      console.error('Errore nell\'eliminazione del manuale:', error);
      showError('Errore nell\'eliminazione del manuale');
    }
  };

  const filteredManuals = manuals.filter((manual) =>
    manual.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="manuals-page-container">
        <LoadingState message="Caricamento manuali..." />
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
          {filteredManuals.map((manual) => (
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
                <button className="edit-button" onClick={() => openEditModal(manual)}>
                  <FontAwesomeIcon icon={faEdit} /> Modifica
                </button>
                <button className="delete-button" onClick={() => setManualToDelete(manual.id ?? null)}>
                  <FontAwesomeIcon icon={faTrash} /> Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
        <FloatingAddButton label="Aggiungi manuale" onClick={openAddModal} />
      </div>

      <FormModal
        open={isModalOpen}
        title={editingId !== null ? 'Modifica Manuale' : 'Aggiungi Manuale'}
        submitLabel={editingId !== null ? 'Salva Modifiche' : 'Aggiungi'}
        onSubmit={handleSave}
        onClose={closeModal}
      >
        <label>
          Titolo:
          <input type="text" name="title" value={form.title} onChange={handleInputChange} autoFocus />
        </label>
        <label>
          Link:
          <input type="text" name="link" value={form.link} onChange={handleInputChange} />
        </label>
      </FormModal>

      <ConfirmDialog
        open={manualToDelete !== null}
        message="Sei sicuro di voler cancellare il manuale?"
        onConfirm={handleDelete}
        onCancel={() => setManualToDelete(null)}
      />
    </div>
  );
};

export default Manuals;
