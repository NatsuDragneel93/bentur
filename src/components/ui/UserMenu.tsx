import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import Button from './Button';
import './ui.scss';

// Foto Google più piccola e senza parametri che causano errori 400
const avatarUrl = (photoURL: string | null): string | null => {
  if (!photoURL) return null;
  return photoURL.includes('googleusercontent.com') ? photoURL.replace(/=s\d+-c$/, '=s72-c') : photoURL;
};

// Avatar in alto a destra: apre nome, email ed "Esci"
const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const photo = imageError ? null : avatarUrl(user.photoURL);
  const initial = (user.displayName || user.email || t('auth.defaultUserName')).charAt(0).toUpperCase();

  return (
    <div className="bt-user-menu" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="bt-user-menu__button"
        onClick={() => setOpen(current => !current)}
        aria-label={t('auth.profile')}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {photo
          ? <img src={photo} alt="" referrerPolicy="no-referrer" onError={() => setImageError(true)} />
          : <span aria-hidden="true">{initial}</span>}
      </button>

      {open && (
        <div className="bt-user-menu__dropdown">
          <div>
            <div className="bt-user-menu__name">{user.displayName || t('auth.defaultUserName')}</div>
            {user.email && <div className="bt-user-menu__email">{user.email}</div>}
          </div>
          <Button icon={faRightFromBracket} className="bt-user-menu__logout" onClick={handleLogout}>
            {t('auth.logout')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
