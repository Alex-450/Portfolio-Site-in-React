import MultiSelectDropdown from './MultiSelectDropdown';

interface CinemaFilterProps {
  selectedCinemas: string[];
  onChange: (cinemas: string[]) => void;
  cinemaNames: string[];
}

const CinemaFilter = ({
  selectedCinemas,
  onChange,
  cinemaNames,
}: CinemaFilterProps) => (
  <MultiSelectDropdown
    options={cinemaNames.map((name) => ({ value: name, label: name }))}
    selected={selectedCinemas}
    onChange={onChange}
    allLabel="All Cinemas"
    selectedLabel={(n) => `${n} Cinema${n > 1 ? 's' : ''}`}
  />
);

export default CinemaFilter;
