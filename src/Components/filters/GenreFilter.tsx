import MultiSelectDropdown from './MultiSelectDropdown';

interface GenreFilterProps {
  genres: string[];
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
}

const GenreFilter = ({
  genres,
  selectedGenres,
  onChange,
}: GenreFilterProps) => (
  <MultiSelectDropdown
    options={genres.map((g) => ({ value: g, label: g }))}
    selected={selectedGenres}
    onChange={onChange}
    allLabel="All Genres"
    selectedLabel={(n) => `${n} Genre${n > 1 ? 's' : ''}`}
  />
);

export default GenreFilter;
