import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { useAsyncAction } from '../../hooks/useAsyncAction';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

// Conferma per azioni distruttive (eliminazioni)
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { pending, run } = useAsyncAction();

  return (
    <Modal open={open} onClose={onCancel} preventClose={pending}>
      <p className="bt-modal__message">{message}</p>
      <div className="bt-modal__actions">
        <button type="button" className="bt-button bt-button--secondary" onClick={onCancel} disabled={pending}>
          {cancelLabel ?? t('common.cancel')}
        </button>
        <button type="button" className="bt-button bt-button--danger" onClick={() => run(onConfirm)} disabled={pending}>
          {confirmLabel ?? t('common.yes')}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
