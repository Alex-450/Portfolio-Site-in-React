import SingleSelectDropdown from './SingleSelectDropdown';

const TIME_OPTIONS = [
  { value: '12:00', label: 'From 12:00' },
  { value: '15:00', label: 'From 15:00' },
  { value: '18:00', label: 'From 18:00' },
  { value: '20:00', label: 'From 20:00' },
];

interface TimeFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const TimeFilter = ({ value, onChange }: TimeFilterProps) => (
  <SingleSelectDropdown
    options={TIME_OPTIONS}
    value={value}
    onChange={onChange}
    defaultLabel="Any Time"
    radioName="time-filter"
  />
);

export default TimeFilter;
