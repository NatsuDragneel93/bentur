import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
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
        {cardItems.map((item, index) => (
          <Card
            key={index}
            className="custom-card"
            onClick={() => handleCardClick(`/${item.toLowerCase().replace(/\s+/g, '-')}`)}
          >
            <CardContent className="custom-card-content">
              <Typography variant="h5" className="custom-card-title">
                {item}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

  );
};

export default HomePage;