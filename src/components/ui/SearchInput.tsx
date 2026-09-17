import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Input } from './Input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

// Campo di ricerca con lente, largo al massimo 420px
const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder, className }) => (
  <div className={['bt-search', className].filter(Boolean).join(' ')}>
    <FontAwesomeIcon icon={faMagnifyingGlass} className="bt-search__icon" />
    <Input
      type="search"
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

export default SearchInput;
