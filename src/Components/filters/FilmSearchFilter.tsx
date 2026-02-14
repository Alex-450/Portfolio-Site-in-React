import { useState } from 'react';
import { FilmWithCinemasLite } from '../../types';
import { filterFilmsBySearch } from '../../utils/filmFilters';

interface FilmSearchFilterProps {
  films: FilmWithCinemasLite[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect: (title: string) => void;
  onClear: () => void;
}

const FilmSearchFilter = ({
  films,
  searchValue,
  onSearchChange,
  onSelect,
  onClear,
}: FilmSearchFilterProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const matchingFilms = filterFilmsBySearch(films, searchValue);

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
        placeholder="Search films..."
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
      {showDropdown && matchingFilms.length > 0 && (
        <ul className="film-search-dropdown">
          {matchingFilms.map((film) => (
            <li
              key={film.title}
              onMouseDown={() => {
                onSelect(film.title);
                setShowDropdown(false);
              }}
            >
              {film.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FilmSearchFilter;
