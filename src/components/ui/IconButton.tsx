import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { buttonClassName } from './buttonClass';
import './ui.scss';

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconDefinition;
  // Testo per screen reader e tooltip
  label: string;
  variant?: 'secondary' | 'ghost';
  danger?: boolean;
}

// Pulsante quadrato 36x36 con sola icona (modifica, elimina, azzera...)
const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = 'secondary',
  danger,
  className,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={buttonClassName({ variant, danger, className: ['btn-icon', className].filter(Boolean).join(' ') })}
    aria-label={label}
    title={label}
    {...props}
  >
    <FontAwesomeIcon icon={icon} />
  </button>
);

export default IconButton;
