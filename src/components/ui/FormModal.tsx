import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { useAsyncAction } from '../../hooks/useAsyncAction';

interface FormModalProps {
  open: boolean;
  title: string;
  submitLabel: string;
  cancelLabel?: string;
  onSubmit: () => Promise<void> | void;
  onClose: () => void;
  children: React.ReactNode;
}

// Modale con form: gestisce invio con Enter, stato di salvataggio e blocco del doppio invio
const FormModal: React.FC<FormModalProps> = ({
  open,
  title,
  submitLabel,
  cancelLabel,
  onSubmit,
  onClose,
  children,
}) => {
  const { t } = useTranslation();
  const { pending, run } = useAsyncAction();

  return (
    <Modal open={open} title={title} onClose={onClose} preventClose={pending}>
      <form
        className="bt-modal__form"
        onSubmit={(event) => {
          event.preventDefault();
          run(onSubmit);
        }}
      >
        {children}
        <div className="bt-modal__actions">
          <button type="button" className="bt-button bt-button--secondary" onClick={onClose} disabled={pending}>
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button type="submit" className="bt-button bt-button--primary" disabled={pending}>
            {pending ? t('common.saving') : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FormModal;
