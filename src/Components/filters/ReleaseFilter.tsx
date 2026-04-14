import { useState } from 'react';

type ReleaseFilterValue =
  | 'recently-added'
  | 'upcoming'
  | 'recently-released'
  | 're-releases'
  | null;

interface ReleaseFilterProps {
  value: ReleaseFilterValue;
  onChange: (value: ReleaseFilterValue) => void;
}

export const RELEASE_OPTIONS: { value: ReleaseFilterValue; label: string }[] = [
  { value: 'recently-added', label: 'Recently Added' },
  { value: 'upcoming', label: 'Upcoming Releases' },
  { value: 'recently-released', label: 'Recently Released' },
  { value: 're-releases', label: 'Re-releases' },
];

const ReleaseFilter = ({ value, onChange }: ReleaseFilterProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getDisplayLabel = () => {
    if (!value) return 'Release';
    return RELEASE_OPTIONS.find((o) => o.value === value)?.label ?? 'Release';
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
          {RELEASE_OPTIONS.map((option) => (
            <label key={option.value} className="genre-filter-option">
              <input
                type="radio"
                name="release-filter"
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

export default ReleaseFilter;
export type { ReleaseFilterValue };
