import React from 'react';
import './MyInventory.scss';
import { useNavigate } from 'react-router-dom';

const MyInventory: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="my-inventory-page-container">
      <div className="inventory-cards-container">
        <div
          className="inventory-card"
          onClick={() => navigate('/my-inventory/personal')}
          style={{ cursor: 'pointer' }}
        >
          <span>Personal</span>
        </div>
        <div
          className="inventory-card"
          onClick={() => navigate('/my-inventory/tour')}
          style={{ cursor: 'pointer' }}
        >
          <span>Tour</span>
        </div>
      </div>
    </div>
  );
};

export default MyInventory;