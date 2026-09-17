import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircleInfo, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ToastContext, ToastContextValue, ToastType } from './toast.context';
import IconButton from '../components/ui/IconButton';
import '../components/ui/ui.scss';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const TOAST_DURATION_MS = 4000;

const TOAST_ICONS = {
  success: faCheck,
  error: faTriangleExclamation,
  info: faCircleInfo,
} as const;

// Notifiche temporanee in basso allo schermo, al posto di alert()
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId.current++;
    setToasts(current => [...current, { id, message, type }]);
    timers.current.set(id, setTimeout(() => dismiss(id), TOAST_DURATION_MS));
  }, [dismiss]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach(timer => clearTimeout(timer));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    showToast,
    showSuccess: (message) => showToast(message, 'success'),
    showError: (message) => showToast(message, 'error'),
  }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="bt-toasts">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`bt-toast bt-toast--${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <FontAwesomeIcon icon={TOAST_ICONS[toast.type]} className="bt-toast__icon" />
            <span className="bt-toast__message">{toast.message}</span>
            <IconButton
              icon={faXmark}
              variant="ghost"
              className="bt-toast__close"
              label={t('common.closeNotification')}
              onClick={() => dismiss(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
