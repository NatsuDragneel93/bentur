import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      showError(t('manuals.loadError'));
    }
  }, [showError, t]);

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
      showError(t('manuals.requiredFields'));
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
      showError(t('manuals.saveError'));
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
      showError(t('manuals.deleteError'));
    }
  };

  const filteredManuals = manuals.filter((manual) =>
    manual.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="manuals-page-container">
        <LoadingState message={t('manuals.loading')} />
      </div>
    );
  }

  return (
    <div className="manuals-page-container">
      <div className="manuals-container">
        <h1>{t('manuals.title')}</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder={t('manuals.search')}
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
                  <FontAwesomeIcon icon={faExternalLinkAlt} /> {t('common.open')}
                </a>
                <button className="edit-button" onClick={() => openEditModal(manual)}>
                  <FontAwesomeIcon icon={faEdit} /> {t('common.edit')}
                </button>
                <button className="delete-button" onClick={() => setManualToDelete(manual.id ?? null)}>
                  <FontAwesomeIcon icon={faTrash} /> {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
        <FloatingAddButton label={t('manuals.add')} onClick={openAddModal} />
      </div>

      <FormModal
        open={isModalOpen}
        title={t(editingId !== null ? 'manuals.editTitle' : 'manuals.addTitle')}
        submitLabel={t(editingId !== null ? 'common.saveChanges' : 'common.add')}
        onSubmit={handleSave}
        onClose={closeModal}
      >
        <label>
          {t('manuals.titleField')}
          <input type="text" name="title" value={form.title} onChange={handleInputChange} autoFocus />
        </label>
        <label>
          {t('manuals.linkField')}
          <input type="text" name="link" value={form.link} onChange={handleInputChange} />
        </label>
      </FormModal>

      <ConfirmDialog
        open={manualToDelete !== null}
        message={t('manuals.deleteConfirm')}
        onConfirm={handleDelete}
        onCancel={() => setManualToDelete(null)}
      />
    </div>
  );
};

export default Manuals;
