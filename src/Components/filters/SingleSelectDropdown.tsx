import { useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SingleSelectDropdownProps {
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  defaultLabel: string;
  radioName: string;
}

const SingleSelectDropdown = ({
  options,
  value,
  onChange,
  defaultLabel,
  radioName,
}: SingleSelectDropdownProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const displayLabel = value
    ? (options.find((o) => o.value === value)?.label ?? value)
    : defaultLabel;

  return (
    <div className="genre-filter">
      <button
        className={`filter-select genre-filter-button${value ? ' filter-toggle-active' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      >
        {displayLabel}
      </button>
      {showDropdown && (
        <div className="genre-filter-dropdown">
          {options.map((option) => (
            <label key={option.value} className="genre-filter-option">
              <input
                type="radio"
                name={radioName}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          ))}
          {value && (
            <button
              className="genre-filter-clear"
              onMouseDown={() => onChange(null)}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SingleSelectDropdown;
