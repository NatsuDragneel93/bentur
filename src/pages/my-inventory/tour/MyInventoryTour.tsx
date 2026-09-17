import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Page, PageTitle, TopBar } from '../../../components/ui/PageLayout';

// Sezione non ancora sviluppata
const MyInventoryTour: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Page>
      <TopBar back={{ label: t('nav.inventory'), onClick: () => navigate('/my-inventory') }} />
      <PageTitle title={t('inventoryTour.title')} />
    </Page>
  );
};

export default MyInventoryTour;
