import { useState } from 'react';

interface DirectorFilterProps {
  directors: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect: (director: string) => void;
  onClear: () => void;
}

const DirectorFilter = ({
  directors,
  searchValue,
  onSearchChange,
  onSelect,
  onClear,
}: DirectorFilterProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const matchingDirectors = directors.filter((d) =>
    d.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (directors.length === 0) {
    return null;
  }

  return (
    <div className="film-search-container">
      <input
        type="text"
        value={searchValue}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder="Search directors..."
        className="filter-select filter-select-film"
      />
      {(showDropdown || searchValue) && (
        <button
          className="film-search-clear"
          onMouseDown={onClear}
        >
          X
        </button>
      )}
      {showDropdown && matchingDirectors.length > 0 && (
        <ul className="film-search-dropdown">
          {matchingDirectors.map((director) => (
            <li
              key={director}
              onMouseDown={() => {
                onSelect(director);
                setShowDropdown(false);
              }}
            >
              {director}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DirectorFilter;
