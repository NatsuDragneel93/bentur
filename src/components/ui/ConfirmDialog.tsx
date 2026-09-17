import React from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from './Dialog';
import Button from './Button';
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
    <Dialog open={open} onClose={onCancel} preventClose={pending}>
      <p className="dialog-body">{message}</p>
      <div className="dialog-actions">
        <Button onClick={onCancel} disabled={pending}>
          {cancelLabel ?? t('common.cancel')}
        </Button>
        <Button danger onClick={() => run(onConfirm)} disabled={pending}>
          {confirmLabel ?? t('common.yes')}
        </Button>
      </div>
    </Dialog>
  );
};

export default ConfirmDialog;
