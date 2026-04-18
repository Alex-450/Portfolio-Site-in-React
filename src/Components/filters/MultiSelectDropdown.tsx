import { useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel: string;
  selectedLabel: (count: number) => string;
}

const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  allLabel,
  selectedLabel,
}: MultiSelectDropdownProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="genre-filter">
      <button
        className="filter-select genre-filter-button"
        onClick={() => setShowDropdown(!showDropdown)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      >
        {selected.length === 0 ? allLabel : selectedLabel(selected.length)}
      </button>
      {showDropdown && (
        <div className="genre-filter-dropdown">
          {options.map((option) => (
            <label key={option.value} className="genre-filter-option">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, option.value]);
                  } else {
                    onChange(selected.filter((v) => v !== option.value));
                  }
                }}
              />
              {option.label}
            </label>
          ))}
          {selected.length > 0 && (
            <button
              className="genre-filter-clear"
              onMouseDown={() => onChange([])}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
