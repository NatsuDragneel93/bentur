import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import './ui.scss';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // Bordo sottile di elevazione (default)
  elevated?: boolean;
}

// Superficie base di Nocturne
export const Card: React.FC<CardProps> = ({ elevated = true, className, ...props }) => (
  <div className={['card', elevated && 'elev-sm', className].filter(Boolean).join(' ')} {...props} />
);

interface NavCardProps {
  to: string;
  icon: IconDefinition;
  title: string;
  description?: string;
  // Etichetta in alto a destra (es. stato della sezione)
  tag?: React.ReactNode;
  // Trattino neutro invece che in accento (sezione vuota)
  mutedRule?: boolean;
  size?: 'md' | 'lg';
}

// Card di navigazione: icona in alto; trattino, titolo e descrizione in basso
export const NavCard: React.FC<NavCardProps> = ({ to, icon, title, description, tag, mutedRule = false, size = 'md' }) => (
  <Link to={to} className={`card elev-sm bt-nav-card ${size === 'lg' ? 'bt-nav-card--lg' : ''}`}>
    <span className="bt-nav-card__top">
      <FontAwesomeIcon icon={icon} className="bt-nav-card__icon" />
      {tag}
    </span>
    <span>
      <span className={`bt-nav-card__rule ${mutedRule ? 'bt-nav-card__rule--muted' : ''}`} />
      <span className="bt-nav-card__title">{title}</span>
      {description && <span className="bt-nav-card__description">{description}</span>}
    </span>
  </Link>
);

interface RowCardProps {
  to: string;
  title: string;
  meta?: React.ReactNode;
  // Icona o avatar a sinistra
  leading: React.ReactNode;
  // Tag e pulsanti a destra, cliccabili senza aprire la card
  trailing?: React.ReactNode;
  compact?: boolean;
}

// Riga a tutta larghezza: il titolo è un link esteso a tutta la card
export const RowCard: React.FC<RowCardProps> = ({ to, title, meta, leading, trailing, compact = false }) => (
  <div className={`card elev-sm bt-row-card ${compact ? 'bt-row-card--compact' : ''}`}>
    <span className="bt-row-card__leading">{leading}</span>
    <div className="bt-row-card__main">
      <Link to={to} className="bt-row-card__link">{title}</Link>
      {meta && <div className="bt-row-card__meta">{meta}</div>}
    </div>
    <div className="bt-row-card__trailing">
      {trailing}
      <FontAwesomeIcon icon={faArrowRight} className="bt-row-card__arrow" aria-hidden="true" />
    </div>
  </div>
);
