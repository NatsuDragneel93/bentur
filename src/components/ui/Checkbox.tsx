import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons';
import './ui.scss';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  large?: boolean;
}

// Casella di spunta: input nativo (accessibile) con disegno Nocturne
const Checkbox: React.FC<CheckboxProps> = ({ large = false, checked, className, ...props }) => (
  <span className={['bt-checkbox', large && 'bt-checkbox--large', className].filter(Boolean).join(' ')}>
    <input type="checkbox" checked={checked} {...props} />
    {checked
      ? <FontAwesomeIcon icon={faSquareCheck} className="bt-checkbox__check" />
      : <span className="bt-checkbox__box" />}
  </span>
);

export default Checkbox;
