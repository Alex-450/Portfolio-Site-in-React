import SingleSelectDropdown from './SingleSelectDropdown';
import { City, CITIES } from '../../data/cinemas';

interface CityFilterProps {
  value: City | null;
  onChange: (value: City | null) => void;
  // Only cities that actually have films in the current listing — a city whose
  // cinemas are all closed or unscraped isn't worth offering.
  availableCities?: City[];
}

const CityFilter = ({ value, onChange, availableCities }: CityFilterProps) => {
  const cities = availableCities ?? [...CITIES];

  return (
    <SingleSelectDropdown
      options={cities.map((city) => ({ value: city, label: city }))}
      value={value}
      onChange={(v) => onChange(v as City | null)}
      defaultLabel="All Cities"
      radioName="city-filter"
    />
  );
};

export default CityFilter;
