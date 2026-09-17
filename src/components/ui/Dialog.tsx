import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ui.scss';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  // Impedisce la chiusura (es. durante un salvataggio)
  preventClose?: boolean;
  children: React.ReactNode;
}

/**
 * Finestra modale: Esc e clic sullo sfondo chiudono, il focus resta dentro
 * finché è aperta e torna all'elemento che l'ha aperta alla chiusura.
 */
const Dialog: React.FC<DialogProps> = ({ open, title, onClose, preventClose = false, children }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Valori sempre aggiornati per i listener registrati una sola volta
  const closeRef = useRef({ onClose, preventClose });
  closeRef.current = { onClose, preventClose };

  useEffect(() => {
    if (!open) return;

    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;

    // Primo campo (o primo elemento attivabile), se nessun autoFocus l'ha già fatto
    if (dialog && !dialog.contains(document.activeElement)) {
      const firstField = dialog.querySelector<HTMLElement>('input, select, textarea') ?? dialog.querySelector<HTMLElement>(FOCUSABLE);
      (firstField ?? dialog).focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!closeRef.current.preventClose) closeRef.current.onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        // Chiude solo cliccando sullo sfondo, non dentro la finestra
        if (event.target === event.currentTarget && !preventClose) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        {title && <h2 id={titleId} className="dialog-title">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
