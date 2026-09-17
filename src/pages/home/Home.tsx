import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  faAddressBook,
  faBookOpen,
  faBoxOpen,
  faCartShopping,
  faListCheck,
  faRoute,
} from '@fortawesome/free-solid-svg-icons';
import { useRequiredUser } from '../../hooks/useAuth';
import { MOBILE_MEDIA_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { NavCard } from '../../components/ui/Card';
import { Page, TopBar } from '../../components/ui/PageLayout';
// Dopo i componenti: gli stili della pagina devono venire dopo ui.scss
import './Home.scss';

const SECTIONS = [
  { path: '/tours', labelKey: 'nav.tours', descriptionKey: 'home.descriptions.tours', icon: faRoute },
  { path: '/to-do', labelKey: 'nav.toDo', descriptionKey: 'home.descriptions.toDo', icon: faListCheck },
  { path: '/to-buy', labelKey: 'nav.toBuy', descriptionKey: 'home.descriptions.toBuy', icon: faCartShopping },
  { path: '/my-inventory', labelKey: 'nav.inventory', descriptionKey: 'home.descriptions.inventory', icon: faBoxOpen },
  { path: '/manuals', labelKey: 'nav.manuals', descriptionKey: 'home.descriptions.manuals', icon: faBookOpen },
  { path: '/useful-contacts', labelKey: 'nav.contacts', descriptionKey: 'home.descriptions.contacts', icon: faAddressBook },
] as const;

// Hub dell'app: l'unica pagina con il selettore della lingua
const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const user = useRequiredUser();
  const mobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const name = user.displayName || user.email || t('auth.defaultUserName');

  return (
    <Page className="home">
      <TopBar
        start={<span className="bt-brand">BENTUR</span>}
        end={!mobile && <LanguageSwitcher />}
      />

      <h1 className="bt-page-title home__title">{t('home.title')}</h1>
      <p className="bt-page-subtitle home__subtitle">
        {name}
        <span className="home__provider"> · {t('home.signedInWithGoogle')}</span>
      </p>

      <nav className="home__grid" aria-label={t('home.title')}>
        {SECTIONS.map(section => (
          <NavCard
            key={section.path}
            size="lg"
            to={section.path}
            icon={section.icon}
            // Su cellulare "Contatti utili" non entra nella card
            title={t(mobile && section.labelKey === 'nav.contacts' ? 'nav.contactsShort' : section.labelKey)}
            description={t(section.descriptionKey)}
          />
        ))}
      </nav>

      {mobile && <LanguageSwitcher className="home__language" />}
    </Page>
  );
};

export default HomePage;
