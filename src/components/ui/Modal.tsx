import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import './ui.scss';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  // Impedisce la chiusura (es. durante un salvataggio)
  preventClose?: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, title, onClose, preventClose = false, children }) => {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !preventClose) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, preventClose, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="bt-modal-overlay"
      onMouseDown={(event) => {
        // Chiude solo cliccando sullo sfondo, non dentro la finestra
        if (event.target === event.currentTarget && !preventClose) onClose();
      }}
    >
      <div
        className="bt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {title && <h2 id={titleId} className="bt-modal__title">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
