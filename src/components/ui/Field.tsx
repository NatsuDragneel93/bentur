import React, { useId } from 'react';
import './ui.scss';

interface FieldControlProps {
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

interface FieldProps {
  label: string;
  // Messaggio di errore mostrato sotto il campo
  error?: string | null;
  className?: string;
  // Un solo controllo (Input, Select, Textarea): riceve id e attributi di accessibilità
  children: React.ReactElement<FieldControlProps>;
}

// Etichetta sopra il controllo ed eventuale errore sotto
const Field: React.FC<FieldProps> = ({ label, error, className, children }) => {
  const generatedId = useId();
  const id = children.props.id ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label htmlFor={id}>{label}</label>
      {React.cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && <p id={errorId} className="bt-field-error">{error}</p>}
    </div>
  );
};

export default Field;
