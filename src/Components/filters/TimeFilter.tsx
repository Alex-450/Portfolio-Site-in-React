import { useState } from 'react';

const TIME_OPTIONS = [
  { value: '12:00', label: 'From 12:00' },
  { value: '15:00', label: 'From 15:00' },
  { value: '18:00', label: 'From 18:00' },
  { value: '20:00', label: 'From 20:00' },
];

interface TimeFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const TimeFilter = ({ value, onChange }: TimeFilterProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getDisplayLabel = () => {
    if (!value) return 'Any Time';
    return TIME_OPTIONS.find((o) => o.value === value)?.label ?? value;
  };

  return (
    <div className="genre-filter">
      <button
        className={`filter-select genre-filter-button${value ? ' filter-toggle-active' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      >
        {getDisplayLabel()}
      </button>
      {showDropdown && (
        <div className="genre-filter-dropdown">
          {TIME_OPTIONS.map((option) => (
            <label key={option.value} className="genre-filter-option">
              <input
                type="radio"
                name="time-filter"
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

export default TimeFilter;
