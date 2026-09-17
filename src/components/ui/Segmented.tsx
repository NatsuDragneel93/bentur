import { useId } from 'react';
import './ui.scss';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  // Nome completo per screen reader, se diverso dall'etichetta (es. "IT" -> "Italiano")
  title?: string;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

// Scelta singola tra poche opzioni affiancate (lingua, categoria dei contatti)
function Segmented<T extends string>({ options, value, onChange, ariaLabel, className }: SegmentedProps<T>) {
  const name = useId();

  return (
    <div className={['seg', className].filter(Boolean).join(' ')} role="radiogroup" aria-label={ariaLabel}>
      {options.map(option => (
        <label key={option.value} className="seg-opt" title={option.title}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            aria-label={option.title}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export default Segmented;
