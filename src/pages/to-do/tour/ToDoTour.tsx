import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Page, PageTitle, TopBar } from '../../../components/ui/PageLayout';

// Sezione non ancora sviluppata
const ToDoTour: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Page>
      <TopBar back={{ label: t('nav.toDo'), onClick: () => navigate('/to-do') }} />
      <PageTitle title={t('toDoTour.title')} subtitle={t('toDoTour.inProgress')} />
    </Page>
  );
};

export default ToDoTour;
