import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { faRoute, faUser } from '@fortawesome/free-solid-svg-icons';
import { NavCard } from '../ui/Card';
import { Page, TopBar } from '../ui/PageLayout';
import './ListHub.scss';

interface ListHubProps {
  title: string;
  // Percorso base: le due varianti sono basePath/personal e basePath/tour
  basePath: string;
}

// Scelta tra la versione personale e quella del tour di una sezione (To Do, Inventario)
const ListHub: React.FC<ListHubProps> = ({ title, basePath }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Page className="list-hub">
      <TopBar back={{ label: t('nav.home'), onClick: () => navigate('/home') }} />
      <h1 className="bt-page-title list-hub__title">{title}</h1>
      <nav className="list-hub__grid" aria-label={title}>
        <NavCard
          to={`${basePath}/personal`}
          icon={faUser}
          title={t('hub.personal')}
          description={t('hub.personalDescription')}
        />
        <NavCard
          to={`${basePath}/tour`}
          icon={faRoute}
          title={t('hub.tour')}
          description={t('hub.tourDescription')}
        />
      </nav>
    </Page>
  );
};

export default ListHub;
