import React from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from './Dialog';
import Button from './Button';
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

// Dialogo con form: gestisce invio con Enter, stato di salvataggio e blocco del doppio invio
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
    <Dialog open={open} title={title} onClose={onClose} preventClose={pending}>
      <form
        className="bt-dialog-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          run(onSubmit);
        }}
      >
        {children}
        <div className="dialog-actions">
          <Button onClick={onClose} disabled={pending}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? t('common.saving') : submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default FormModal;
