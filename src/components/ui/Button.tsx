import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { buttonClassName, ButtonVariant } from './buttonClass';
import './ui.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  // Larghezza piena (azioni su cellulare)
  block?: boolean;
  // Azione distruttiva
  danger?: boolean;
  icon?: IconDefinition;
  ref?: React.Ref<HTMLButtonElement>;
}

// Pulsante Nocturne: il primario è un contorno in accento, mai pieno
const Button: React.FC<ButtonProps> = ({
  variant,
  block,
  danger,
  icon,
  className,
  type = 'button',
  children,
  ...props
}) => (
  <button type={type} className={buttonClassName({ variant, block, danger, className })} {...props}>
    {icon && <FontAwesomeIcon icon={icon} />}
    {children}
  </button>
);

export default Button;
