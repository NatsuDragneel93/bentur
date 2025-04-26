// import React, { useState } from 'react';
// import './Header.scss';
// import { Link } from 'react-router-dom';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

// const Header: React.FC = () => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen);
//   };

//   return (
//     <header className="header">
//       <div className="header-container">
//         <h1 className="header-title">Ben Tur</h1>
//         <button className="menu-toggle" onClick={toggleMenu}>
//           <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
//         </button>
//         <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
//           <Link to="/home" className="header-link">Home</Link>
//           <Link to="/tours" className="header-link">Tours</Link>
//           <Link to="/to-do" className="header-link">To Do</Link>
//           <Link to="/to-buy" className="header-link">To Buy</Link>
//           <Link to="/my-inventory" className="header-link">My Inventory</Link>
//           <Link to="/manuals" className="header-link">Manuals</Link>
//           <Link to="/useful-contacts" className="header-link">Useful Contacts</Link>
//         </nav>
//       </div>
//     </header>
//   );
// };

// export default Header;

import React, { useState } from 'react';
import './Header.scss';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
      </div>
    </header>
  );
};

export default Header;