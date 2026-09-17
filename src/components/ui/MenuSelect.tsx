import React, { useEffect, useId, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCaretDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import { buttonClassName } from './buttonClass';
import './ui.scss';

interface MenuOption {
  value: string;
  label: string;
}

interface MenuSelectProps {
  // Testo del pulsante (es. la città scelta)
  label: string;
  // Nome accessibile del pulsante
  ariaLabel: string;
  icon?: IconDefinition;
  options: MenuOption[];
  value: string;
  onChange: (value: string) => void;
}

// Pulsante con menu a tendina per scegliere un valore da un elenco
const MenuSelect: React.FC<MenuSelectProps> = ({ label, ariaLabel, icon, options, value, onChange }) => {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const openMenu = () => {
    setActiveIndex(Math.max(0, options.findIndex(option => option.value === value)));
    setOpen(true);
  };

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const choose = (option: MenuOption) => {
    onChange(option.value);
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex(index => Math.min(options.length - 1, index + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(index => Math.max(0, index - 1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (options[activeIndex]) choose(options[activeIndex]);
        break;
      case 'Escape':
      case 'Tab':
        close(event.key === 'Escape');
        break;
    }
  };

  return (
    <div className="bt-menu" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClassName({ className: 'bt-menu__button' })}
        onClick={() => (open ? close(false) : openMenu())}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
      >
        {icon && <FontAwesomeIcon icon={icon} />}
        {label}
        <FontAwesomeIcon icon={faCaretDown} className="bt-menu__caret" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          className="bt-menu__list"
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          aria-activedescendant={`${listId}-${activeIndex}`}
          onKeyDown={handleListKeyDown}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`bt-menu__option ${index === activeIndex ? 'bt-menu__option--active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option)}
            >
              <span className="bt-menu__check">
                {option.value === value && <FontAwesomeIcon icon={faCheck} />}
              </span>
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MenuSelect;
