import { useState } from 'react';

interface CinemaFilterProps {
  selectedCinemas: string[];
  onChange: (cinemas: string[]) => void;
  cinemaNames: string[];
}

const CinemaFilter = ({ selectedCinemas, onChange, cinemaNames }: CinemaFilterProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  if (cinemaNames.length === 0) {
    return null;
  }

  return (
    <div className="genre-filter">
      <button
        className="filter-select genre-filter-button"
        onClick={() => setShowDropdown(!showDropdown)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      >
        {selectedCinemas.length === 0
          ? 'All Cinemas'
          : `${selectedCinemas.length} Cinema${selectedCinemas.length > 1 ? 's' : ''}`}
      </button>
      {showDropdown && (
        <div className="genre-filter-dropdown">
          {cinemaNames.map((name) => (
            <label key={name} className="genre-filter-option">
              <input
                type="checkbox"
                checked={selectedCinemas.includes(name)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedCinemas, name]);
                  } else {
                    onChange(selectedCinemas.filter((c) => c !== name));
                  }
                }}
              />
              {name}
            </label>
          ))}
          {selectedCinemas.length > 0 && (
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

export default CinemaFilter;
