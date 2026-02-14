import { useState } from 'react';

interface CinemaFilterProps {
  value: string;
  onChange: (value: string) => void;
  cinemaNames: string[];
}

const CinemaFilter = ({ value, onChange, cinemaNames }: CinemaFilterProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="genre-filter">
      <button
        className="filter-select genre-filter-button"
        onClick={() => setShowDropdown(!showDropdown)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      >
        {value || 'All Cinemas'}
      </button>
      {showDropdown && (
        <div className="genre-filter-dropdown">
          <div
            className="genre-filter-option"
            onMouseDown={() => {
              onChange('');
              setShowDropdown(false);
            }}
          >
            All Cinemas
          </div>
          {cinemaNames.map((name) => (
            <div
              key={name}
              className="genre-filter-option"
              onMouseDown={() => {
                onChange(name);
                setShowDropdown(false);
              }}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CinemaFilter;
