import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faPen, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { useRequiredUser } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import manualsService, { Manual } from '../../services/manuals.service';
import FormModal from '../../components/ui/FormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingState from '../../components/ui/LoadingState';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import Field from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import SearchInput from '../../components/ui/SearchInput';
import { buttonClassName } from '../../components/ui/buttonClass';
import { Page, PageTitle, TopBar } from '../../components/ui/PageLayout';
import { FormErrors, hasErrors, requiredFieldErrors, withoutError } from '../../utils/formErrors';
import { shortUrl } from '../../utils/url';
import './Manuals.scss';

type ManualForm = Pick<Manual, 'title' | 'link'>;

const emptyForm: ManualForm = { title: '', link: '' };

const Manuals: React.FC = () => {
  const user = useRequiredUser();
  const { showError } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ManualForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors<ManualForm>>({});
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
    const field = name as keyof ManualForm;
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => withoutError(current, field));
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (manual: Manual) => {
    setForm({ title: manual.title, link: manual.link });
    setErrors({});
    setEditingId(manual.id ?? null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const validation = requiredFieldErrors(form, { title: 'manuals.titleRequired', link: 'manuals.linkRequired' });
    if (hasErrors(validation)) {
      setErrors(validation);
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

  return (
    <Page className="manuals">
      <TopBar back={{ label: t('nav.home'), onClick: () => navigate('/home') }} />

      <PageTitle
        title={t('manuals.title')}
        subtitle={t('manuals.subtitle')}
        primaryAction={
          <Button variant="primary" icon={faPlus} className="bt-btn-lg" onClick={openAddModal}>
            {t('manuals.add')}
          </Button>
        }
      />

      <SearchInput
        className="manuals__search"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder={t('manuals.search')}
      />

      {loading ? (
        <LoadingState message={t('manuals.loading')} />
      ) : (
        <table className="table manuals__table">
          <thead>
            <tr>
              <th>{t('manuals.titleField')}</th>
              <th>{t('manuals.linkField')}</th>
              <th className="manuals__actions-column"><span className="bt-sr-only">{t('common.actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredManuals.map((manual) => (
              <tr key={manual.id}>
                <td className="manuals__title">{manual.title}</td>
                <td className="manuals__link" title={manual.link}>{shortUrl(manual.link)}</td>
                <td className="manuals__actions">
                  <a
                    href={manual.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClassName({ variant: 'primary', className: 'manuals__open' })}
                    aria-label={t('manuals.openLabel', { title: manual.title })}
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                    <span className="manuals__open-label">{t('common.open')}</span>
                  </a>
                  <IconButton
                    icon={faPen}
                    label={t('manuals.editLabel', { title: manual.title })}
                    onClick={() => openEditModal(manual)}
                  />
                  <IconButton
                    icon={faTrashCan}
                    danger
                    label={t('manuals.deleteLabel', { title: manual.title })}
                    onClick={() => setManualToDelete(manual.id ?? null)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <FormModal
        open={isModalOpen}
        title={t(editingId !== null ? 'manuals.editTitle' : 'manuals.addTitle')}
        submitLabel={t(editingId !== null ? 'common.saveChanges' : 'common.add')}
        onSubmit={handleSave}
        onClose={closeModal}
      >
        <Field label={t('manuals.titleField')} error={errors.title && t(errors.title)}>
          <Input
            name="title"
            value={form.title}
            onChange={handleInputChange}
            placeholder={t('manuals.titlePlaceholder')}
            autoFocus
          />
        </Field>
        <Field label={t('manuals.linkField')} error={errors.link && t(errors.link)}>
          <Input
            name="link"
            value={form.link}
            onChange={handleInputChange}
            placeholder={t('manuals.linkPlaceholder')}
          />
        </Field>
      </FormModal>

      <ConfirmDialog
        open={manualToDelete !== null}
        message={t('manuals.deleteConfirm')}
        onConfirm={handleDelete}
        onCancel={() => setManualToDelete(null)}
      />
    </Page>
  );
};

export default Manuals;
