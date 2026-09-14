import React, { useState, useEffect, useRef } from 'react';
import './Header.scss';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../hooks/useAuth';
import LanguageSwitcher from './LanguageSwitcher';

const NAV_LINKS = [
  { to: '/home', labelKey: 'nav.home' },
  { to: '/tours', labelKey: 'nav.tours' },
  { to: '/to-do', labelKey: 'nav.toDo' },
  { to: '/to-buy', labelKey: 'nav.toBuy' },
  { to: '/my-inventory', labelKey: 'nav.inventory' },
  { to: '/manuals', labelKey: 'nav.manuals' },
  { to: '/useful-contacts', labelKey: 'nav.contacts' },
] as const;

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProcessedImageUrl = (photoURL: string | null): string | null => {
    if (!photoURL) return null;
    
    // Per le immagini di Google, forza una dimensione più piccola e compatibile
    if (photoURL.includes('googleusercontent.com')) {
      // Rimuoviamo il cache busting che causa errore 400
      return photoURL.replace(/=s\d+-c$/, '=s40-c');
    }
    
    return photoURL;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">Ben Tur</h1>
        <button className="menu-toggle" onClick={toggleMenu} aria-label={t(isMenuOpen ? 'nav.closeMenu' : 'nav.openMenu')}>
          <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
        </button>
        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          {isMenuOpen && (
            <button className="close-menu" onClick={toggleMenu} aria-label={t('nav.closeMenu')}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to} className="header-link" onClick={() => setIsMenuOpen(false)}>
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
        
        {/* Profile Menu */}
        {user && (
          <div className="profile-menu-container" ref={profileMenuRef}>
            <button className="profile-button" onClick={toggleProfileMenu} aria-label={t('auth.profile')}>
              {user.photoURL && !imageLoadError ? (
                <img
                  src={getProcessedImageUrl(user.photoURL) || ''}
                  alt={t('auth.profile')}
                  className="profile-image"
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </button>
            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <span className="profile-name">{user.displayName || t('auth.defaultUserName')}</span>
                  <span className="profile-email">{user.email}</span>
                </div>
                <hr className="profile-divider" />
                <LanguageSwitcher />
                <hr className="profile-divider" />
                <button className="logout-button" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;