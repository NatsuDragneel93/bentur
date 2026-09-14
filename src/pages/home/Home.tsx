import React from 'react';
import './Home.scss';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {

  const navigate = useNavigate();
  const cardItems = [
    'Tours',
    'To Do',
    'To Buy',
    'My Inventory',
    'Manuals',
    'Useful Contacts',
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="home-page-container">
      <div className="card-container">
        {cardItems.map((item) => (
          <button
            key={item}
            type="button"
            className="custom-card"
            onClick={() => handleCardClick(`/${item.toLowerCase().replace(/\s+/g, '-')}`)}
          >
            <span className="custom-card-title">{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
