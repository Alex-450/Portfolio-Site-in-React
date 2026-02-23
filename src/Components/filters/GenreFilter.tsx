import { useState } from 'react';

interface GenreFilterProps {
  genres: string[];
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
}

const GenreFilter = ({
  genres,
  selectedGenres,
  onChange,
}: GenreFilterProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  if (genres.length === 0) {
    return null;
  }

  return (
    <div className="genre-filter">
      <button
        className="filter-select genre-filter-button"
        onClick={() => setShowDropdown(!showDropdown)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      >
        {selectedGenres.length === 0
          ? 'All Genres'
          : `${selectedGenres.length} Genre${selectedGenres.length > 1 ? 's' : ''}`}
      </button>
      {showDropdown && (
        <div className="genre-filter-dropdown">
          {genres.map((genre) => (
            <label key={genre} className="genre-filter-option">
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedGenres, genre]);
                  } else {
                    onChange(selectedGenres.filter((g) => g !== genre));
                  }
                }}
              />
              {genre}
            </label>
          ))}
          {selectedGenres.length > 0 && (
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

export default GenreFilter;
