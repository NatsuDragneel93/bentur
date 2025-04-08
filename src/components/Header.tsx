import React from 'react';
import './Header.scss';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">Ben Tur</h1>
        <nav className="header-nav">
          <Link to="/home" className="header-link">Home</Link>
          <Link to="/tours" className="header-link">Tours</Link>
          <Link to="/to-do" className="header-link">To Do</Link>
          <Link to="/to-buy" className="header-link">To Buy</Link>
          <Link to="/my-inventory" className="header-link">My Inventory</Link>
          <Link to="/manuals" className="header-link">Manuals</Link>
          <Link to="/useful-contacts" className="header-link">Useful Contacts</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;