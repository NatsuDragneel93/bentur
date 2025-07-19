 import React, { useState, useEffect, useRef } from 'react';
import './Header.scss';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useFirebase } from '../context/firebase.context';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const firebase = useFirebase();
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [firebase.auth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut(firebase.auth);
      console.log('Logout effettuato con successo');
      navigate('/');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">Ben Tur</h1>
        <button className="menu-toggle" onClick={toggleMenu}>
          <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
        </button>
        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          {isMenuOpen && (
            <button className="close-menu" onClick={toggleMenu}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
          <Link to="/home" className="header-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/tours" className="header-link" onClick={() => setIsMenuOpen(false)}>Tours</Link>
          <Link to="/to-do" className="header-link" onClick={() => setIsMenuOpen(false)}>To Do</Link>
          <Link to="/to-buy" className="header-link" onClick={() => setIsMenuOpen(false)}>To Buy</Link>
          <Link to="/my-inventory" className="header-link" onClick={() => setIsMenuOpen(false)}>My Inventory</Link>
          <Link to="/manuals" className="header-link" onClick={() => setIsMenuOpen(false)}>Manuals</Link>
          <Link to="/useful-contacts" className="header-link" onClick={() => setIsMenuOpen(false)}>Useful Contacts</Link>
        </nav>
        
        {/* Profile Menu */}
        {user && (
          <div className="profile-menu-container" ref={profileMenuRef}>
            <button className="profile-button" onClick={toggleProfileMenu}>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="profile-image"
                  onError={(e) => {
                    // Fallback se l'immagine non carica
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="profile-avatar-fallback">' + 
                      (user.displayName?.charAt(0) || user.email?.charAt(0) || 'U') + '</div>';
                  }}
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
            </button>
            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <span className="profile-name">{user.displayName || 'Utente'}</span>
                  <span className="profile-email">{user.email}</span>
                </div>
                <hr className="profile-divider" />
                <button className="logout-button" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  Logout
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