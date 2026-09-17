import React from 'react';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Button from './Button';
import UserMenu from './UserMenu';
import './ui.scss';

export interface BackLink {
  // Nome della pagina di provenienza, es. "Home" o il nome dell'artista
  label: string;
  onClick: () => void;
}

interface PageProps {
  className?: string;
  children: React.ReactNode;
}

// Contenitore di pagina: contenuto allineato a sinistra, a tutta larghezza
export const Page: React.FC<PageProps> = ({ className, children }) => (
  <main className={['bt-page', className].filter(Boolean).join(' ')}>{children}</main>
);

interface TopBarProps {
  back?: BackLink;
  // Al posto del pulsante indietro (solo Home)
  start?: React.ReactNode;
  // Elementi prima dell'avatar
  end?: React.ReactNode;
}

// Riga in alto: pulsante indietro a sinistra, avatar con menu utente a destra
export const TopBar: React.FC<TopBarProps> = ({ back, start, end }) => (
  <div className="bt-topbar">
    {back && (
      <Button icon={faArrowLeft} className="bt-topbar__back" onClick={back.onClick}>
        <span>{back.label}</span>
      </Button>
    )}
    {start}
    <span className="bt-topbar__spacer" />
    {end}
    <UserMenu />
  </div>
);

interface PageTitleProps {
  title: string;
  // Etichetta maiuscola sopra il titolo, es. il ruolo dell'artista
  kicker?: string;
  subtitle?: React.ReactNode;
  // Azioni secondarie accanto al titolo
  actions?: React.ReactNode;
  // Azione principale ("Aggiungi..."): su cellulare fissata in basso a tutta larghezza
  primaryAction?: React.ReactNode;
  // 2 per i titoli di sezione dentro una pagina
  level?: 1 | 2;
  className?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, kicker, subtitle, actions, primaryAction, level = 1, className }) => {
  const Heading = level === 2 ? 'h2' : 'h1';
  return (
  <div className={['bt-title-row', className].filter(Boolean).join(' ')}>
    <div className="bt-title-row__text">
      {kicker && <div className="bt-kicker">{kicker}</div>}
      <Heading className="bt-page-title">{title}</Heading>
      {subtitle && <p className="bt-page-subtitle">{subtitle}</p>}
    </div>
    {(actions || primaryAction) && (
      <div className="bt-title-row__actions">
        {actions}
        {primaryAction && <div className="bt-primary-action">{primaryAction}</div>}
      </div>
    )}
  </div>
  );
};
