import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import './ui.scss';

interface FloatingAddButtonProps {
  // Testo per screen reader e tooltip, es. "Aggiungi manuale"
  label: string;
  onClick: () => void;
}

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ label, onClick }) => (
  <button type="button" className="bt-fab" onClick={onClick} aria-label={label} title={label}>
    <FontAwesomeIcon icon={faPlus} />
  </button>
);

export default FloatingAddButton;
