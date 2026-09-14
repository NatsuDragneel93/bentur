import React from 'react';
import './Home.scss';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SECTIONS = [
  { path: '/tours', labelKey: 'nav.tours' },
  { path: '/to-do', labelKey: 'nav.toDo' },
  { path: '/to-buy', labelKey: 'nav.toBuy' },
  { path: '/my-inventory', labelKey: 'nav.inventory' },
  { path: '/manuals', labelKey: 'nav.manuals' },
  { path: '/useful-contacts', labelKey: 'nav.contacts' },
] as const;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="home-page-container">
      <div className="card-container">
        {SECTIONS.map((section) => (
          <button
            key={section.path}
            type="button"
            className="custom-card"
            onClick={() => navigate(section.path)}
          >
            <span className="custom-card-title">{t(section.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
